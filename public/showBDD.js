document.addEventListener('DOMContentLoaded', async () => {
    const loadingMessage = document.getElementById('loading-message');
    const schemaGrid = document.getElementById('schema-grid');
    const svgContainer = document.getElementById('relation-lines-svg');

    /**
     * Analyse le texte du schéma Prisma et le transforme en cartes HTML.
     * @param {string} schemaText - Le contenu brut du fichier schema.prisma.
     */
    function parseAndRenderSchema(schemaText) {
        schemaGrid.innerHTML = ''; // Vider le conteneur
        const relations = [];
        const modelNames = new Set();
        const allCards = [];


        // Regex pour trouver les blocs 'model' et 'enum'
        const blockRegex = /(model|enum)\s+(\w+)\s*\{([^}]+)\}/g;
        let match;

        while ((match = blockRegex.exec(schemaText)) !== null) {
            const blockType = match[1]; // 'model' ou 'enum'
            const blockName = match[2];
            const blockBody = match[3];
            if (blockType === 'model') {
                modelNames.add(blockName);
            }
            const cardData = { blockName, blockType, blockBody };

            const card = document.createElement('div');
            card.className = 'model-card';
            card.id = `model-card-${blockName}`;

            const header = document.createElement('div');
            header.className = 'model-header';
            header.textContent = blockName;
            header.style.cursor = 'pointer'; // Indique que l'en-tête est cliquable
            card.appendChild(header);

            const body = document.createElement('div');
            body.className = 'model-body';
            
            // Ajout des en-têtes de colonnes pour les modèles
            if (blockType === 'model') {
                const fieldsHeader = document.createElement('div');
                fieldsHeader.className = 'fields-header';
                fieldsHeader.innerHTML = `<span>Nom</span><span>Type</span><span>Attributs</span>`;
                body.appendChild(fieldsHeader);
            }


            const lines = blockBody.trim().split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//') && !line.startsWith('@@'));

            lines.forEach(line => {
                const row = document.createElement('div');
                row.className = 'field-row';

                if (blockType === 'model') {
                    const parts = line.split(/\s+/).filter(p => p);
                    if (parts.length < 2) return;

                    const name = parts[0];
                    const type = parts[1];
                    const attributes = parts.slice(2).join(' ');

                    // Détecter si le type est un autre modèle (une relation)
                    const cleanType = type.replace('[]', '').replace('?', '');
                    let typeHtml = type;
                    if (modelNames.has(cleanType)) {
                        relations.push({ from: blockName, to: cleanType });
                        typeHtml = `<span class="field-type relation-link" data-target-model="${cleanType}">${type}</span>`;
                    } else {
                        typeHtml = `<span class="field-type">${type}</span>`;
                    }

                    row.innerHTML = `
                        <span class="field-name">${name}</span>
                        ${typeHtml}
                        <span class="field-attributes">${
                            attributes.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                        }</span>
                    `;
                } else { // C'est un enum
                    row.innerHTML = `<span class="field-name">${line}</span>`;
                }
                body.appendChild(row);
            });

            card.appendChild(body);
            allCards.push({ name: blockName, cardElement: card, cardData: cardData });
        }

        // --- Algorithme de tri topologique pour l'agencement ---
        const inDegree = new Map();
        const adj = new Map();

        allCards.forEach(item => {
            inDegree.set(item.name, 0);
            adj.set(item.name, []);
        });

        relations.forEach(rel => {
            adj.get(rel.from).push(rel.to);
            inDegree.set(rel.to, (inDegree.get(rel.to) || 0) + 1);
        });

        const queue = allCards.filter(item => inDegree.get(item.name) === 0).map(item => item.name);
        const sortedOrder = [];

        while (queue.length > 0) {
            const u = queue.shift();
            sortedOrder.push(u);

            (adj.get(u) || []).forEach(v => {
                inDegree.set(v, inDegree.get(v) - 1);
                if (inDegree.get(v) === 0) {
                    queue.push(v);
                }
            });
        }

        // Ajouter les modèles restants (ceux qui ne sont pas dans le tri, comme les enums)
        allCards.forEach(item => {
            if (!sortedOrder.includes(item.name)) {
                sortedOrder.push(item.name);
            }
        });

        // Trier les cartes et les ajouter au DOM
        const cardMap = new Map(allCards.map(item => [item.name, item.cardElement]));
        sortedOrder.forEach(name => {
            const cardElement = cardMap.get(name);
            if (cardElement) {
                schemaGrid.appendChild(cardElement);
            }
        });
    
        // Ajoute un gestionnaire d'événements de clic à chaque carte
        schemaGrid.querySelectorAll('.model-header').forEach(header => {
            header.addEventListener('click', () => showTableData(header.textContent));
        });

        // Ajoute un gestionnaire de clic pour les liens de relation
        schemaGrid.querySelectorAll('.relation-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche le déclenchement du clic sur la carte
                const targetModel = e.target.dataset.targetModel;
                const targetCard = document.getElementById(`model-card-${targetModel}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Mettre en surbrillance la carte cible
                    targetCard.style.transition = 'box-shadow 0.1s ease-in-out';
                    targetCard.style.boxShadow = '0 0 25px #4dd0e1';
                    setTimeout(() => {
                        targetCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    }, 1500);
                }
            });
        });

        // On attend un court instant que le DOM soit peint avant de dessiner les lignes
        setTimeout(() => drawRelationLines(relations), 100);
    }

    /**
     * Dessine les lignes de relation entre les cartes de modèle.
     * @param {Array<{from: string, to: string}>} relations 
     */
    function drawRelationLines(relations) {
        svgContainer.innerHTML = ''; // Nettoyer les anciennes lignes
        const containerRect = schemaGrid.getBoundingClientRect();

        relations.forEach(rel => {
            const fromCard = document.getElementById(`model-card-${rel.from}`);
            const toCard = document.getElementById(`model-card-${rel.to}`);

            if (!fromCard || !toCard || fromCard === toCard) return;

            const fromRect = fromCard.getBoundingClientRect();
            const toRect = toCard.getBoundingClientRect();

            // Points de départ et d'arrivée relatifs au conteneur SVG
            const startX = (fromRect.right - containerRect.left + fromRect.left - containerRect.left) / 2;
            const startY = fromRect.bottom - containerRect.top;

            const endX = (toRect.right - containerRect.left + toRect.left - containerRect.left) / 2;
            const endY = toRect.top - containerRect.top;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${startX},${startY} C ${startX},${startY + 60} ${endX},${endY - 60} ${endX},${endY}`;
            
            path.setAttribute('d', d);
            path.setAttribute('stroke', 'rgba(77, 208, 225, 0.6)');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            svgContainer.appendChild(path);
        });

        // Définir la flèche une seule fois
        if (!svgContainer.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(77, 208, 225, 0.6)" />
                </marker>`;
            svgContainer.prepend(defs);
        }
    }

    try {
        // 1. Vérifier l'authentification
        const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
        if (!authResponse.ok) throw new Error('Non authentifié');
        const authStatus = await authResponse.json();
        if (!authStatus.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // 2. Récupérer le schéma
        const response = await fetch('/api/database/schema', { credentials: 'include' });
        if (!response.ok) {
            let errorText = `Erreur HTTP ${response.status}`;
            try {
                const errorJson = await response.json();
                errorText = errorJson.error || errorText;
            } catch (e) {
                // Si la réponse n'est pas du JSON, c'est probablement une redirection HTML
                // ou une autre erreur inattendue. Le cas le plus courant est une déconnexion.
                if (response.status === 401) {
                    errorText = 'Votre session a expiré. Veuillez vous reconnecter.';
                } else {
                    errorText = 'Erreur serveur lors de la récupération du schéma.';
                }
            }
            throw new Error(errorText);
        }
        const { schema } = await response.json();

        // 3. Afficher le schéma avec coloration
        loadingMessage.style.display = 'none';
        schemaGrid.style.display = 'grid';

        parseAndRenderSchema(schema);

        // Redessiner les lignes lors du redimensionnement de la fenêtre
        window.addEventListener('resize', () => parseAndRenderSchema(schema));

    } catch (error) {
        loadingMessage.innerHTML = `<p style="color: red;">Erreur: ${error.message}</p>`;
        console.error('Erreur lors du chargement du schéma:', error);
    }

    // --- Fonctions utilitaires ---

    /**
     * Récupère les données d'une table et les affiche dans une popup.
     * @param {string} tableName - Le nom de la table à récupérer.
     */
    async function showTableData(tableName) {
        try {
            const response = await fetch(`/api/database/table/${tableName}`, { credentials: 'include' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la récupération des données.');
            }
            const data = await response.json();
            displayDataInPopup(tableName, data);
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }

    /**
     * Affiche les données dans une fenêtre contextuelle.
     * @param {string} tableName - Le nom de la table.
     * @param {Array<object>} data - Les données à afficher.
     */
    function displayDataInPopup(tableName, data) {
        const modalOverlay = document.getElementById('data-modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body-content');
        const closeButton = document.getElementById('modal-close-button');

        // Mettre à jour le titre
        modalTitle.textContent = `Enregistrements de la table : ${tableName}`;

        // Vider le contenu précédent
        modalBody.innerHTML = '';

        if (!data || data.length === 0) {
            modalBody.innerHTML = '<p>Aucun enregistrement trouvé pour cette table.</p>';
        } else {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            const headerRow = document.createElement('tr');

            // Créer les en-têtes
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Créer les lignes de données
            data.forEach(rowData => {
                const row = document.createElement('tr');
                Object.values(rowData).forEach(value => {
                    const td = document.createElement('td');
                    // Gérer les objets/tableaux pour un affichage lisible
                    if (typeof value === 'object' && value !== null) {
                        td.innerHTML = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
                    } else {
                        // Essayer de détecter si c'est une date au format ISO
                        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                            try {
                                td.textContent = new Date(value).toLocaleString();
                            } catch (e) { td.textContent = value; }
                        } else {
                            td.textContent = value;
                        }
                    }
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            modalBody.appendChild(table);
        }

        // Afficher la modale
        modalOverlay.style.display = 'flex';

        // Gérer la fermeture
        const closeModal = () => modalOverlay.style.display = 'none';
        closeButton.onclick = closeModal;
        modalOverlay.onclick = (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        };
    }
});
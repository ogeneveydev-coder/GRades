document.addEventListener('DOMContentLoaded', async () => {
    const loadingMessage = document.getElementById('loading-message');
    const schemaGrid = document.getElementById('schema-grid');    

    /**
     * Analyse le texte du schéma Prisma et le transforme en cartes HTML.
     * @param {string} schemaText - Le contenu brut du fichier schema.prisma.
     */
    function parseAndRenderSchema(schemaText) {
        schemaGrid.innerHTML = ''; // Vider le conteneur

        // Regex pour trouver les blocs 'model' et 'enum'
        const blockRegex = /(model|enum)\s+(\w+)\s*\{([^}]+)\}/g;
        let match;

        while ((match = blockRegex.exec(schemaText)) !== null) {
            const blockType = match[1]; // 'model' ou 'enum'
            const blockName = match[2];
            const blockBody = match[3];

            const card = document.createElement('div');
            card.className = 'model-card';

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

                    row.innerHTML = `
                        <span class="field-name">${name}</span>
                        <span class="field-type">${type}</span>
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
            schemaGrid.appendChild(card);
        }
    
        // Ajoute un gestionnaire d'événements de clic à chaque carte
        schemaGrid.querySelectorAll('.model-header').forEach(header => {
            header.addEventListener('click', () => showTableData(header.textContent));
        });
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
                        td.textContent = value;
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
document.addEventListener('DOMContentLoaded', async () => {
    /**
     * Vérifie si l'utilisateur est connecté.
     * Redirige vers la page de connexion si ce n'est pas le cas.
     * @returns {Promise<boolean>} - Vrai si l'utilisateur est connecté, sinon ne retourne jamais (redirection).
     */
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/status', { credentials: 'include' });
            if (!response.ok) throw new Error('Réponse serveur non OK');
            const authStatus = await response.json();
            if (!authStatus.loggedIn) {
                window.location.href = '/login.html';
                return false;
            }
            // Si l'utilisateur est connecté, on crée l'en-tête
            const headerContainer = document.createElement('div');
            headerContainer.style.position = 'absolute';
            headerContainer.style.top = '10px';
            headerContainer.style.right = '20px';
            headerContainer.style.zIndex = '1000';
            headerContainer.style.fontFamily = 'sans-serif';
            headerContainer.style.display = 'flex';
            headerContainer.style.alignItems = 'center';
            headerContainer.innerHTML = `
                <span style="margin-right: 15px;">${authStatus.email}</span>
                <a href="#" id="global-logout-btn" title="Déconnexion" style="text-decoration: none; font-size: 1.5em; color: #dc3545;">&#9211;</a>
            `;
            document.body.prepend(headerContainer);
            document.getElementById('global-logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/login.html';
            });
            return true;
        } catch (error) {
            console.error('Erreur lors de la vérification du statut de connexion:', error);
            window.location.href = '/login.html'; // Redirection par sécurité
            return false;
        }
    }

    // Si l'authentification échoue, on arrête tout.
    if (!(await checkAuth())) {
        return;
    }

    // --- Application principale ---
    const adminApp = {
        // Références aux éléments du DOM
        elements: {
            form: document.getElementById('grade-form'),
            statusMessage: document.getElementById('status-message'),
            gradesList: document.getElementById('existing-grades-list'),
            deleteBtn: document.getElementById('delete-btn'),
            newGradeBtn: document.getElementById('new-grade-btn'),
            detailsPanel: document.getElementById('grade-details-panel'),
            pictogrammeInput: document.getElementById('pictogramme'),
            pictogrammePreview: document.getElementById('pictogramme-preview'),
            logoutBtn: document.getElementById('logout-btn'),
            usersContainer: document.getElementById('users-table-container'),
            xpContainer: document.getElementById('xp-curve-container'),
            objectsContainer: document.getElementById('objects-table-container'),
            objectDetailsPanel: document.getElementById('object-details-panel'),
            objectForm: document.getElementById('object-form'),
            newObjectBtn: document.getElementById('new-object-btn'),
            deleteObjectBtn: document.getElementById('delete-object-btn'),
            objectStatusMessage: document.getElementById('object-status-message'),
        },

        // État de l'application
        state: {
            currentGrades: [],
            selectedGradeId: null,
            currentObjects: [],
            selectedObjectId: null,
        },

        /**
         * Initialise l'application, charge les données et attache les écouteurs d'événements.
         */
        init() {
            this.elements.detailsPanel.classList.add('hidden');
            this.elements.objectDetailsPanel.classList.add('hidden');
            this.setupEventListeners();
            this.loadGrades();
            this.loadUsers();
            this.loadXpCurve();
            this.loadObjects();
        },

        /**
         * Configure tous les écouteurs d'événements.
         */
        setupEventListeners() {
            this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            this.elements.pictogrammeInput.addEventListener('input', this.updatePictogrammePreview.bind(this));
            this.elements.deleteBtn.addEventListener('click', this.handleDelete.bind(this));
            this.elements.newGradeBtn.addEventListener('click', this.handleNewGrade.bind(this));
            this.elements.gradesList.addEventListener('click', this.handleGradeSelection.bind(this));
            this.elements.newObjectBtn.addEventListener('click', this.handleNewObject.bind(this));
            this.elements.objectsContainer.addEventListener('click', this.handleObjectSelection.bind(this));
            this.elements.objectForm.addEventListener('submit', this.handleObjectFormSubmit.bind(this));
            this.elements.deleteObjectBtn.addEventListener('click', this.handleObjectDelete.bind(this));
        },

        // --- Méthodes de chargement et de rendu ---

        async loadGrades() {
            try {
                const response = await fetch('/api/grades');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Impossible de charger les grades.');
                }
                this.state.currentGrades = await response.json();
                this.renderGradesList();
            } catch (error) {
                console.error("Erreur lors du chargement des grades:", error);
                this.elements.gradesList.innerHTML = `<li>Erreur: ${error.message}</li>`;
            }
        },

        renderGradesList() {
            const { gradesList } = this.elements;
            gradesList.innerHTML = '';
            if (this.state.currentGrades.length === 0) {
                gradesList.innerHTML = '<li>Aucun grade trouvé.</li>';
                return;
            }
            this.state.currentGrades.forEach(grade => {
                const li = document.createElement('li');
                li.dataset.gradeId = grade.id;
                const pictogramme = grade.pictogramme ? `<img src="${grade.pictogramme}" style="height: 15px; vertical-align: middle; margin-right: 8px; image-rendering: pixelated;">` : `<span style="display: inline-block; width: 28px;"></span>`;
                li.innerHTML = `${pictogramme} ${grade.nom}`;
                if (grade.id === this.state.selectedGradeId) {
                    li.classList.add('selected');
                }
                gradesList.appendChild(li);
            });
        },

        async loadUsers() {
            const { usersContainer } = this.elements;
            if (!usersContainer) return;

            try {
                const response = await fetch('/api/users');
                if (!response.ok) throw new Error('Impossible de charger les utilisateurs.');
                const users = await response.json();
                this.renderUsersTable(users);
            } catch (error) {
                usersContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            }
        },

        renderUsersTable(users) {
            const { usersContainer } = this.elements;
            if (users.length === 0) {
                usersContainer.innerHTML = '<p>Aucun utilisateur trouvé.</p>';
                return;
            }

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Niveau Personnage</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">XP</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">PV</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.id}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.email}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.personnage?.niveau ?? 'N/A'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.personnage?.experience ?? 'N/A'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.personnage?.pointsDeVie ?? 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            usersContainer.innerHTML = '';
            usersContainer.appendChild(table);
        },

        async loadXpCurve() {
            const { xpContainer } = this.elements;
            if (!xpContainer) return;

            try {
                const response = await fetch('/api/xp-curve');
                if (!response.ok) throw new Error("Impossible de charger la courbe d'XP.");
                const xpCurve = await response.json();
                this.renderXpCurveTable(xpCurve);
            } catch (error) {
                xpContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            }
        },

        renderXpCurveTable(xpCurve) {
            const { xpContainer } = this.elements;
            if (xpCurve.length === 0) {
                xpContainer.innerHTML = '<p>Aucune donnée de courbe d\'XP trouvée.</p>';
                return;
            }

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead style="background-color: #f2f2f2; position: sticky; top: 0;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd;">Niveau</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">XP Total Requis</th>
                    </tr>
                </thead>
                <tbody>
                    ${xpCurve.map(entry => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${entry.level}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${entry.xpRequired.toLocaleString('fr-FR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            xpContainer.innerHTML = '';
            xpContainer.appendChild(table);
        },

        async loadObjects() {
            const { objectsContainer } = this.elements;
            if (!objectsContainer) return;

            try {
                const response = await fetch('/api/objects');
                if (!response.ok) throw new Error('Impossible de charger les objets.');
                this.state.currentObjects = await response.json();
                this.renderObjectsTable();
            } catch (error) {
                objectsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            }
        },

        renderObjectsTable(objects) {
            const { objectsContainer } = this.elements;
            if (!objectsContainer) return;

            if (this.state.currentObjects.length === 0) {
                objectsContainer.innerHTML = '<p>Aucun objet trouvé.</p>';
                // On s'assure que le panneau de détails est caché s'il n'y a pas d'objets
                this.elements.objectDetailsPanel.classList.add('hidden');
                return;
            }

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead style="background-color: #f2f2f2; position: sticky; top: 0;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Nom</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Type</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Rareté</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Poids</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.state.currentObjects.map(object => `
                        <tr 
                            data-object-id="${object.id}" 
                            style="cursor: pointer; ${object.id === this.state.selectedObjectId ? 'background-color: #e0f7ff;' : ''}"
                        >
                            <td style="padding: 8px; border: 1px solid #ddd;">${object.id}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${object.nom}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${object.type}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${object.rarete}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${object.poids}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            objectsContainer.innerHTML = '';
            objectsContainer.appendChild(table);
        },

        handleObjectSelection(event) {
            const row = event.target.closest('tr[data-object-id]');
            if (row) {
                this.state.selectedObjectId = parseInt(row.dataset.objectId, 10);
                const selectedObject = this.state.currentObjects.find(o => o.id === this.state.selectedObjectId);
                this.renderObjectsTable(); // Pour mettre à jour le surlignage
                this.displayObjectDetails(selectedObject);
            }
        },

        handleNewObject() {
            this.state.selectedObjectId = null;
            this.renderObjectsTable();
            this.displayObjectDetails(null); // `null` pour le mode création
        },

        async handleObjectFormSubmit(event) {
            event.preventDefault();
            const formData = new FormData(this.elements.objectForm);
            const objectData = Object.fromEntries(formData.entries());
            const id = objectData.id;

            // Conversion des champs numériques, en s'assurant que les champs vides deviennent `null`
            [
                'poids', 
                'valeurProtection', 
                'degatsMin', 
                'degatsMax', 
                'bonusSoldatForce',
                'bonusSoldatConstitution',
                'bonusSoldatDexterite',
                'bonusSoldatVitesse',
                'bonusSoldatCharisme',
                'bonusSoldatIntelligence',
                'bonusSoldatChance',
                'bonusSoldatFidelite',
                'bonusSoldatResistance',
                'bonusSoldatPrecision',
                'bonusSoldatTauxCritique',
                'bonusSoldatDegatsCritiques',
                'bonusSoldatPointsDeVie',
                'bonusSoldatAttaque',
                'bonusPersonnageForce',
                'bonusPersonnageConstitution',
                'bonusPersonnageDexterite',
                'bonusPersonnageVitesse',
                'bonusPersonnageCharisme',
                'bonusPersonnageIntelligence',
                'bonusPersonnageChance', 
                'bonusPersonnageFidelite',
                'bonusPersonnageAmbition',
                'bonusPersonnagePointsDeVie',
                'bonusPersonnageAttaque'
            ].forEach(key => {
                if (objectData[key] === '') {
                    objectData[key] = null;
                } else if (objectData[key] !== null) {
                    objectData[key] = key === 'poids' ? parseFloat(objectData[key]) : parseInt(objectData[key], 10);
                }
            });

            const isCreating = !id;
            const url = isCreating ? '/api/objects' : `/api/objects/${id}`;
            const method = isCreating ? 'POST' : 'PUT';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(objectData),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || `Impossible de ${isCreating ? 'créer' : 'mettre à jour'} l'objet.`);
                }

                const savedObject = await response.json();
                this.setObjectStatus(`Objet "${savedObject.nom}" ${isCreating ? 'créé' : 'mis à jour'} !`);
                
                await this.loadObjects();
                this.state.selectedObjectId = savedObject.id;
                this.renderObjectsTable();
                this.displayObjectDetails(savedObject);

            } catch (error) {
                console.error("Erreur lors de la soumission du formulaire objet:", error);
                this.setObjectStatus(error.message, true);
            }
        },

        async handleObjectDelete() {
            const objectId = this.elements.objectForm.querySelector('#object-id').value;
            if (!objectId || !confirm(`Êtes-vous sûr de vouloir supprimer cet objet (ID: ${objectId}) ?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/objects/${objectId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'La suppression a échoué.');
                }

                this.setObjectStatus('Objet supprimé avec succès.');
                this.state.selectedObjectId = null;
                this.elements.objectForm.reset();
                this.elements.objectDetailsPanel.classList.add('hidden');
                await this.loadObjects();

            } catch (error) {
                console.error("Erreur lors de la suppression de l'objet:", error);
                this.setObjectStatus(error.message, true);
            }
        },

        displayObjectDetails(object) {
            const { objectForm, deleteObjectBtn, objectDetailsPanel } = this.elements;
            objectForm.reset();

            if (object) { // Mode édition
                for (const key in object) {
                    const input = objectForm.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = object[key] ?? '';
                    }
                }
                deleteObjectBtn.classList.remove('hidden');
            } else { // Mode création
                deleteObjectBtn.classList.add('hidden');
            }
            objectDetailsPanel.classList.remove('hidden');
        },
        // --- Gestionnaires d'événements ---

        handleGradeSelection(event) {
            const li = event.target.closest('li');
            if (li && li.dataset.gradeId) {
                this.state.selectedGradeId = parseInt(li.dataset.gradeId, 10);
                const selectedGrade = this.state.currentGrades.find(g => g.id === this.state.selectedGradeId);
                this.renderGradesList();
                this.displayGradeDetails(selectedGrade);
            }
        },

        handleNewGrade() {
            this.state.selectedGradeId = null;
            this.renderGradesList();
            this.displayGradeDetails(null); // `null` pour le mode création
        },

        async handleFormSubmit(event) {
            event.preventDefault();
            const formData = new FormData(this.elements.form);
            const gradeData = Object.fromEntries(formData.entries());
            const id = gradeData.id;

            gradeData.ordre = gradeData.ordre ? parseInt(gradeData.ordre, 10) : null;

            const isCreating = !id;
            const url = isCreating ? '/api/grades' : `/api/grades/${id}`;
            const method = isCreating ? 'POST' : 'PUT';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gradeData),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || `Impossible de ${isCreating ? 'créer' : 'mettre à jour'} le grade.`);
                }

                const savedGrade = await response.json();
                this.setStatus(`Grade "${savedGrade.nom}" ${isCreating ? 'ajouté' : 'mis à jour'} avec succès !`);
                
                await this.loadGrades();
                this.state.selectedGradeId = savedGrade.id;
                this.renderGradesList();
                this.displayGradeDetails(savedGrade);

            } catch (error) {
                console.error("Erreur lors de la soumission:", error);
                this.setStatus(error.message, true);
            }
        },

        async handleDelete() {
            const gradeId = this.elements.form.querySelector('#id').value;
            if (!gradeId || !confirm(`Êtes-vous sûr de vouloir supprimer ce grade (ID: ${gradeId}) ?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/grades/${gradeId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('La suppression a échoué.');

                this.setStatus('Grade supprimé avec succès.');
                this.state.selectedGradeId = null;
                this.elements.form.reset();
                this.showWelcomeMessage();
                await this.loadGrades();

            } catch (error) {
                console.error("Erreur lors de la suppression:", error);
                this.setStatus(error.message, true);
            }
        },

        updatePictogrammePreview() {
            const { pictogrammeInput, pictogrammePreview } = this.elements;
            if (pictogrammeInput.value) {
                pictogrammePreview.src = pictogrammeInput.value;
                pictogrammePreview.style.display = 'block';
            } else {
                pictogrammePreview.style.display = 'none';
            }
        },

        // --- Méthodes utilitaires ---

        displayGradeDetails(grade) {
            const { form, deleteBtn, detailsPanel, pictogrammeInput, pictogrammePreview } = this.elements;
            form.reset();
            pictogrammePreview.style.display = 'none';

            if (grade) { // Mode édition
                form.querySelector('#id').value = grade.id || '';
                form.querySelector('#nom').value = grade.nom || '';
                pictogrammeInput.value = grade.pictogramme || '';
                form.querySelector('#ordre').value = grade.ordre || '';
                form.querySelector('#codeOtan').value = grade.codeOtan || '';
                form.querySelector('#pays').value = grade.pays || 'FR';
                form.querySelector('#armee').value = grade.armee || 'Armée de Terre';
                deleteBtn.classList.remove('hidden');
                this.updatePictogrammePreview();
            } else { // Mode création
                form.querySelector('#id').value = '';
                deleteBtn.classList.add('hidden');
            }
            detailsPanel.classList.remove('hidden');
        },

        showWelcomeMessage() {
            this.elements.detailsPanel.classList.add('hidden');
            this.elements.pictogrammePreview.style.display = 'none';
        },

        setStatus(message, isError = false) {
            const { statusMessage } = this.elements;
            statusMessage.textContent = message;
            statusMessage.className = isError ? 'error' : 'success';
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = '';
            }, 5000);
        },

        setObjectStatus(message, isError = false) {
            const { objectStatusMessage } = this.elements;
            objectStatusMessage.textContent = message;
            objectStatusMessage.className = isError ? 'error' : 'success';
            setTimeout(() => {
                objectStatusMessage.textContent = '';
                objectStatusMessage.className = '';
            }, 5000);
        },
    };

    // Démarrage de l'application
    adminApp.init();
});

function createAndAppend(parent, tag, text) {
    const element = document.createElement(tag);
    if (text) {
        element.textContent = text;
    }
    parent.appendChild(element);
    return element;
}

async function createAuthHeader() {
    try {
        const response = await fetch('/api/auth/status', { credentials: 'include' });
        const data = await response.json();

        if (data.loggedIn) {
            const headerContainer = document.createElement('div');
            headerContainer.style.position = 'absolute';
            headerContainer.style.top = '10px';
            headerContainer.style.right = '20px';
            headerContainer.style.zIndex = '1000';
            headerContainer.style.fontFamily = 'sans-serif';
            headerContainer.style.display = 'flex';
            headerContainer.style.alignItems = 'center';
            headerContainer.innerHTML = `
                <span style="margin-right: 15px;">${data.email}</span>
                <a href="#" id="global-logout-btn" title="Déconnexion" style="text-decoration: none; font-size: 1.5em; color: #dc3545;">&#9211;</a>
            `;
            document.body.prepend(headerContainer);

            document.getElementById('global-logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/login.html';
            });
        }
    } catch (error) {
        console.error("Impossible de créer l'en-tête d'authentification", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    createAuthHeader();
    const container = document.getElementById('table-container');

    if (!container) {
        console.error("L'élément 'table-container' est introuvable.");
        return;
    }

    async function loadGrades() {
        const gradesContainer = document.getElementById('grades-list-container');
        if (!gradesContainer) {
            console.error("L'élément 'grades-list-container' est introuvable.");
            return;
        }

        try {
            const response = await fetch('/api/grades');
            if (!response.ok) throw new Error(`Erreur HTTP ! statut: ${response.status}`);
            const grades = await response.json();

            gradesContainer.innerHTML = ''; // Vide le message de chargement
            const ul = createAndAppend(gradesContainer, 'ul');
            ul.style.listStyleType = 'none';
            ul.style.padding = '0';

            grades.forEach(grade => {
                const li = createAndAppend(ul, 'li');
                li.style.marginBottom = '5px';
                // Correction pour afficher l'image du galon
                const pictogramme = grade.pictogramme ? `<img src="${grade.pictogramme}" style="height: 25px; vertical-align: middle; margin-right: 8px; image-rendering: pixelated;">` : `<span style="display: inline-block; width: 28px;"></span>`;
                
                li.innerHTML = `${pictogramme}<b>${grade.nom}</b> (OTAN: ${grade.codeOtan || 'N/A'})`;
            });

        } catch (error) {
            console.error("Impossible de charger les grades:", error);
            gradesContainer.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger la liste des grades.</p>";
        }
    }

    async function loadGenerals() {
        try {
            const response = await fetch('/api/generals');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut: ${response.status}`);
            }
            const data = await response.json();

            const table = document.createElement('table');
            const thead = createAndAppend(table, 'thead');
            const tbody = createAndAppend(table, 'tbody');
    
            const headerRow = createAndAppend(thead, 'tr');
            createAndAppend(headerRow, 'th', 'Nom');
            createAndAppend(headerRow, 'th', 'Prénom');
            createAndAppend(headerRow, 'th', 'Grade');
            createAndAppend(headerRow, 'th', 'Armée');
            createAndAppend(headerRow, 'th', 'Naissance');
            createAndAppend(headerRow, 'th', 'Décès');
            createAndAppend(headerRow, 'th', 'Photo');
    
            data.forEach(general => {
                const row = document.createElement('tr');
                createAndAppend(row, 'td', general.lastName);
                createAndAppend(row, 'td', general.firstName);
                createAndAppend(row, 'td', general.grade);
                createAndAppend(row, 'td', general.army);
                createAndAppend(row, 'td', general.birthDate ? new Date(general.birthDate).toLocaleDateString('fr-FR') : 'N/A');
                createAndAppend(row, 'td', general.deathDate ? new Date(general.deathDate).toLocaleDateString('fr-FR') : 'N/A');
                const photoCell = createAndAppend(row, 'td');
                if (general.photo) {
                    const img = createAndAppend(photoCell, 'img');
                    img.src = general.photo; // Utilise directement le chemin local
                    img.alt = `Photo de ${general.firstName} ${general.lastName}`;
                } else {
                    photoCell.textContent = 'N/A';
                }
                tbody.appendChild(row);
            });
    
            container.innerHTML = ''; // Vide le message "Chargement..."
            container.appendChild(table);
        } catch (error) {
            console.error("Impossible de charger les données de l'API:", error);
            container.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger les données.</p>";
        }
    }

    loadGrades();
    loadGenerals();
});

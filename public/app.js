function createAndAppend(parent, tag, text) {
    const element = document.createElement(tag);
    if (text) {
        element.textContent = text;
    }
    parent.appendChild(element);
    return element;
}

document.addEventListener('DOMContentLoaded', function() {
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
                const pictogramme = grade.pictogramme ? `<img src="${grade.pictogramme}" style="height: 15px; vertical-align: middle; margin-right: 8px; image-rendering: pixelated;">` : `<span style="display: inline-block; width: 28px;"></span>`;
                
                li.innerHTML = `${pictogramme}<b>${grade.nom}</b> (OTAN: ${grade.codeOtan || 'N/A'})`;
            });

        } catch (error) {
            console.error("Impossible de charger les grades:", error);
            gradesContainer.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger la liste des grades.</p>";
        }
    }

    async function loadIcons() {
        const iconContainer = document.getElementById('icon-container');
        if (!iconContainer) {
            console.error("L'élément 'icon-container' est introuvable.");
            return;
        }

        try {
            const response = await fetch('/api/armee-francaise');
            if (!response.ok) throw new Error(`Erreur HTTP ! statut: ${response.status}`);
            const armeeData = await response.json();

            const iconSet = new Set();

            // Fonction récursive pour trouver tous les pictogrammes
            function findPictos(node) {
                if (Array.isArray(node)) {
                    node.forEach(findPictos);
                } else if (typeof node === 'object' && node !== null) {
                    if (node.pictogramme) {
                        iconSet.add(node.pictogramme);
                    }
                    for (const key in node) {
                        // Appel récursif pour toutes les propriétés de l'objet
                        findPictos(node[key]);
                    }
                }
            }

            findPictos(armeeData);

            iconContainer.innerHTML = ''; // Vide le message de chargement
            iconSet.forEach(picoUrl => {
                const img = createAndAppend(iconContainer, 'img');
                img.src = picoUrl;
                // Appliquer un style cohérent pour les images de galons
                img.style.height = '15px'; // Hauteur similaire à la liste des grades
                img.style.verticalAlign = 'middle';
                img.style.border = '1px solid #eee';
            });
        } catch (error) {
            iconContainer.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger les icônes.</p>";
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
    loadIcons();
    loadGenerals();
});

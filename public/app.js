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

    // Utilise l'API Fetch pour appeler notre propre serveur
    fetch('/api/generals')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const table = document.createElement('table');
            const thead = createAndAppend(table, 'thead');
            const tbody = createAndAppend(table, 'tbody');

            const headerRow = createAndAppend(thead, 'tr');
            createAndAppend(headerRow, 'th', 'Nom');
            createAndAppend(headerRow, 'th', 'Prénom');
            createAndAppend(headerRow, 'th', 'Grade');
            createAndAppend(headerRow, 'th', 'Armée');
            createAndAppend(headerRow, 'th', 'Photo');

            data.forEach(general => {
                const row = document.createElement('tr');
                createAndAppend(row, 'td', general.lastName);
                createAndAppend(row, 'td', general.firstName);
                createAndAppend(row, 'td', general.grade);
                createAndAppend(row, 'td', general.army);
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
        })
        .catch(error => {
            console.error("Impossible de charger les données de l'API:", error);
            container.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger les données.</p>";
        });
});
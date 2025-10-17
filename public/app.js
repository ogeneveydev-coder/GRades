document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('table-container');

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
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            thead.innerHTML = `
                <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Grade</th>
                    <th>Armée</th>
                </tr>
            `;

            data.forEach(general => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${general.lastName}</td>
                    <td>${general.firstName}</td>
                    <td>${general.grade}</td>
                    <td>${general.army}</td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            container.innerHTML = ''; // Vide le message "Chargement..."
            container.appendChild(table);
        })
        .catch(error => {
            console.error("Impossible de charger les données de l'API:", error);
            container.innerHTML = "<p style='color: red;'>Erreur : Impossible de charger les données.</p>";
        });
});
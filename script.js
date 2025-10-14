document.addEventListener('DOMContentLoaded', function() {
    // Cible le conteneur où le tableau sera inséré
    const container = document.getElementById('table-container');

    // Utilise l'API Fetch pour lire le fichier JSON local
    fetch('generaux.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Crée la structure du tableau
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            // Crée l'en-tête du tableau
            thead.innerHTML = `
                <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Naissance</th>
                    <th>Décès</th>
                    <th>Grade</th>
                    <th>Armée</th>
                </tr>
            `;

            // Remplit le corps du tableau avec les données
            data.forEach(general => {
                const row = document.createElement('tr');
                // Utilise `|| 'Vivant'` pour afficher "Vivant" si la date de décès est null
                row.innerHTML = `
                    <td>${general.nom}</td>
                    <td>${general.prenom}</td>
                    <td>${general.date_naissance}</td>
                    <td>${general.date_deces || 'Vivant'}</td>
                    <td>${general.grade}</td>
                    <td>${general.armee}</td>
                `;
                tbody.appendChild(row);
            });

            // Assemble le tableau et l'ajoute à la page
            table.appendChild(thead);
            table.appendChild(tbody);
            container.appendChild(table);
        })
        .catch(error => {
            console.error("Impossible de charger le fichier JSON:", error);
            container.innerHTML = "<p style='color: red; text-align: center;'>Erreur : Impossible de charger les données des généraux.</p>";
        });
});
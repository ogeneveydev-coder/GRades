document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('grade-form'); // Assurez-vous que cet ID existe dans votre HTML
    const statusMessage = document.getElementById('status-message');
    const gradesListContainer = document.getElementById('existing-grades-list');
    const deleteBtn = document.getElementById('delete-btn');
    const newGradeBtn = document.getElementById('new-grade-btn');
    const detailsPanel = document.getElementById('grade-details-panel');

    let allGrades = [];
    let selectedGradeId = null;

    // --- Fonctions d'affichage ---

    function renderGradesList() {
        if (!gradesListContainer) return;
        gradesListContainer.innerHTML = ''; // Vide la liste

        if (allGrades.length === 0) {
            gradesListContainer.innerHTML = '<li>Aucun grade.</li>';
            return;
        }

        allGrades.forEach(grade => {
            const li = document.createElement('li');
            li.dataset.gradeId = grade.id;
            li.textContent = grade.nom;
            if (grade.id === selectedGradeId) {
                li.classList.add('selected');
            }
            gradesListContainer.appendChild(li);
        });
    }

    function displayGradeDetails(grade) {
        form.reset();
        if (grade) {
            const pictogramInput = form.querySelector('#pictogramme');
            const pictogramPreview = document.getElementById('pictogramme-preview');
            form.querySelector('#id').value = grade.id || '';
            form.querySelector('#nom').value = grade.nom || '';
            pictogramInput.value = grade.pictogramme || '';
            form.querySelector('#ordre').value = grade.ordre || '';
            form.querySelector('#codeOtan').value = grade.codeOtan || '';
            form.querySelector('#pays').value = grade.pays || 'FR';
            form.querySelector('#armee').value = grade.armee || 'Armée de Terre';
            deleteBtn.classList.remove('hidden');
            if (grade.pictogramme) {
                pictogramPreview.src = grade.pictogramme;
                pictogramPreview.style.display = 'block';
            } else {
                pictogramPreview.style.display = 'none';
            }
        } else {
            // Mode création
            form.querySelector('#id').value = '';
            deleteBtn.classList.add('hidden');
        }
        detailsPanel.classList.remove('hidden');
    }

    function showWelcomeMessage() {
        detailsPanel.classList.add('hidden');
        document.getElementById('pictogramme-preview').style.display = 'none';
    }

    function setStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'error' : 'success';
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = '';
        }, 5000);
    }

    // --- Fonctions de logique métier (API) ---

    async function loadGrades() {
        try {
            const response = await fetch('/api/grades');
            if (!response.ok) throw new Error('Impossible de charger les grades.');
            allGrades = await response.json();
            renderGradesList();
        } catch (error) {
            console.error("Erreur lors du chargement des grades:", error);
            gradesListContainer.innerHTML = '<li>Erreur de chargement.</li>';
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(form);
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
            setStatus(`Grade "${savedGrade.nom}" ${isCreating ? 'ajouté' : 'mis à jour'} avec succès !`);
            
            await loadGrades(); // Recharger la liste
            selectedGradeId = savedGrade.id; // Sélectionner le grade sauvegardé
            renderGradesList(); // Mettre à jour l'affichage de la liste
            displayGradeDetails(savedGrade);

        } catch (error) {
            console.error("Erreur lors de la soumission:", error);
            setStatus(error.message, true);
        }
    }

    async function handleDelete() {
        const gradeId = form.querySelector('#id').value;
        if (!gradeId || !confirm(`Êtes-vous sûr de vouloir supprimer ce grade (ID: ${gradeId}) ?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/grades/${gradeId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('La suppression a échoué.');

            setStatus('Grade supprimé avec succès.');
            selectedGradeId = null;
            form.reset();
            deleteBtn.classList.add('hidden');
            showWelcomeMessage();
            await loadGrades();

        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            setStatus(error.message, true);
        }
    }

    // --- Initialisation et écouteurs d'événements ---

    function init() {
        // J'ai déplacé le formulaire dans le HTML pour qu'il soit plus simple à gérer
        // et je le cache par défaut.
        detailsPanel.classList.add('hidden');

        form.addEventListener('submit', handleFormSubmit);

        // Ajout de l'écouteur pour l'aperçu de l'image
        const pictogramInput = form.querySelector('#pictogramme');
        const pictogramPreview = document.getElementById('pictogramme-preview');
        pictogramInput.addEventListener('input', () => {
            if (pictogramInput.value) {
                pictogramPreview.src = pictogramInput.value;
                pictogramPreview.style.display = 'block';
            } else {
                pictogramPreview.style.display = 'none';
            }
        });
        deleteBtn.addEventListener('click', handleDelete);

        newGradeBtn.addEventListener('click', () => {
            selectedGradeId = null;
            renderGradesList();
            displayGradeDetails(null);
        });

        gradesListContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI') {
                selectedGradeId = parseInt(event.target.dataset.gradeId, 10);
                const selectedGrade = allGrades.find(g => g.id === selectedGradeId);
                renderGradesList();
                displayGradeDetails(selectedGrade);
            }
        });

        loadGrades();
    }

    init();
});

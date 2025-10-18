const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

/**
 * Ajoute une pause.
 * @param {number} ms - Le temps de pause en millisecondes.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Chemin vers le fichier JSON
const generauxPath = path.join(__dirname, '..', 'generaux.json');
const generauxData = JSON.parse(fs.readFileSync(generauxPath, 'utf-8'));

// Dossier pour sauvegarder les images
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'generaux');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Fonction pour créer un nom de fichier simple à partir du nom et prénom
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Remplace les espaces par -
        .replace(/[^\w\-]+/g, '')       // Supprime les caractères non-alphanumériques
        .replace(/\-\-+/g, '-')         // Remplace les -- par un seul -
        .replace(/^-+/, '')             // Supprime les - au début
        .replace(/-+$/, '');            // Supprime les - à la fin
}

async function downloadImages() {
    console.log('🖼️  Démarrage du téléchargement des images...');

    for (const general of generauxData) {
        if (general.photo && general.photo.startsWith('http')) {
            try {
                const response = await fetch(general.photo, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                if (!response.ok) {
                    console.error(`❌ Erreur lors du téléchargement de ${general.photo}: ${response.statusText}`);
                    general.photo = null; // On met à null si ça échoue
                    continue;
                }

                const buffer = await response.buffer();
                const extension = path.extname(new URL(general.photo).pathname).split('?')[0] || '.jpg';
                const filename = `${slugify(general.nom)}-${slugify(general.prenom)}${extension}`;
                const savePath = path.join(imagesDir, filename);

                fs.writeFileSync(savePath, buffer);
                console.log(`✅ Image sauvegardée: ${filename}`);

                // On met à jour le chemin de la photo pour qu'il soit local
                general.photo = `/images/generaux/${filename}`;

            } catch (error) {
                console.error(`❌ Erreur lors du traitement de ${general.nom}: ${error.message}`);
                general.photo = null;
            }

            // Pause aléatoire entre 0.5 et 1.5 secondes pour un comportement plus "humain"
            const randomDelay = 500 + Math.random() * 1000;
            await sleep(randomDelay);
        }
    }

    // On met à jour le fichier generaux.json directement
    fs.writeFileSync(generauxPath, JSON.stringify(generauxData, null, 2));
    console.log('\n✨ Fichier generaux.json mis à jour avec les chemins locaux !');
}

downloadImages();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

/**
 * Ajoute une pause.
 * @param {number} ms - Le temps de pause en millisecondes.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const parser = new xml2js.Parser({ explicitArray: false });

const generauxPath = path.join(__dirname, '..', 'generaux.json');
const generauxData = JSON.parse(fs.readFileSync(generauxPath, 'utf-8'));

/**
 * Met à jour un général avec les informations de Gallica (BnF).
 * @param {object} general - L'objet du général à mettre à jour.
 */
async function updateGeneralFromGallica(general) {
    // On ne met à jour que les généraux qui n'ont pas de photo ou dont la photo est une URL http
    if (general.photo && !general.photo.startsWith('http')) {
        console.log(`ℹ️  ${general.prenom} ${general.nom} a déjà une photo locale. Ignoré.`);
        return;
    }

    const fullName = `${general.prenom} ${general.nom}`;
    // On cherche une image (portrait) pour le général
    const query = `gallica all "${fullName}" and dc.type all "image"`;
    const url = `https://gallica.bnf.fr/SRU?version=1.2&operation=searchRetrieve&query=${encodeURIComponent(query)}&maximumRecords=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            // Si on est bloqué (Forbidden), on attend plus longtemps avant de continuer
            if (response.status === 403) {
                console.warn(`🟡 Serveur a bloqué la requête pour ${general.nom}. Attente de 5 secondes...`);
                await sleep(5000);
            }
            console.error(`❌ Erreur API Gallica pour ${general.nom}: ${response.statusText}`);
            return;
        }

        const xmlData = await response.text();
        const result = await parser.parseStringPromise(xmlData);

        const record = result['srw:searchRetrieveResponse']['srw:records']['srw:record'];

        if (record) {
            const identifier = record['srw:recordData']['oai_dc:dc']['dc:identifier'];
            // L'identifiant est parfois un tableau, on prend le dernier qui est souvent le bon.
            const arkUrl = Array.isArray(identifier) ? identifier[identifier.length - 1] : identifier;

            if (arkUrl && arkUrl.includes('ark:')) {
                // On construit l'URL de l'image en utilisant l'API IIIF de Gallica
                const imageUrl = `${arkUrl}/f1.highres`;
                console.log(`✅ Photo trouvée pour ${general.prenom} ${general.nom}`);
                general.photo = imageUrl;
            } else {
                console.log(`🟡 Pas d'identifiant ARK pour ${general.prenom} ${general.nom}.`);
            }
        } else {
            console.log(`🟡 Pas de résultat pour ${general.prenom} ${general.nom}.`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche de ${general.nom}: ${error.message}`);
    }
}

async function scrapeAll() {
    console.log('🏛️  Démarrage de la recherche sur Gallica (BnF)...');
    for (const general of generauxData) {
        await updateGeneralFromGallica(general);
        // Pause aléatoire entre 0.5 et 1.5 secondes pour un comportement plus "humain"
        const randomDelay = 500 + Math.random() * 1000;
        await sleep(randomDelay);
    }
    fs.writeFileSync(generauxPath, JSON.stringify(generauxData, null, 2), 'utf-8');
    console.log('\n✨ Fichier generaux.json mis à jour avec les URLs des photos trouvées !');
}

scrapeAll();

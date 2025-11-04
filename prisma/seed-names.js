const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Démarrage du seeding des prénoms et noms...');

    // Vider les tables pour éviter les doublons lors des exécutions multiples
    await prisma.nomDeFamille.deleteMany({});
    await prisma.prenom.deleteMany({});
    console.log('🗑️ Tables "Prenom" et "NomDeFamille" vidées.');

    // Charger les données depuis les fichiers JSON
    const prenomsPath = path.join(__dirname, 'prenoms.json');
    const nomsPath = path.join(__dirname, 'noms.json');
    
    const prenomsData = JSON.parse(fs.readFileSync(prenomsPath, 'utf-8'));
    const nomsData = JSON.parse(fs.readFileSync(nomsPath, 'utf-8'));

    // --- Traitement des prénoms ---
    const prenomsToCreate = [];
    for (const nationalite in prenomsData) {
        // Utiliser un Set pour garantir l'unicité des prénoms par nationalité
        const prenomObjects = prenomsData[nationalite];
        for (const prenom of prenomObjects) {
            prenomsToCreate.push({
                name: prenom.name,
                genre: prenom.genre,
                nationalite: nationalite
            });
        }
    }

    await prisma.prenom.createMany({ data: prenomsToCreate, skipDuplicates: true });
    console.log(`✅ ${prenomsToCreate.length} prénoms insérés.`);

    // --- Traitement des noms de famille ---
    const nomsToCreate = [];
    for (const nationalite in nomsData) {
        const uniqueNames = new Set(nomsData[nationalite]);
        for (const name of uniqueNames) {
            nomsToCreate.push({ name, nationalite });
        }
    }

    await prisma.nomDeFamille.createMany({ data: nomsToCreate, skipDuplicates: true });
    console.log(`✅ ${nomsToCreate.length} noms de famille insérés.`);

    console.log('✨ Seeding des noms terminé.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // 1. Lire le fichier JSON
  const generauxPath = path.join(__dirname, '..', 'generaux.json');
  const generauxData = JSON.parse(fs.readFileSync(generauxPath, 'utf-8'));

  // 2. Vider la table pour éviter les doublons lors des exécutions répétées
  await prisma.general.deleteMany({});
  console.log('🗑️ Table "General" vidée.');

  // 3. Préparer les données pour l'insertion en masse
  const generalsToCreate = generauxData.map(general => ({
    lastName: general.nom,
    firstName: general.prenom,
    grade: general.grade,
    army: general.armee,
    birthDate: new Date(general.date_naissance),
    // Si la date de décès est null, on insère null, sinon on crée une date
    deathDate: general.date_deces ? new Date(general.date_deces) : null,
    photo: general.photo || null
  }));

  // 4. Insérer les données en une seule fois
  await prisma.general.createMany({
    data: generalsToCreate,
  });
  console.log(`✅ Seeding terminé : ${generauxData.length} généraux ont été insérés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
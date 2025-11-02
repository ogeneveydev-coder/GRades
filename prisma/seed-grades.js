const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding des grades...');

  // Lire le fichier JSON de la structure de l'armée
  const armeePath = path.join(__dirname, '..', 'armee-francaise.json');
  const armeeData = JSON.parse(fs.readFileSync(armeePath, 'utf-8'));

  // Lire les informations supplémentaires sur les grades depuis un fichier JSON
  const gradeDetailsPath = path.join(__dirname, '..', 'grades-details.json');
  const gradeDetails = JSON.parse(fs.readFileSync(gradeDetailsPath, 'utf-8'));

  const gradesMap = new Map();

  // Fonction récursive pour trouver tous les grades et pictogrammes
  function findGrades(node) {
    if (Array.isArray(node)) {
      node.forEach(findGrades);
    } else if (typeof node === 'object' && node !== null) {
      // Cas pour les commandants d'unité
      if (node.commandant && node.commandant.grade && !gradesMap.has(node.commandant.grade)) {
        gradesMap.set(node.commandant.grade, {
          nom: node.commandant.grade,
          pictogramme: node.commandant.pictogramme || null
        });
      }
      // Cas pour le personnel dans les groupes
      if (node.personnel && Array.isArray(node.personnel)) {
        node.personnel.forEach(p => {
          if (p.grade && !gradesMap.has(p.grade)) {
            gradesMap.set(p.grade, {
              nom: p.grade,
              pictogramme: p.pictogramme || null
            });
          }
        });
      }

      // Appel récursif pour toutes les autres propriétés
      for (const key in node) {
        findGrades(node[key]);
      }
    }
  }

  findGrades(armeeData);

  // Vider la table pour éviter les doublons
  await prisma.grade.deleteMany({});
  console.log('🗑️ Table "Grade" vidée.');

  // Préparer les données pour l'insertion
  const gradesToCreate = Array.from(gradesMap.values()).map(grade => {
    const details = gradeDetails[grade.nom] || {};
    return {
      nom: grade.nom,
      pictogramme: grade.pictogramme,
      ordre: details.ordre || null,
      codeOtan: details.codeOtan || null,
      pays: 'FR', // On met 'FR' par défaut
      armee: 'Armée de Terre' // On met 'Armée de Terre' par défaut
    };
  });

  // Insérer les données
  await prisma.grade.createMany({
    data: gradesToCreate,
  });
  console.log(`✅ Seeding des grades terminé : ${gradesToCreate.length} grades ont été insérés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

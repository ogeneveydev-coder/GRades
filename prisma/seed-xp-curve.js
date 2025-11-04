const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Génère la table d'expérience jusqu'à un niveau maximum.
 * @param {number} maxLevel - Le niveau maximum à générer.
 * @returns {Array<{level: number, xpRequired: number}>}
 */
function generateXpCurve(maxLevel) {
    const xpTable = [{ level: 1, xpRequired: 0 }];
    let totalXp = 0;

    for (let level = 1; level < maxLevel; level++) {
        // Formule: XP pour passer au niveau suivant
        const xpForNextLevel = Math.round(Math.pow(level, 2.5) * 100);
        totalXp += xpForNextLevel;
        xpTable.push({ level: level + 1, xpRequired: totalXp });
    }
    return xpTable;
}

async function main() {
    console.log('🌱 Démarrage du seeding de la courbe d\'XP...');
    
    // On vide la table pour éviter les doublons
    await prisma.levelXP.deleteMany({});
    console.log('🗑️ Table "LevelXP" vidée.');

    const xpData = generateXpCurve(90);

    await prisma.levelXP.createMany({
        data: xpData,
    });

    console.log(`✅ Seeding de la courbe d'XP terminé. ${xpData.length} niveaux ont été insérés.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
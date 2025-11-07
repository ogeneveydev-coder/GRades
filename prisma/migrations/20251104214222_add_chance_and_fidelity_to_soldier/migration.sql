-- AlterTable
ALTER TABLE "Objet" ADD COLUMN     "bonusSoldatChance" INTEGER,
ADD COLUMN     "bonusSoldatFidelite" INTEGER;

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "chance" INTEGER NOT NULL DEFAULT 0;

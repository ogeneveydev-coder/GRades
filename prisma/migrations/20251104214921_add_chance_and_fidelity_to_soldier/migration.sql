-- AlterTable
ALTER TABLE "Objet" ADD COLUMN     "bonusSoldatDegatsCritiques" INTEGER,
ADD COLUMN     "bonusSoldatPrecision" INTEGER,
ADD COLUMN     "bonusSoldatResistance" INTEGER,
ADD COLUMN     "bonusSoldatTauxCritique" INTEGER;

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "degatsCritiques" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "precision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resistance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tauxCritique" INTEGER NOT NULL DEFAULT 0;

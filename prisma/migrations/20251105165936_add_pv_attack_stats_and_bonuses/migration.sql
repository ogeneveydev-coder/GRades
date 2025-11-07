-- AlterTable
ALTER TABLE "Objet" ADD COLUMN     "bonusPersonnageAttaque" INTEGER,
ADD COLUMN     "bonusPersonnagePointsDeVie" INTEGER,
ADD COLUMN     "bonusSoldatAttaque" INTEGER,
ADD COLUMN     "bonusSoldatPointsDeVie" INTEGER;

-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "attaque" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "attaque" INTEGER NOT NULL DEFAULT 0;

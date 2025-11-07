/*
  Warnings:

  - You are about to drop the column `bonusAmbition` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusChance` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusCharisme` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusConstitution` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusDexterite` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusFidelite` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusForce` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusIntelligence` on the `Objet` table. All the data in the column will be lost.
  - You are about to drop the column `bonusVitesse` on the `Objet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Objet" DROP COLUMN "bonusAmbition",
DROP COLUMN "bonusChance",
DROP COLUMN "bonusCharisme",
DROP COLUMN "bonusConstitution",
DROP COLUMN "bonusDexterite",
DROP COLUMN "bonusFidelite",
DROP COLUMN "bonusForce",
DROP COLUMN "bonusIntelligence",
DROP COLUMN "bonusVitesse",
ADD COLUMN     "bonusPersonnageAmbition" INTEGER,
ADD COLUMN     "bonusPersonnageChance" INTEGER,
ADD COLUMN     "bonusPersonnageCharisme" INTEGER,
ADD COLUMN     "bonusPersonnageConstitution" INTEGER,
ADD COLUMN     "bonusPersonnageDexterite" INTEGER,
ADD COLUMN     "bonusPersonnageFidelite" INTEGER,
ADD COLUMN     "bonusPersonnageForce" INTEGER,
ADD COLUMN     "bonusPersonnageIntelligence" INTEGER,
ADD COLUMN     "bonusPersonnageVitesse" INTEGER,
ADD COLUMN     "bonusSoldatCharisme" INTEGER,
ADD COLUMN     "bonusSoldatConstitution" INTEGER,
ADD COLUMN     "bonusSoldatDexterite" INTEGER,
ADD COLUMN     "bonusSoldatForce" INTEGER,
ADD COLUMN     "bonusSoldatIntelligence" INTEGER,
ADD COLUMN     "bonusSoldatVitesse" INTEGER;

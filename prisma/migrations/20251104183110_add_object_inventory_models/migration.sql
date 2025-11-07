-- CreateEnum
CREATE TYPE "TypeObjet" AS ENUM ('ARME_PRINCIPALE', 'ARME_SECONDAIRE', 'ARMURE_TETE', 'ARMURE_CORPS', 'ARMURE_JAMBES', 'AMELIORATION', 'CONSOMMABLE');

-- CreateEnum
CREATE TYPE "RareteObjet" AS ENUM ('COMMUN', 'PEU_COMMUN', 'RARE', 'EPIQUE', 'LEGENDAIRE');

-- CreateTable
CREATE TABLE "Objet" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "pictogramme" TEXT,
    "poids" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" "TypeObjet" NOT NULL,
    "rarete" "RareteObjet" NOT NULL DEFAULT 'COMMUN',
    "degatsMin" INTEGER,
    "degatsMax" INTEGER,
    "valeurProtection" INTEGER,
    "bonusForce" INTEGER,
    "bonusConstitution" INTEGER,
    "bonusDexterite" INTEGER,
    "bonusCharisme" INTEGER,
    "bonusIntelligence" INTEGER,
    "bonusVitesse" INTEGER,

    CONSTRAINT "Objet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventaire" (
    "id" SERIAL NOT NULL,
    "estEquipe" BOOLEAN NOT NULL DEFAULT false,
    "soldatId" INTEGER NOT NULL,
    "objetId" INTEGER NOT NULL,

    CONSTRAINT "Inventaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Objet_nom_key" ON "Objet"("nom");

-- AddForeignKey
ALTER TABLE "Inventaire" ADD CONSTRAINT "Inventaire_soldatId_fkey" FOREIGN KEY ("soldatId") REFERENCES "Soldat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventaire" ADD CONSTRAINT "Inventaire_objetId_fkey" FOREIGN KEY ("objetId") REFERENCES "Objet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

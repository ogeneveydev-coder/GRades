-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "nationalite" TEXT;

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "nationalite" TEXT;

-- CreateTable
CREATE TABLE "Prenom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nationalite" TEXT,

    CONSTRAINT "Prenom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomDeFamille" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nationalite" TEXT,

    CONSTRAINT "NomDeFamille_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prenom_name_nationalite_key" ON "Prenom"("name", "nationalite");

-- CreateIndex
CREATE UNIQUE INDEX "NomDeFamille_name_nationalite_key" ON "NomDeFamille"("name", "nationalite");

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "dalleId" TEXT;

-- CreateTable
CREATE TABLE "Paysage" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "maxSoldats" INTEGER NOT NULL DEFAULT 10,
    "maxObjets" INTEGER NOT NULL DEFAULT 5,
    "vitesseMax" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Paysage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dalle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "paysageId" INTEGER NOT NULL,
    "proprietaireId" INTEGER,

    CONSTRAINT "Dalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paysage_nom_key" ON "Paysage"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Dalle_nom_key" ON "Dalle"("nom");

-- AddForeignKey
ALTER TABLE "Soldat" ADD CONSTRAINT "Soldat_dalleId_fkey" FOREIGN KEY ("dalleId") REFERENCES "Dalle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dalle" ADD CONSTRAINT "Dalle_paysageId_fkey" FOREIGN KEY ("paysageId") REFERENCES "Paysage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dalle" ADD CONSTRAINT "Dalle_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

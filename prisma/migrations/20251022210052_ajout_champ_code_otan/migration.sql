-- AlterTable
ALTER TABLE "General" ADD COLUMN     "codeOtan" TEXT,
ADD COLUMN     "pays" TEXT;

-- CreateTable
CREATE TABLE "Grade" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "pictogramme" TEXT,
    "ordre" INTEGER,
    "armee" TEXT,
    "pays" TEXT,
    "codeOtan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_nom_key" ON "Grade"("nom");

-- CreateTable
CREATE TABLE "Soldat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prenom" TEXT,
    "nom" TEXT,
    "age" INTEGER,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'Soldat',
    "niveau" INTEGER NOT NULL DEFAULT 0,
    "pointsDeVie" INTEGER NOT NULL DEFAULT 0,
    "force" INTEGER NOT NULL DEFAULT 0,
    "constitution" INTEGER NOT NULL DEFAULT 0,
    "dexterite" INTEGER NOT NULL DEFAULT 0,
    "charisme" INTEGER NOT NULL DEFAULT 0,
    "intelligence" INTEGER NOT NULL DEFAULT 0,
    "vitesse" INTEGER NOT NULL DEFAULT 0,
    "fidelite" INTEGER NOT NULL DEFAULT 0,
    "ambition" INTEGER NOT NULL DEFAULT 0,
    "taille" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Soldat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Soldat" ADD CONSTRAINT "Soldat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

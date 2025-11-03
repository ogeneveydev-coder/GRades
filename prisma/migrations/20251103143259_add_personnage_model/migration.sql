-- CreateTable
CREATE TABLE "Personnage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "pointsDeVie" INTEGER NOT NULL DEFAULT 100,
    "force" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "dexterite" INTEGER NOT NULL DEFAULT 10,
    "charisme" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "fidelite" INTEGER NOT NULL DEFAULT 50,
    "ambition" INTEGER NOT NULL DEFAULT 50,
    "taille" INTEGER NOT NULL DEFAULT 175,
    "blessures" TEXT,
    "kills" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Personnage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personnage_userId_key" ON "Personnage"("userId");

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

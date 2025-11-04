/*
  Warnings:

  - A unique constraint covering the columns `[name,nationalite,genre]` on the table `Prenom` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Prenom_name_nationalite_key";

-- CreateIndex
CREATE UNIQUE INDEX "Prenom_name_nationalite_genre_key" ON "Prenom"("name", "nationalite", "genre");

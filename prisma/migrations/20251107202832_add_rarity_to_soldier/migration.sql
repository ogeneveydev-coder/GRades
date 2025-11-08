/*
  Warnings:

  - The `rarete` column on the `Objet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Rarete" AS ENUM ('COMMUN', 'PEU_COMMUN', 'RARE', 'EPIQUE', 'RELIQUE', 'LEGENDAIRE', 'MYTHIQUE');

-- AlterTable
ALTER TABLE "Objet" DROP COLUMN "rarete",
ADD COLUMN     "rarete" "Rarete" NOT NULL DEFAULT 'COMMUN';

-- AlterTable
ALTER TABLE "Soldat" ADD COLUMN     "rarete" "Rarete" NOT NULL DEFAULT 'COMMUN';

-- DropEnum
DROP TYPE "public"."RareteObjet";

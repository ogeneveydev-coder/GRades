/*
  Warnings:

  - You are about to drop the column `name` on the `General` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `General` table. All the data in the column will be lost.
  - Added the required column `army` to the `General` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `General` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `General` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `General` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "General" DROP COLUMN "name",
DROP COLUMN "specialty",
ADD COLUMN     "army" TEXT NOT NULL,
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "deathDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

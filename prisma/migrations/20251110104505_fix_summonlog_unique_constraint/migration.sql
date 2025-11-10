/*
  Warnings:

  - A unique constraint covering the columns `[soldatId]` on the table `SummonLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SummonLog" ADD COLUMN     "soldatId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "SummonLog_soldatId_key" ON "SummonLog"("soldatId");

-- AddForeignKey
ALTER TABLE "SummonLog" ADD CONSTRAINT "SummonLog_soldatId_fkey" FOREIGN KEY ("soldatId") REFERENCES "Soldat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

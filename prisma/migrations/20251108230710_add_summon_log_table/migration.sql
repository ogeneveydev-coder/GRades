-- CreateTable
CREATE TABLE "SummonLog" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "SummonLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SummonLog" ADD CONSTRAINT "SummonLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

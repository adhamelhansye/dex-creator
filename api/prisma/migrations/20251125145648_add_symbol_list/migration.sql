-- AlterTable
ALTER TABLE "Dex" ADD COLUMN     "symbolList" TEXT;

-- CreateIndex
CREATE INDEX "UsedTransactionHash_dexId_idx" ON "UsedTransactionHash"("dexId");

-- AddForeignKey
ALTER TABLE "UsedTransactionHash" ADD CONSTRAINT "UsedTransactionHash_dexId_fkey" FOREIGN KEY ("dexId") REFERENCES "Dex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

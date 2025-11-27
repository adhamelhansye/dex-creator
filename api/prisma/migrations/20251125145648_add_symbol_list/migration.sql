-- AlterTable
ALTER TABLE
  "Dex"
ADD
  COLUMN IF NOT EXISTS "symbolList" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UsedTransactionHash_dexId_idx" ON "UsedTransactionHash"("dexId");
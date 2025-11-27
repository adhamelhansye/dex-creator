-- AlterTable
ALTER TABLE
  "Dex"
ADD
  COLUMN IF NOT EXISTS "symbolList" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UsedTransactionHash_dexId_idx" ON "UsedTransactionHash"("dexId");

-- AddForeignKey
DO $ $ BEGIN IF NOT EXISTS (
  SELECT
    1
  FROM
    pg_constraint
  WHERE
    conname = 'UsedTransactionHash_dexId_fkey'
) THEN
ALTER TABLE
  "UsedTransactionHash"
ADD
  CONSTRAINT "UsedTransactionHash_dexId_fkey" FOREIGN KEY ("dexId") REFERENCES "Dex"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

END IF;

END $ $;
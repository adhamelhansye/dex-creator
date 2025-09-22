-- AlterTable
ALTER TABLE
  "Dex"
ADD
  COLUMN "graduationTxHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Dex_graduationTxHash_key" ON "Dex"("graduationTxHash");
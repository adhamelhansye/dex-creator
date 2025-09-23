-- CreateTable
CREATE TABLE "UsedTransactionHash" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dexId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedTransactionHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsedTransactionHash_txHash_key" ON "UsedTransactionHash"("txHash");

-- CreateIndex
CREATE INDEX "UsedTransactionHash_txHash_idx" ON "UsedTransactionHash"("txHash");

-- CreateIndex
CREATE INDEX "UsedTransactionHash_userId_idx" ON "UsedTransactionHash"("userId");

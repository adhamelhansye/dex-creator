-- CreateTable
CREATE TABLE "BrokerIndex" (
    "id" TEXT NOT NULL,
    "brokerIndex" INTEGER NOT NULL,
    "brokerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerIndex_brokerIndex_key" ON "BrokerIndex"("brokerIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerIndex_brokerId_key" ON "BrokerIndex"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerIndex_brokerIndex_idx" ON "BrokerIndex"("brokerIndex");

-- CreateIndex
CREATE INDEX "BrokerIndex_brokerId_idx" ON "BrokerIndex"("brokerId");

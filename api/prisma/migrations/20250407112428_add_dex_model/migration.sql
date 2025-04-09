-- CreateTable
CREATE TABLE "Dex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL DEFAULT 'demo',
    "brokerName" TEXT,
    "primaryLogo" BYTEA,
    "secondaryLogo" BYTEA,
    "favicon" BYTEA,
    "themeCSS" TEXT,
    "telegramLink" TEXT,
    "discordLink" TEXT,
    "xLink" TEXT,
    "repoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Dex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dex_userId_key" ON "Dex"("userId");

-- AddForeignKey
ALTER TABLE "Dex" ADD CONSTRAINT "Dex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

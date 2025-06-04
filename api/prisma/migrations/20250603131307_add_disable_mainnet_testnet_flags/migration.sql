-- AlterTable
ALTER TABLE "Dex" ADD COLUMN     "disableMainnet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disableTestnet" BOOLEAN NOT NULL DEFAULT false;

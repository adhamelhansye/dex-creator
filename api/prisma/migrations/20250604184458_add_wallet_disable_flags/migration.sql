-- AlterTable
ALTER TABLE "Dex" ADD COLUMN     "disableEvmWallets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disableSolanaWallets" BOOLEAN NOT NULL DEFAULT false;

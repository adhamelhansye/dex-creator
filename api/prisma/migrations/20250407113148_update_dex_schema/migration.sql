/*
  Warnings:

  - You are about to drop the column `name` on the `Dex` table. All the data in the column will be lost.
  - Made the column `brokerName` on table `Dex` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Dex" DROP COLUMN "name",
ALTER COLUMN "brokerName" SET NOT NULL,
ALTER COLUMN "brokerName" SET DEFAULT 'Orderly DEX';

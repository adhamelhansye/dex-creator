/*
  Warnings:

  - You are about to drop the column `makerFee` on the `Dex` table. All the data in the column will be lost.
  - You are about to drop the column `takerFee` on the `Dex` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dex" DROP COLUMN "makerFee",
DROP COLUMN "takerFee";

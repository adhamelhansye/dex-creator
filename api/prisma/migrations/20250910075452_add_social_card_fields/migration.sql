-- AlterTable
ALTER TABLE
  "Dex"
ADD
  COLUMN "banner" TEXT,
ADD
  COLUMN "description" TEXT,
ADD
  COLUMN "logo" TEXT,
ADD
  COLUMN "tokenAddress" TEXT,
ADD
  COLUMN "tokenChain" TEXT,
ADD
  COLUMN "websiteUrl" TEXT;

-- Migration: Set default values for existing DEXes
UPDATE
  "Dex"
SET
  "banner" = "primaryLogo",
  "logo" = "secondaryLogo"
WHERE
  "banner" IS NULL
  OR "logo" IS NULL;
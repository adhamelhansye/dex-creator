-- AlterTable
ALTER TABLE
  "Dex"
ADD
  COLUMN "seoKeywords" TEXT,
ADD
  COLUMN "seoSiteDescription" TEXT,
ADD
  COLUMN "seoSiteLanguage" TEXT,
ADD
  COLUMN "seoSiteLocale" TEXT,
ADD
  COLUMN "seoSiteName" TEXT,
ADD
  COLUMN "seoThemeColor" TEXT,
ADD
  COLUMN "seoTwitterHandle" TEXT,
ALTER COLUMN
  "availableLanguages"
SET
  DEFAULT ARRAY ['en'] :: TEXT [];
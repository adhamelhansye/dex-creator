-- Set isGraduated to true for all existing DEXes with non-demo broker IDs
-- This assumes that DEXes with real broker IDs have completed the full graduation process
UPDATE
  "Dex"
SET
  "isGraduated" = true
WHERE
  "brokerId" != 'demo'
  AND "brokerId" IS NOT NULL;
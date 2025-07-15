-- Multiply existing makerFee and takerFee values by 10 to add decimal precision
-- This changes the precision from 1 bps to 0.1 bps (1 bps = 10 in database)
UPDATE
  "Dex"
SET
  "makerFee" = "makerFee" * 10,
  "takerFee" = "takerFee" * 10
WHERE
  "makerFee" IS NOT NULL
  AND "takerFee" IS NOT NULL;
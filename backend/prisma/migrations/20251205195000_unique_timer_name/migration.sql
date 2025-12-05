-- Deduplicate timer names per shop by appending ID for duplicates
WITH duplicates AS (
  SELECT id,
         "shopId",
         name,
         ROW_NUMBER() OVER (PARTITION BY "shopId", name ORDER BY id) AS row_num
  FROM "CountdownTimer"
)
UPDATE "CountdownTimer" AS ct
SET name = ct.name || ' #' || ct.id
FROM duplicates d
WHERE ct.id = d.id
  AND d.row_num > 1;

-- Enforce unique constraint on (shopId, name)
CREATE UNIQUE INDEX "CountdownTimer_shopId_name_key"
  ON "CountdownTimer"("shopId", name);

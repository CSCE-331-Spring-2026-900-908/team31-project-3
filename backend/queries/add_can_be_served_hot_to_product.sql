-- Adds hot-serve capability flag for AI recommendations.
ALTER TABLE Product
ADD COLUMN IF NOT EXISTS can_be_served_hot BOOLEAN NOT NULL DEFAULT FALSE;

-- Initial backfill (adjust these rules as needed for your store policy).
UPDATE Product
SET can_be_served_hot = CASE
  WHEN category_name IN ('Milk Foam Series', 'Milk Tea Series', 'Brewed Tea Series', 'Coffee Series') THEN TRUE
  ELSE FALSE
END;

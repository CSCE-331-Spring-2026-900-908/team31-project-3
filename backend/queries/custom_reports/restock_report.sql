SELECT
    item_name AS "Ingredient",
    ROUND(CAST(quantity AS numeric), 2) AS "Current Stock",
    ROUND(CAST(target_val AS numeric), 2) AS "Target Stock",
    unit_type AS "Unit"
FROM inventory
WHERE quantity < 0
ORDER BY quantity ASC, item_name ASC;

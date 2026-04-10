// backend/src/routes/productmodifier.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        mo.*,
        COALESCE(ai.allergen_tags, ARRAY[]::text[]) AS allergen_tags,
        ARRAY[]::text[] AS dietary_tags
      FROM modifieroption mo
      LEFT JOIN inventory i ON i.item_id = mo.inventory_item_id
      LEFT JOIN LATERAL (
        SELECT ARRAY_REMOVE(
          ARRAY[
            CASE WHEN COALESCE(i.item_name, mo.name) ~* '(milk|cream|cheese|butter|yogurt|whey|casein|custard)' THEN 'Dairy' END,
            CASE WHEN COALESCE(i.item_name, mo.name) ~* '(peanut|nut|almond|walnut|cashew|pecan|pistachio|hazelnut)' THEN 'Nuts' END,
            CASE WHEN COALESCE(i.item_name, mo.name) ~* '(wheat|flour|bread|gluten|cookie|oreo|malt)' THEN 'Gluten' END,
            CASE WHEN COALESCE(i.item_name, mo.name) ~* '(egg|mayo)' THEN 'Egg' END,
            CASE WHEN COALESCE(i.item_name, mo.name) ~* '(soy|tofu|edamame)' THEN 'Soy' END
          ],
          NULL
        ) AS allergen_tags
      ) ai ON TRUE
      LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
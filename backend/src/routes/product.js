// backend/src/routes/product.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `WITH unique_products AS (
        SELECT DISTINCT ON (product_id)
          product_id,
          name,
          base_price,
          category_name,
          can_be_served_hot,
          is_active,
          image_url,
          diet
        FROM product
        ORDER BY product_id, name
      )
      SELECT
        p.product_id,
        p.name,
        p.base_price,
        p.category_name,
        p.can_be_served_hot,
        p.is_active,
        p.image_url,
        p.diet,
        COALESCE(di.dietary_tags, ARRAY[]::text[]) AS dietary_tags,
        COALESCE(ai.allergen_tags, ARRAY[]::text[]) AS allergen_tags
      FROM unique_products p
      LEFT JOIN LATERAL (
        SELECT ARRAY_REMOVE(
          ARRAY[
            CASE
              WHEN COUNT(*) > 0
                AND BOOL_AND(i.item_name !~* '(chicken|beef|pork|bacon|sausage|ham|turkey|fish|shrimp|crab|tuna|salmon|gelatin|egg|milk|cream|cheese|butter|yogurt|whey|casein|honey)')
                THEN 'Vegan'
            END
          ],
          NULL
        ) AS dietary_tags
        FROM productingredient pi
        JOIN inventory i ON i.item_id = pi.item_id
        WHERE pi.product_id = p.product_id
      ) di ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY(
          SELECT DISTINCT allergen
          FROM productingredient pi
          JOIN inventory i ON i.item_id = pi.item_id
          CROSS JOIN LATERAL (
            SELECT CASE WHEN i.item_name ~* '(milk|cream|cheese|butter|yogurt|whey|casein)' THEN 'Dairy' END AS allergen
            UNION ALL
            SELECT CASE WHEN i.item_name ~* '(peanut|nut|almond|walnut|cashew|pecan|pistachio|hazelnut)' THEN 'Nuts' END
            UNION ALL
            SELECT CASE WHEN i.item_name ~* '(wheat|flour|bread|gluten)' THEN 'Gluten' END
            UNION ALL
            SELECT CASE WHEN i.item_name ~* '(egg)' THEN 'Egg' END
            UNION ALL
            SELECT CASE WHEN i.item_name ~* '(soy|tofu)' THEN 'Soy' END
          ) derived
          WHERE allergen IS NOT NULL
            AND pi.product_id = p.product_id
          ORDER BY allergen
        ) AS allergen_tags
      ) ai ON TRUE
      ORDER BY p.name, p.product_id
      LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, base_price, category_name, can_be_served_hot, is_active, diet } = req.body;
  if (!name || base_price === undefined) {
    return res.status(400).json({ error: "name and base_price are required." });
  }
  try {
    const result = await db.query(
      "INSERT INTO product (name, base_price, category_name, can_be_served_hot, is_active, diet) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        name.trim(),
        Number(base_price),
        category_name || null,
        Boolean(can_be_served_hot),
        is_active !== false,
        diet || "None",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product id." });
  }
  const { name, base_price, category_name, can_be_served_hot, is_active,diet } = req.body;
  if (!name || base_price === undefined) {
    return res.status(400).json({ error: "name and base_price are required." });
  }
  try {
    const result = await db.query(
      "UPDATE product SET name = $1, base_price = $2, category_name = $3, can_be_served_hot = $4, is_active = $5, diet = $6 WHERE product_id = $7 RETURNING *",
      [
        name.trim(),
        Number(base_price),
        category_name || null,
        Boolean(can_be_served_hot),
        Boolean(is_active),
        diet || "None",
        productId,
        
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product id." });
  }
  try {
    await db.query("DELETE FROM productmodifier WHERE product_id = $1", [productId]);
    await db.query("DELETE FROM productingredient WHERE product_id = $1", [productId]);
    const result = await db.query(
      "DELETE FROM product WHERE product_id = $1 RETURNING product_id",
      [productId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/modifiers", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const result = await db.query(
      "SELECT mo.option_id, mo.name, mo.category, mo.price_adjustment, mo.is_default, mo.inventory_item_id, mo.image_url " +
        "FROM productmodifier pm " +
        "JOIN modifieroption mo ON pm.option_id = mo.option_id " +
        "WHERE pm.product_id = $1 " +
        "ORDER BY mo.category, mo.name;",
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
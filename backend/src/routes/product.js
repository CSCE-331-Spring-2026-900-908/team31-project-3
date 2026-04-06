// backend/src/routes/product.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT product_id, name, base_price, category_name, is_active, image_url FROM product ORDER BY name LIMIT 200"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, base_price, category_name, is_active } = req.body;
  if (!name || base_price === undefined) {
    return res.status(400).json({ error: "name and base_price are required." });
  }
  try {
    const result = await db.query(
      "INSERT INTO product (name, base_price, category_name, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
      [name.trim(), Number(base_price), category_name || null, is_active !== false]
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
  const { name, base_price, category_name, is_active } = req.body;
  if (!name || base_price === undefined) {
    return res.status(400).json({ error: "name and base_price are required." });
  }
  try {
    const result = await db.query(
      "UPDATE product SET name = $1, base_price = $2, category_name = $3, is_active = $4 WHERE product_id = $5 RETURNING *",
      [name.trim(), Number(base_price), category_name || null, Boolean(is_active), productId]
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
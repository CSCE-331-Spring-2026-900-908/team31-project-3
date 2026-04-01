// backend/src/routes/product.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM product LIMIT 100");
    res.json(result.rows);
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
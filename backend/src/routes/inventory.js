// backend/src/routes/inventory.js
const express = require("express");
const db = require("../../server/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM inventory ORDER BY item_id LIMIT 100"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM inventory WHERE item_id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch item." });
  }
});

router.post("/", async (req, res) => {
  const { item_name, quantity, target_val, unit_type } = req.body;
  if (!item_name || quantity === undefined || target_val === undefined) {
    return res.status(400).json({ error: "item_name, quantity, and target_val are required." });
  }
  try {
    const result = await db.query(
      "INSERT INTO inventory (item_name, quantity, target_val, unit_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [item_name.trim(), Number(quantity), Number(target_val), unit_type || "kg"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item." });
  }
});

router.put("/:id", async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: "Invalid item id." });
  }
  const { quantity, target_val } = req.body;
  if (quantity === undefined || target_val === undefined) {
    return res.status(400).json({ error: "quantity and target_val are required." });
  }
  try {
    const result = await db.query(
      "UPDATE inventory SET quantity = $1, target_val = $2 WHERE item_id = $3 RETURNING *",
      [Number(quantity), Number(target_val), itemId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update item." });
  }
});

router.delete("/:id", async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: "Invalid item id." });
  }
  try {
    const result = await db.query(
      "DELETE FROM inventory WHERE item_id = $1 RETURNING item_id",
      [itemId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json({ message: "Item deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete item." });
  }
});

module.exports = router;
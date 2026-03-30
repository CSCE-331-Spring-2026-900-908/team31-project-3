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

module.exports = router;
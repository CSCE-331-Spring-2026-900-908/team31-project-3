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

module.exports = router;
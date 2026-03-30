const express = require("express");
const pool = require("../../server/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employee LIMIT 100");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, role, pin_hash } = req.body;
  if (!name || !role || !pin_hash) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO employee (name, role, pin_hash, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [name, role, pin_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM employee WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
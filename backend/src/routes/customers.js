// backend/src/routes/customers.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

// GET /customers/lookup?email=something
router.get("/lookup", async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await db.query(
      "SELECT id, name, email, points FROM customer WHERE LOWER(email) = LOWER($1);",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /customers
router.post("/", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const providedName = String(req.body?.name || "").trim();

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  const fallbackName = email.split("@")[0] || "Rewards Customer";
  const name = providedName || fallbackName;

  try {
    const existing = await db.query(
      "SELECT id, name, email, points FROM customer WHERE LOWER(email) = LOWER($1) LIMIT 1;",
      [email]
    );

    if (existing.rowCount > 0) {
      return res.status(200).json(existing.rows[0]);
    }

    const googleSub = `rewards:${email}`;
    const inserted = await db.query(
      "INSERT INTO customer (google_sub, email, name, picture_url) VALUES ($1, $2, $3, NULL) RETURNING id, name, email, points;",
      [googleSub, email, name]
    );

    return res.status(201).json(inserted.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



module.exports = router;
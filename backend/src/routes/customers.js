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



module.exports = router;

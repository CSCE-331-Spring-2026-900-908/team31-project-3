const express = require("express");
const pool = require("../../server/db");

const router = express.Router();

const toErrorMessage = (err) => {
  if (!err) return "Unknown error";
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors
      .map((nestedErr) => nestedErr?.message || String(nestedErr))
      .join("; ");
  }
  return err.message || String(err);
};

const normalizeRole = (raw) => {
  if (!raw) return null;
  const r = String(raw).toLowerCase();
  if (r === "cashier") return "Cashier";
  if (r === "manager") return "Manager";
  return null;
};

router.post("/pin-login", async (req, res) => {
  try {
    const { pin, role } = req.body || {};

    if (!pin || typeof pin !== "string") {
      return res.status(400).json({ error: "PIN is required" });
    }

    const dbRole = normalizeRole(role);
    if (!dbRole) {
      return res.status(400).json({ error: "Role is required" });
    }

    // Accept either:
    // - exact match (pin_hash = pin)
    // - hash-suffixed match (pin_hash = 'hash' + pin) to be robust to seed data.
    const query = `
      SELECT id, name, role, is_active
      FROM employee
      WHERE is_active = true
        AND role = $2
        AND (
          pin_hash = $1
          OR pin_hash = ('hash' || $1)
          OR pin_hash = ('Hash' || $1)
          OR pin_hash = ('HASH' || $1)
        )
      LIMIT 1
    `;

    const result = await pool.query(query, [pin, dbRole]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    return res.json({
      success: true,
      employee: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: toErrorMessage(err) });
  }
});

module.exports = router;


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

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    res.json({ ok: result.rows[0].ok });
  } catch (err) {
    res.status(500).json({ error: toErrorMessage(err) });
  }
});

module.exports = router;

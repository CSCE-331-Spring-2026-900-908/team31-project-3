const express = require("express");
const router = express.Router();

// POST /translate
// body: { texts: string[], target: string }
// returns: { translations: string[] }
router.post("/", async (req, res) => {
  const { texts, target } = req.body;

  if (!Array.isArray(texts) || texts.length === 0 || !target) {
    return res.status(400).json({ error: "Missing texts or target language" });
  }

  if (target === "en") {
    return res.json({ translations: texts });
  }

  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (!key) {
    return res.status(503).json({ error: "Translation service not configured. Set GOOGLE_TRANSLATE_KEY in .env" });
  }

  try {
    const apiRes = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, target, format: "text" }),
      }
    );

    const data = await apiRes.json();

    if (!apiRes.ok || !data.data) {
      console.error("Google Translate API error:", data);
      return res.status(500).json({ error: data.error?.message || "Translation API error" });
    }

    const translations = data.data.translations.map((t) => t.translatedText);
    res.json({ translations });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;

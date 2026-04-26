import { useState, useCallback } from "react";
import API_BASE_URL from "../config/apiBaseUrl";

// All static UI strings that appear on the customer/kiosk page
const UI_STRINGS = [
  // Categories
  "Recommended Based On Weather",
  "Milk Foam Series",
  "Milk Tea Series",
  "Creative Mix Series",
  "Brewed Tea Series",
  "Coffee Series",
  "Slush Series",
  // Accessibility bar
  "High Contrast: On",
  "High Contrast: Off",
  "Large UI: On",
  "Large UI: Off",
  // Customization view
  "Customizing:",
  "Details",
  "Toppings",
  "Ice Levels",
  "Sugar Levels",
  "Sizes",
  "Milk Types",
  "Drink Quantity",
  "Done Customizing",
  "Cancel Item",
  // Cart / order sidebar
  "Your Order",
  "Your cart is empty.",
  "Select an item to begin!",
  "Subtotal",
  "Tax",
  "Total",
  "Discount",
  "Checkout",
  "EDIT",
  // Rewards panel
  "Rewards",
  "Enter rewards email...",
  "Look Up",
  "Customer not found.",
  "Error looking up account.",
  "pts",
  "Free Drink Applied!",
  "needed for free drink.",
  "Found!",
  "Voucher Applied",
  "Use Free Drink (-65 pts)",
  "Remove Account",
  // Nav
  "Sign Out",
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh-CN", name: "中文 (简体)" },
  { code: "zh-TW", name: "中文 (繁體)" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "pt", name: "Português" },
];

const useTranslation = () => {
  const [language, setLanguage] = useState("en");
  // cache: { [langCode]: { [originalText]: translatedText } }
  const [cache, setCache] = useState({});

  const fetchTranslations = useCallback(async (lang, texts) => {
    const res = await fetch(`${API_BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target: lang }),
    });
    if (!res.ok) throw new Error("Translation request failed");
    const data = await res.json();
    return data.translations;
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    setLanguage(lang);
    if (lang === "en" || cache[lang]) return;

    try {
      const translated = await fetchTranslations(lang, UI_STRINGS);
      const map = {};
      UI_STRINGS.forEach((str, i) => {
        map[str] = translated[i];
      });
      setCache((prev) => ({ ...prev, [lang]: map }));
    } catch (err) {
      console.error("Translation failed:", err);
    }
  }, [cache, fetchTranslations]);

  // Translate a known UI string
  const t = useCallback((text) => {
    if (language === "en") return text;
    return cache[language]?.[text] ?? text;
  }, [language, cache]);

  // Translate an arbitrary dynamic string (e.g. product names from DB).
  // Returns the cached value if available, otherwise the original.
  // Call translateDynamic() to populate the cache for a batch.
  const translateDynamic = useCallback(async (texts) => {
    if (language === "en") return texts;
    const uncached = texts.filter((s) => !cache[language]?.[s]);
    if (uncached.length === 0) return texts.map((s) => cache[language]?.[s] ?? s);

    try {
      const translated = await fetchTranslations(language, uncached);
      const newEntries = {};
      uncached.forEach((str, i) => {
        newEntries[str] = translated[i];
      });
      setCache((prev) => ({
        ...prev,
        [language]: { ...prev[language], ...newEntries },
      }));
      // Return using the freshly fetched data directly
      const merged = { ...cache[language], ...newEntries };
      return texts.map((s) => merged[s] ?? s);
    } catch (err) {
      console.error("Dynamic translation failed:", err);
      return texts;
    }
  }, [language, cache, fetchTranslations]);

  return { language, changeLanguage, t, translateDynamic };
};

export default useTranslation;

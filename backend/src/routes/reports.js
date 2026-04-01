const express = require("express");
const fs = require("fs");
const path = require("path");

const pool = require("../../server/db");

const router = express.Router();

const REPORT_QUERY_MAP = {
  "Inventory Status": "custom_reports/inventory_status.sql",
  "Most Popular Modifiers": "custom_reports/popular_modifiers.sql",
  "Orders by Day of Week": "custom_reports/orders_by_day.sql",
  "Revenue Over Time": "custom_reports/revenue_by_month.sql",
  "Sales by Category": "custom_reports/sales_by_category.sql",
  "Top 5 Products": "custom_reports/top_5_products.sql",
  "Orders by Hour": "custom_reports/orders_by_hour.sql",
  "Revenue by Employee": "custom_reports/revenue_by_employee.sql",
  "Product Usage Chart": "custom_reports/product_usage.sql",
  "Sales Report": "custom_reports/sales_by_item.sql",
  "X-Report": "custom_reports/x_report.sql",
  "Z-Report": "custom_reports/z_report.sql",
};

const getDateFilter = (range) => {
  if (range === "week") {
    return " AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
  }
  if (range === "month") {
    return " AND o.created_at >= CURRENT_DATE - INTERVAL '1 month'";
  }
  if (range === "year") {
    return " AND o.created_at >= CURRENT_DATE - INTERVAL '1 year'";
  }
  return "";
};

const fillTemplate = (rawSql, range) => {
  const dateFilter = getDateFilter(range);
  const timeBucket = range === "year" ? "month" : "day";
  const timeLabelFormat = range === "year" ? "Mon YYYY" : "YYYY-MM-DD";

  return rawSql
    .replaceAll("{{DATE_FILTER}}", dateFilter)
    .replaceAll("{{TIME_BUCKET}}", timeBucket)
    .replaceAll("{{TIME_LABEL_FORMAT}}", timeLabelFormat);
};

const toChartPoints = (rows) => {
  if (!rows.length) return [];

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const labelKey = keys[0];
  const valueKey = keys.find(
    (key) => typeof firstRow[key] === "number" || !Number.isNaN(Number(firstRow[key]))
  );

  if (!valueKey) return [];

  return rows.map((row) => ({
    label: String(row[labelKey]),
    value: Number(row[valueKey]) || 0,
  }));
};

router.get("/", async (req, res) => {
  try {
    const report = req.query.report || "Most Popular Modifiers";
    const range = req.query.range || "month";
    const relativeQueryPath = REPORT_QUERY_MAP[report];

    if (!relativeQueryPath) {
      return res.status(400).json({ error: "Unknown report name" });
    }

    const sqlPath = path.join(
      __dirname,
      "..",
      "..",
      "queries",
      relativeQueryPath
    );
    const rawSql = fs.readFileSync(sqlPath, "utf8");
    const sql = fillTemplate(rawSql, range);

    const result = await pool.query(sql);

    const rows =
      report === "Top 5 Products" ? result.rows.slice(0, 5) : result.rows;

    return res.json({
      report,
      range,
      rows,
      columns: rows.length ? Object.keys(rows[0]) : [],
      chart: toChartPoints(rows).slice(0, 12),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;


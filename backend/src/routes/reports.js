const express = require("express");
const fs = require("fs");
const path = require("path");

const pool = require("../../server/db");

const router = express.Router();
const Z_REPORT_LOCK_KEY = 3312026;

const REPORT_QUERY_MAP = {
  "Inventory Status": "custom_reports/inventory_status.sql",
  "Restock Report": "custom_reports/restock_report.sql",
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
  const valueKey = keys.find((key) => {
    if (key === labelKey) return false;
    const value = firstRow[key];
    if (value instanceof Date) return false;
    return typeof value === "number" || !Number.isNaN(Number(value));
  });

  if (!valueKey) return [];

  return rows.map((row) => ({
    label: String(row[labelKey]),
    value: Number(row[valueKey]) || 0,
  }));
};

const toReportPayload = (report, range, rows) => ({
  report,
  range,
  rows,
  columns: rows.length ? Object.keys(rows[0]) : [],
  chart: toChartPoints(rows).slice(0, 12),
});

const getReportSql = (report, range) => {
  const relativeQueryPath = REPORT_QUERY_MAP[report];
  if (!relativeQueryPath) {
    return null;
  }
  const sqlPath = path.join(__dirname, "..", "..", "queries", relativeQueryPath);
  const rawSql = fs.readFileSync(sqlPath, "utf8");
  return fillTemplate(rawSql, range);
};

const runReportQuery = async (client, report, range) => {
  const sql = getReportSql(report, range);
  if (!sql) {
    return null;
  }
  const result = await client.query(sql);
  const rows = report === "Top 5 Products" ? result.rows.slice(0, 5) : result.rows;
  return rows;
};

const ensureZReportRunTable = async (client) => {
  await client.query(
    `CREATE TABLE IF NOT EXISTS z_report_run (
      business_date DATE PRIMARY KEY,
      total_orders INTEGER NOT NULL DEFAULT 0,
      total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
      report_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`
  );
};

router.get("/", async (req, res) => {
  try {
    const report = req.query.report || "Most Popular Modifiers";
    const range = req.query.range || "month";
    if (!REPORT_QUERY_MAP[report]) {
      return res.status(400).json({ error: "Unknown report name" });
    }

    if (report === "Z-Report") {
      await ensureZReportRunTable(pool);
      const closedResult = await pool.query(
        "SELECT report_rows FROM z_report_run WHERE business_date = CURRENT_DATE;"
      );
      if (closedResult.rowCount > 0) {
        const rows = Array.isArray(closedResult.rows[0].report_rows)
          ? closedResult.rows[0].report_rows
          : [];
        return res.json({
          ...toReportPayload(report, range, rows),
          zReportClosed: true,
        });
      }
    }

    const rows = await runReportQuery(pool, report, range);
    if (rows === null) {
      return res.status(400).json({ error: "Unknown report name" });
    }
    return res.json({
      ...toReportPayload(report, range, rows),
      zReportClosed: false,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/z-report/run", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1);", [Z_REPORT_LOCK_KEY]);
    await ensureZReportRunTable(client);

    const existingRun = await client.query(
      "SELECT business_date FROM z_report_run WHERE business_date = CURRENT_DATE;"
    );
    if (existingRun.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Z-Report has already been run for today.",
      });
    }

    const rows = await runReportQuery(client, "Z-Report", "month");
    const summary = rows?.[0] || {};

    await client.query(
      `INSERT INTO z_report_run (business_date, total_orders, total_sales, total_tax, report_rows)
       VALUES (
         CURRENT_DATE,
         $1,
         $2,
         $3,
         $4::jsonb
       );`,
      [
        Number(summary["Total Orders"] || 0),
        Number(summary["Gross Sales ($)"] || 0),
        Number(summary["Tax ($)"] || 0),
        JSON.stringify(rows || []),
      ]
    );

    await client.query(
      'UPDATE "order" SET z_report_run = TRUE WHERE z_report_run = FALSE AND DATE(created_at) = CURRENT_DATE;'
    );
    await client.query("COMMIT");

    return res.json({
      ...toReportPayload("Z-Report", "day-close", rows || []),
      zReportClosed: true,
      message: "Z-Report generated and daily totals closed.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;


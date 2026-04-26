SELECT
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS "Business Date",
    COUNT(o.id) AS "Total Orders",
    ROUND(CAST(COALESCE(SUM(o.total_tax), 0) AS numeric), 2) AS "Tax ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final), 0) AS numeric), 2) AS "Gross Sales ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final - o.total_tax), 0) AS numeric), 2) AS "Net Sales ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final), 0) AS numeric), 2) AS "Total Cash ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final), 0) AS numeric), 2) AS "Cash Payments ($)",
    0 AS "Card Payments ($)",
    0 AS "Returns ($)",
    0 AS "Voids ($)",
    0 AS "Discards ($)",
    0 AS "Service Charges ($)"
FROM "order" o
WHERE
    o.z_report_run = FALSE
    AND DATE(o.created_at) = CURRENT_DATE;
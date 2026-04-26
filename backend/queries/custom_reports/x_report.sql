SELECT
    EXTRACT(HOUR FROM o.created_at) AS "Hour of Day",
    COUNT(o.id) AS "Total Orders",
    ROUND(CAST(COALESCE(SUM(o.total_tax), 0) AS numeric), 2) AS "Tax ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final), 0) AS numeric), 2) AS "Gross Sales ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final - o.total_tax), 0) AS numeric), 2) AS "Net Sales ($)",
    ROUND(CAST(COALESCE(SUM(o.total_final), 0) AS numeric), 2) AS "Cash Payments ($)",
    0 AS "Card Payments ($)",
    0 AS "Returns ($)",
    0 AS "Voids ($)",
    0 AS "Discards ($)"
FROM "order" o
WHERE
    o.z_report_run = FALSE
    AND DATE(o.created_at) = CURRENT_DATE
    AND o.total_final > 0
GROUP BY
    "Hour of Day"
ORDER BY "Hour of Day";
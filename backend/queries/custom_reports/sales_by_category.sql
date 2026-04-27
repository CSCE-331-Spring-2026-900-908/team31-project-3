SELECT
    UNNEST(p.categories) AS "Category",
    ROUND(CAST(SUM(od.sold_price) AS numeric), 2) AS "Total Revenue"
FROM OrderDetail od
JOIN Product p ON od.product_id = p.product_id
JOIN "order" o ON od.order_id = o.id
WHERE
    TRUE
    {{DATE_FILTER}}
GROUP BY
    "Category"
ORDER BY "Total Revenue" DESC;
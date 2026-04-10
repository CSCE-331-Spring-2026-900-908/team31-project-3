// backend/src/routes/orders.js
const express = require("express");
const db = require("../../server/db");

const router = express.Router();

const TAX_RATE = 0.0825;

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

async function recalcOrderTotals(client, orderId) {
  const subtotalResult = await client.query(
    "SELECT COALESCE(SUM(od.sold_price + COALESCE(mods.mod_total, 0)), 0) AS subtotal " +
      "FROM orderdetail od " +
      "LEFT JOIN (SELECT order_detail_id, SUM(price_charged) AS mod_total FROM ordermodifier GROUP BY order_detail_id) mods " +
      "ON od.id = mods.order_detail_id " +
      "WHERE od.order_id = $1;",
    [orderId]
  );

  const subtotal = Number(subtotalResult.rows[0].subtotal || 0);
  const tax = roundMoney(subtotal * TAX_RATE);
  const total = roundMoney(subtotal + tax);

  await client.query(
    "UPDATE \"order\" SET total_tax = $1, total_final = $2 WHERE id = $3;",
    [tax, total, orderId]
  );

  return { subtotal, tax, total };
}

async function fetchAllowedModifiers(client, productId, modifierIds) {
  if (!modifierIds || modifierIds.length === 0) {
    return [];
  }

  const result = await client.query(
    "SELECT mo.option_id, mo.name, mo.price_adjustment " +
      "FROM productmodifier pm " +
      "JOIN modifieroption mo ON pm.option_id = mo.option_id " +
      "WHERE pm.product_id = $1 AND mo.option_id = ANY($2::int[]);",
    [productId, modifierIds]
  );

  return result.rows;
}

router.post("/", async (req, res) => {
  const { employeeId, customerId } = req.body || {};
  const authCustomerId = req.user?.id || customerId || null;

  try {
    const result = await db.query(
      "INSERT INTO \"order\" (employee_id, customer_id, created_at, total_tax, total_final) VALUES ($1, $2, NOW(), 0, 0) RETURNING id;",
      [employeeId || null, authCustomerId]
    );

    res.status(201).json({ orderId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:orderId", async (req, res) => {
  const orderId = Number(req.params.orderId);

  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "Invalid orderId" });
  }

  try {
    const orderResult = await db.query("SELECT * FROM \"order\" WHERE id = $1;", [
      orderId,
    ]);

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const itemResult = await db.query(
      "SELECT od.id AS detail_id, od.product_id, od.snapshot_name, od.sold_price, od.notes, " +
        "om.modifier_option_id, om.snapshot_name AS modifier_name, om.price_charged " +
        "FROM orderdetail od " +
        "LEFT JOIN ordermodifier om ON od.id = om.order_detail_id " +
        "WHERE od.order_id = $1 " +
        "ORDER BY od.id, om.id;",
      [orderId]
    );

    const items = new Map();

    for (const row of itemResult.rows) {
      if (!items.has(row.detail_id)) {
        items.set(row.detail_id, {
          detailId: row.detail_id,
          productId: row.product_id,
          snapshotName: row.snapshot_name,
          soldPrice: Number(row.sold_price),
          notes: row.notes,
          modifiers: [],
        });
      }

      if (row.modifier_option_id) {
        items.get(row.detail_id).modifiers.push({
          modifierId: row.modifier_option_id,
          name: row.modifier_name,
          price: Number(row.price_charged),
        });
      }
    }

    res.json({ order: orderResult.rows[0], items: Array.from(items.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:orderId/items", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { productId, quantity, notes, modifiers } = req.body || {};
  const qty = Math.max(Number(quantity || 1), 1);

  if (!Number.isInteger(orderId) || !Number.isInteger(Number(productId))) {
    return res.status(400).json({ error: "Invalid orderId or productId" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      "SELECT product_id, base_price, name FROM product WHERE product_id = $1;",
      [productId]
    );

    if (productResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult.rows[0];
    const allowedModifiers = await fetchAllowedModifiers(
      client,
      productId,
      Array.isArray(modifiers) ? modifiers : []
    );

    const detailIds = [];

    for (let i = 0; i < qty; i += 1) {
      const detailResult = await client.query(
        "INSERT INTO orderdetail (order_id, product_id, sold_price, snapshot_name, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
        [orderId, productId, product.base_price, product.name, notes || null]
      );

      const detailId = detailResult.rows[0].id;
      detailIds.push(detailId);

      for (const mod of allowedModifiers) {
        await client.query(
          "INSERT INTO ordermodifier (order_detail_id, modifier_option_id, price_charged, snapshot_name) VALUES ($1, $2, $3, $4);",
          [detailId, mod.option_id, mod.price_adjustment, mod.name]
        );
      }
    }

    const totals = await recalcOrderTotals(client, orderId);

    await client.query("COMMIT");

    res.status(201).json({ detailIds, totals });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/:orderId/items/:detailId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const detailId = Number(req.params.detailId);
  const { quantity, notes, modifiers } = req.body || {};
  const qty = Math.max(Number(quantity || 1), 1);

  if (!Number.isInteger(orderId) || !Number.isInteger(detailId)) {
    return res.status(400).json({ error: "Invalid orderId or detailId" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const detailResult = await client.query(
      "SELECT order_id, product_id, sold_price, snapshot_name FROM orderdetail WHERE id = $1 AND order_id = $2;",
      [detailId, orderId]
    );

    if (detailResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order detail not found" });
    }

    const detail = detailResult.rows[0];

    await client.query("UPDATE orderdetail SET notes = $1 WHERE id = $2;", [
      notes || null,
      detailId,
    ]);

    await client.query("DELETE FROM ordermodifier WHERE order_detail_id = $1;", [
      detailId,
    ]);

    const allowedModifiers = await fetchAllowedModifiers(
      client,
      detail.product_id,
      Array.isArray(modifiers) ? modifiers : []
    );

    for (const mod of allowedModifiers) {
      await client.query(
        "INSERT INTO ordermodifier (order_detail_id, modifier_option_id, price_charged, snapshot_name) VALUES ($1, $2, $3, $4);",
        [detailId, mod.option_id, mod.price_adjustment, mod.name]
      );
    }

    const createdDetailIds = [];

    if (qty > 1) {
      for (let i = 1; i < qty; i += 1) {
        const cloneResult = await client.query(
          "INSERT INTO orderdetail (order_id, product_id, sold_price, snapshot_name, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
          [orderId, detail.product_id, detail.sold_price, detail.snapshot_name, notes || null]
        );

        const newDetailId = cloneResult.rows[0].id;
        createdDetailIds.push(newDetailId);

        for (const mod of allowedModifiers) {
          await client.query(
            "INSERT INTO ordermodifier (order_detail_id, modifier_option_id, price_charged, snapshot_name) VALUES ($1, $2, $3, $4);",
            [newDetailId, mod.option_id, mod.price_adjustment, mod.name]
          );
        }
      }
    }

    const totals = await recalcOrderTotals(client, orderId);

    await client.query("COMMIT");

    res.json({ updatedDetailId: detailId, createdDetailIds, totals });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete("/:orderId/items/:detailId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const detailId = Number(req.params.detailId);

  if (!Number.isInteger(orderId) || !Number.isInteger(detailId)) {
    return res.status(400).json({ error: "Invalid orderId or detailId" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM ordermodifier WHERE order_detail_id = $1;", [
      detailId,
    ]);
    const deleteResult = await client.query(
      "DELETE FROM orderdetail WHERE id = $1 AND order_id = $2;",
      [detailId, orderId]
    );

    if (deleteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order detail not found" });
    }

    const totals = await recalcOrderTotals(client, orderId);

    await client.query("COMMIT");

    res.json({ deletedDetailId: detailId, totals });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post("/:orderId/checkout", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { redeemVoucher, customerId } = req.body || {};

  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "Invalid orderId" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // If a customerId is provided at checkout, associate it with the order
    if (customerId) {
       await client.query("UPDATE \"order\" SET customer_id = $1 WHERE id = $2;", [customerId, orderId]);
    }

    await client.query(
      "UPDATE inventory SET quantity = quantity - subq.total_used " +
        "FROM (SELECT pi.item_id, SUM(pi.quantity_used) AS total_used " +
        "FROM orderdetail od JOIN productingredient pi ON od.product_id = pi.product_id " +
        "WHERE od.order_id = $1 GROUP BY pi.item_id) subq " +
        "WHERE inventory.item_id = subq.item_id;",
      [orderId]
    );

    await client.query(
      "UPDATE inventory SET quantity = quantity - subq.total_used " +
        "FROM (SELECT mo.inventory_item_id AS item_id, COUNT(*) AS total_used " +
        "FROM ordermodifier om JOIN orderdetail od ON om.order_detail_id = od.id " +
        "JOIN modifieroption mo ON om.modifier_option_id = mo.option_id " +
        "WHERE od.order_id = $1 AND mo.inventory_item_id IS NOT NULL " +
        "GROUP BY mo.inventory_item_id) subq " +
        "WHERE inventory.item_id = subq.item_id;",
      [orderId]
    );

    let totals = await recalcOrderTotals(client, orderId);

    // Points logic
    let customerRow = null;
    if (customerId) {
      const custRes = await client.query("SELECT * FROM customer WHERE id = $1;", [customerId]);
      if (custRes.rowCount > 0) {
        customerRow = custRes.rows[0];
      }
    }

    let appliedDiscount = 0;

    if (redeemVoucher && customerRow && customerRow.points >= 65) {
      // Find the most expensive drink in the order
      const expensiveRes = await client.query(
        "SELECT MAX(od.sold_price + COALESCE(mods.mod_total, 0)) AS max_price " +
        "FROM orderdetail od " +
        "LEFT JOIN (SELECT order_detail_id, SUM(price_charged) AS mod_total FROM ordermodifier GROUP BY order_detail_id) mods " +
        "ON od.id = mods.order_detail_id " +
        "WHERE od.order_id = $1;",
        [orderId]
      );
      
      const maxPrice = Number(expensiveRes.rows[0].max_price || 0);
      
      if (maxPrice > 0) {
        appliedDiscount = maxPrice;
        const newSubtotal = Math.max(0, totals.subtotal - appliedDiscount);
        const newTax = roundMoney(newSubtotal * TAX_RATE);
        const newTotal = roundMoney(newSubtotal + newTax);
        
        await client.query(
          "UPDATE \"order\" SET total_tax = $1, total_final = $2 WHERE id = $3;",
          [newTax, newTotal, orderId]
        );
        
        totals = { subtotal: newSubtotal, tax: newTax, total: newTotal, discount: appliedDiscount };

        // Deduct 65 points for voucher
        await client.query("UPDATE customer SET points = points - 65 WHERE id = $1;", [customerId]);
        customerRow.points -= 65;
      }
    }

    // Earn points based on final total
    if (customerRow) {
      const earnedPoints = Math.floor(totals.total);
      if (earnedPoints > 0) {
        await client.query("UPDATE customer SET points = points + $1 WHERE id = $2;", [earnedPoints, customerId]);
      }
    }

    await client.query("COMMIT");

    res.json({ orderId, totals });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;

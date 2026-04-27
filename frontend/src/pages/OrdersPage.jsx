import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import "./OrdersPage.css";
import API_BASE_URL from "../config/apiBaseUrl";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];
const SINGLE_SELECT_CATS = ["Ice Level", "Sugar Level", "Size", "Milk Type"];
const MODIFIER_CAT_ORDER = ["Size", "Ice Level", "Sugar Level", "Milk Type", "Topping"];

const OrdersPage = ({ cashierMode = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [order, setOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const instanceCounter = useRef(0);

  // Customization modal state
  const [customizingId, setCustomizingId] = useState(null);

  // Rewards state
  const [customerEmail, setCustomerEmail] = useState("");
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [redeemVoucher, setRedeemVoucher] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isRewardsExpanded, setIsRewardsExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE_URL}/productmodifier`)
      .then((r) => r.json())
      .then((data) => setModifiers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const cat = p.category_name || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  const modifiersByCategory = useMemo(() => {
    const map = new Map();
    for (const m of modifiers) {
      const cat = m.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(m);
    }
    return map;
  }, [modifiers]);

  const addItem = (product) => {
    const newItem = {
      ...product,
      qty: 1,
      instance_id: instanceCounter.current++,
      selectedModifiers: {},
    };
    setOrder((prev) => [...prev, newItem]);
    setCustomizingId(newItem.instance_id);
  };

  const removeItem = (instance_id) => {
    setOrder((prev) => prev.filter((i) => i.instance_id !== instance_id));
    if (customizingId === instance_id) setCustomizingId(null);
  };

  const updateItemQty = (instance_id, delta) => {
    setOrder((prev) =>
      prev.map((i) =>
        i.instance_id === instance_id
          ? { ...i, qty: Math.max(1, i.qty + delta) }
          : i
      )
    );
  };

  const toggleModifier = (modifier) => {
    setOrder((prev) =>
      prev.map((item) => {
        if (item.instance_id !== customizingId) return item;
        const selected = { ...item.selectedModifiers };
        const id = String(modifier.option_id);

        if (modifier.category === "Topping") {
          if (selected[id]) delete selected[id];
          else selected[id] = 1;
        } else {
          const existing = Object.keys(selected).find(
            (k) =>
              modifiers.find((m) => String(m.option_id) === k)?.category ===
              modifier.category
          );
          if (existing) delete selected[existing];
          if (existing !== id) selected[id] = 1;
        }

        return { ...item, selectedModifiers: selected };
      })
    );
  };

  const setToppingQty = (optionId, delta) => {
    const id = String(optionId);
    setOrder((prev) =>
      prev.map((item) => {
        if (item.instance_id !== customizingId) return item;
        const selected = { ...item.selectedModifiers };
        const newQty = (selected[id] || 0) + delta;
        if (newQty <= 0) delete selected[id];
        else selected[id] = newQty;
        return { ...item, selectedModifiers: selected };
      })
    );
  };

  const modifierCostForItem = (item) => {
    let cost = 0;
    for (const [idStr, qty] of Object.entries(item.selectedModifiers || {})) {
      const mod = modifiers.find((m) => String(m.option_id) === idStr);
      if (mod?.price_adjustment) cost += Number(mod.price_adjustment) * qty;
    }
    return cost;
  };

  const itemTotal = (item) =>
    (Number(item.base_price) + modifierCostForItem(item)) * item.qty;

  const handleLookup = async () => {
    if (!customerEmail.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/customers/lookup?email=${encodeURIComponent(customerEmail)}`
      );
      if (!res.ok) {
        setLookupMessage("Customer not found.");
        setLinkedCustomer(null);
        setRedeemVoucher(false);
        return;
      }
      const data = await res.json();
      setLinkedCustomer(data);
      setLookupMessage("Account linked!");
    } catch {
      setLookupMessage("Error looking up account.");
    }
  };

  const submitOrder = async () => {
    if (order.length === 0) return;
    try {
      const payload = {
        employeeId: 1,
        customerId: linkedCustomer?.id || null,
        redeemVoucher: redeemVoucher,
        items: order.map(item => ({
          productId: item.product_id,
          quantity: item.qty,
          modifiers: Object.entries(item.selectedModifiers || {}).flatMap(
            ([id, qty]) => Array(qty).fill(Number(id))
          ),
        }))
      };

      const res = await fetch(`${API_BASE_URL}/orders/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Bulk submission failed");

      alert("Order submitted successfully!");
      setOrder([]);
      setLinkedCustomer(null);
      setCustomerEmail("");
      setRedeemVoucher(false);
      setLookupMessage("");
      setCustomizingId(null);
    } catch (err) {
      console.error(err);
      alert("Error submitting order.");
    }
  };

  const subtotal = order.reduce((sum, i) => sum + itemTotal(i), 0);
  let discount = 0;
  if (redeemVoucher && order.length > 0) {
    discount = Math.max(...order.map((i) => i.base_price));
  }
  const tax = Math.max(0, (subtotal - discount) * 0.0825);
  const total = Math.max(0, subtotal - discount) + tax;

  const handleTabClick = (t) => {
    if (t === "Orders") return;
    navigate(`/manager?${new URLSearchParams({ tab: t }).toString()}`);
  };

  const customizingItem = order.find((i) => i.instance_id === customizingId) ?? null;

  const modNamesForItem = (item) =>
    Object.entries(item.selectedModifiers || {})
      .map(([id, qty]) => {
        const m = modifiers.find((mod) => String(mod.option_id) === id);
        return m ? (qty > 1 ? `${m.name} ×${qty}` : m.name) : null;
      })
      .filter(Boolean);

  return (
    <div className="orders-page">
      {/* ── Navbar ── */}
      <nav className="manager-navbar">
        {MANAGER_TABS.filter((t) => !cashierMode || t === "Orders").map((t) => (
          <button
            key={t}
            type="button"
            className={`manager-nav-btn${t === "Orders" ? " active" : ""}`}
            onClick={() => handleTabClick(t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          className="manager-signout-btn"
          onClick={() => navigate("/")}
        >
          Sign Out
        </button>
      </nav>

      <div className="orders-layout">
        {/* ── Left: Menu ── */}
        <div className="orders-menu">
          <h2 className="manager-section-heading">Menu</h2>
          <div className="orders-category-filter">
            {["All", ...grouped.map(([cat]) => cat)].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`orders-filter-btn${selectedCategory === cat ? " active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="orders-product-grid">
            {grouped
              .filter(([cat]) => selectedCategory === "All" || cat === selectedCategory)
              .flatMap(([, items]) => items)
              .map((p) => (
                <button
                  key={p.product_id}
                  className={`orders-product-btn ${p.is_available === false ? "unavailable" : ""}`}
                  onClick={() => addItem(p)}
                  disabled={p.is_available === false}
                  title={p.is_available === false ? "Out of stock ingredients" : ""}
                >
                  <span className="orders-product-name">{p.name}</span>
                  {p.is_available === false ? (
                    <span className="orders-product-price">Out of stock</span>
                  ) : null}
                  <span className="orders-product-price">
                    ${Number(p.base_price).toFixed(2)}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* ── Right: Order sidebar (always visible) ── */}
        <div className="orders-sidebar">
          <h2 className="orders-sidebar-heading">Current Order</h2>

          <div className="orders-order-list">
            {order.map((item) => {
              const modNames = modNamesForItem(item);
              return (
                <div key={item.instance_id} className="orders-order-item">
                  <div className="orders-order-item-info">
                    <span className="orders-order-item-name">{item.name}</span>
                    {modNames.length > 0 && (
                      <span className="orders-order-item-mods">
                        {modNames.join(", ")}
                      </span>
                    )}
                    <div className="orders-order-item-qty-row">
                      <button
                        className="orders-qty-btn small"
                        onClick={() => updateItemQty(item.instance_id, -1)}
                      >
                        −
                      </button>
                      <span className="orders-qty-value">{item.qty}</span>
                      <button
                        className="orders-qty-btn small"
                        onClick={() => updateItemQty(item.instance_id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="orders-order-item-right">
                    <span className="orders-order-item-price">
                      ${itemTotal(item).toFixed(2)}
                    </span>
                    <button
                      className="orders-customize-btn"
                      onClick={() => setCustomizingId(item.instance_id)}
                    >
                      Edit
                    </button>
                    <button
                      className="orders-remove-btn"
                      onClick={() => removeItem(item.instance_id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
            {order.length === 0 && (
              <p className="orders-empty">No items added yet.</p>
            )}
          </div>

          {/* Rewards */}
          <div className="orders-rewards-panel">
            <h4 className="orders-rewards-heading">Rewards Account</h4>
            {!linkedCustomer ? (
              !isRewardsExpanded ? (
                <button
                  className="orders-rewards-btn"
                  style={{ background: "#e5e7eb", color: "#374151", border: "1px dashed #9ca3af" }}
                  onClick={() => setIsRewardsExpanded(true)}
                >
                  + Link Rewards Account
                </button>
              ) : (
                <div>
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="orders-rewards-input"
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleLookup} className="orders-rewards-btn">
                      Lookup
                    </button>
                    <button
                      onClick={() => {
                        setIsRewardsExpanded(false);
                        setCustomerEmail("");
                        setLookupMessage("");
                      }}
                      className="orders-rewards-btn"
                      style={{ background: "#9ca3af" }}
                    >
                      Cancel
                    </button>
                  </div>
                  {lookupMessage && (
                    <p className="orders-rewards-msg">{lookupMessage}</p>
                  )}
                </div>
              )
            ) : (
              <div>
                <p className="orders-rewards-customer">
                  <strong>{linkedCustomer.name || linkedCustomer.email}</strong>
                </p>
                <p className="orders-rewards-customer">
                  Points: {linkedCustomer.points}
                </p>
                {linkedCustomer.points >= 65 && (
                  <button
                    onClick={() => setRedeemVoucher(!redeemVoucher)}
                    className={`orders-rewards-voucher-btn${redeemVoucher ? " applied" : ""}`}
                  >
                    {redeemVoucher ? "Voucher Applied (−65 pts)" : "Apply Free Drink (−65 pts)"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setLinkedCustomer(null);
                    setRedeemVoucher(false);
                    setCustomerEmail("");
                    setLookupMessage("");
                  }}
                  className="orders-rewards-remove-btn"
                >
                  Remove Account
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="orders-pinned">
            {discount > 0 && (
              <div className="orders-sub-row" style={{ color: "#28a745" }}>
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="orders-sub-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="orders-sub-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="orders-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="orders-submit-btn"
              disabled={order.length === 0}
              onClick={submitOrder}
            >
              Submit Order
            </button>
          </div>
        </div>
      </div>
           
      {/* ── Customization Modal ── */}
      {customizingItem && (
        <div
          className="orders-modal-overlay"
          onClick={() => setCustomizingId(null)}
        >
          <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="orders-modal-header">
              <div className="orders-modal-title-group">
                <h2 className="orders-modal-title">{customizingItem.name}</h2>
                <span className="orders-modal-base-price">
                  ${Number(customizingItem.base_price).toFixed(2)} each
                </span>
              </div>
              <button
                className="orders-modal-close-btn"
                onClick={() => setCustomizingId(null)}
              >
                ✕
              </button>
            </div>

            {/* Quantity row */}
            <div className="orders-modal-qty-row">
              <span className="orders-modal-qty-label">Quantity</span>
              <div className="orders-modal-qty-controls">
                <button
                  className="orders-modal-qty-btn"
                  onClick={() => updateItemQty(customizingItem.instance_id, -1)}
                >
                  −
                </button>
                <span className="orders-modal-qty-value">{customizingItem.qty}</span>
                <button
                  className="orders-modal-qty-btn"
                  onClick={() => updateItemQty(customizingItem.instance_id, 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Modifier sections */}
            <div className="orders-modal-body">
              {MODIFIER_CAT_ORDER.map((cat) => {
                const opts = modifiersByCategory.get(cat);
                if (!opts || opts.length === 0) return null;
                const isTopping = cat === "Topping";
                return (
                  <div key={cat} className="orders-modal-section">
                    <h4 className="orders-modal-cat-heading">
                      {cat}s
                      {!isTopping && (
                        <span className="orders-modal-cat-hint">choose one</span>
                      )}
                    </h4>
                    <div className={isTopping ? "orders-modal-topping-grid" : "orders-modal-radio-grid"}>
                      {opts.map((m) => {
                        const idStr = String(m.option_id);
                        const selectedQty = customizingItem.selectedModifiers?.[idStr] || 0;
                        const isSelected = selectedQty > 0;
                        const price = Number(m.price_adjustment || 0);

                        if (isTopping) {
                          return (
                            <div
                              key={m.option_id}
                              className={`orders-modal-topping-card${isSelected ? " selected" : ""}`}
                            >
                              <button
                                className="orders-modal-topping-btn"
                                onClick={() => toggleModifier(m)}
                              >
                                <span className="orders-modal-topping-name">{m.name}</span>
                                {price > 0 && (
                                  <span className="orders-modal-mod-price">
                                    +${price.toFixed(2)}
                                  </span>
                                )}
                              </button>
                              {isSelected && (
                                <div className="orders-modal-topping-qty">
                                  <button
                                    className="orders-modal-qty-btn"
                                    onClick={() => setToppingQty(m.option_id, -1)}
                                  >
                                    −
                                  </button>
                                  <span className="orders-modal-qty-value">{selectedQty}</span>
                                  <button
                                    className="orders-modal-qty-btn"
                                    onClick={() => setToppingQty(m.option_id, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={m.option_id}
                            className={`orders-modal-radio-btn${isSelected ? " selected" : ""}`}
                            onClick={() => toggleModifier(m)}
                          >
                            <span>{m.name}</span>
                            {price !== 0 && (
                              <span className="orders-modal-mod-price">
                                {price > 0
                                  ? `+$${price.toFixed(2)}`
                                  : `-$${Math.abs(price).toFixed(2)}`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="orders-modal-footer">
              <div className="orders-modal-item-total">
                <span>Item Total</span>
                <span>${itemTotal(customizingItem).toFixed(2)}</span>
              </div>
              <div className="orders-modal-footer-btns">
                <button
                  className="orders-modal-remove-btn"
                  onClick={() => removeItem(customizingItem.instance_id)}
                >
                  Remove Item
                </button>
                <button
                  className="orders-modal-confirm-btn"
                  onClick={() => setCustomizingId(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cashier.css";
import API_BASE_URL from "../config/apiBaseUrl";

const Cashier = ({ showNav = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productModifiersByProductId, setProductModifiersByProductId] = useState({});
  const [order, setOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [customizing, setCustomizing] = useState(false);
  const [currItem, setCurrItem] = useState(null);
  
  // Rewards state
  const [customerEmail, setCustomerEmail] = useState("");
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [redeemVoucher, setRedeemVoucher] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const getProductModifiers = (productId) => productModifiersByProductId[productId] || [];

  const ensureProductModifiers = async (productId) => {
    if (productModifiersByProductId[productId]) return productModifiersByProductId[productId];
    const response = await fetch(`${API_BASE_URL}/product/${productId}/modifiers`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load modifiers.");
    }
    const modifiers = Array.isArray(data) ? data : [];
    setProductModifiersByProductId((prev) => ({ ...prev, [productId]: modifiers }));
    return modifiers;
  };

  const addItem = async (product) => {
    try {
      const modifiers = await ensureProductModifiers(product.product_id);
      const defaults = modifiers
        .filter((modifier) => modifier.is_default)
        .map((modifier) => ({ ...modifier, qty: 1 }));
      const instance_id = Date.now() + Math.random();
      const newItem = { ...product, qty: 1, instance_id, modifiers: defaults };
      setOrder((prev) => [...prev, newItem]);
      setCurrItem(newItem);
      setCustomizing(true);
    } catch (err) {
      alert(err.message || "Could not load customization options.");
    }
  };

  const removeItem = (instanceId) =>
    setOrder((prev) => prev.filter((i) => i.instance_id !== instanceId));
  const setQtyItem = (instanceId, delta) => {
    const item = order.find((entry) => entry.instance_id === instanceId);
    if (!item) return;
    if (item.qty + delta <= 0) {
      removeItem(instanceId);
      if (currItem?.instance_id === instanceId) {
        setCurrItem(null);
        setCustomizing(false);
      }
      return;
    }
    setOrder((prev) =>
      prev.map((entry) =>
        entry.instance_id === instanceId ? { ...entry, qty: entry.qty + delta } : entry
      )
    );
  };

  const editItem = async (item) => {
    try {
      await ensureProductModifiers(item.product_id);
      setCurrItem(item);
      setCustomizing(true);
    } catch (err) {
      alert(err.message || "Could not load customization options.");
    }
  };

  const closeCustomization = () => {
    setCurrItem(null);
    setCustomizing(false);
  };

  const toggleModifier = (modifier) => {
    if (!currItem) return;
    setOrder((prev) =>
      prev.map((entry) => {
        if (entry.instance_id !== currItem.instance_id) return entry;
        const isTopping = modifier.category === "Topping";
        let newModifiers = [...(entry.modifiers || [])];
        if (isTopping) {
          const existingIndex = newModifiers.findIndex((m) => m.option_id === modifier.option_id);
          if (existingIndex >= 0) {
            newModifiers.splice(existingIndex, 1);
          } else {
            newModifiers.push({ ...modifier, qty: 1 });
          }
        } else {
          newModifiers = newModifiers.filter((m) => m.category !== modifier.category);
          newModifiers.push({ ...modifier, qty: 1 });
        }
        return { ...entry, modifiers: newModifiers };
      })
    );
  };

  const setModifierQty = (optionId, delta) => {
    if (!currItem) return;
    setOrder((prev) =>
      prev.map((entry) => {
        if (entry.instance_id !== currItem.instance_id) return entry;
        const idx = (entry.modifiers || []).findIndex((m) => m.option_id === optionId);
        if (idx < 0) return entry;
        const updated = [...entry.modifiers];
        updated[idx] = { ...updated[idx], qty: (updated[idx].qty || 1) + delta };
        if (updated[idx].qty <= 0) updated.splice(idx, 1);
        return { ...entry, modifiers: updated };
      })
    );
  };
  const handleSignOut = () => navigate("/");

  const handleLookup = async () => {
    if (!customerEmail.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/customers/lookup?email=${encodeURIComponent(customerEmail)}`);
      if (!res.ok) {
        setLookupMessage("Customer not found.");
        setLinkedCustomer(null);
        setRedeemVoucher(false);
        return;
      }
      const data = await res.json();
      setLinkedCustomer(data);
      setLookupMessage("Account linked!");
    } catch (err) {
      setLookupMessage("Error looking up account.");
    }
  };

  const submitOrder = async () => {
    try {
      // 1. Create Order
      const orderReq = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: 1, customerId: linkedCustomer?.id })
      });
      const orderData = await orderReq.json();
      const orderId = orderData.orderId;

      // 2. Add all items in parallel
      await Promise.all(order.map(item =>
        fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.product_id,
            quantity: item.qty,
            modifiers: (item.modifiers || []).flatMap((modifier) =>
              Array(modifier.qty || 1).fill(modifier.option_id)
            )
          })
        })
      ));

      // 3. Checkout
      await fetch(`${API_BASE_URL}/orders/${orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          redeemVoucher: redeemVoucher, 
          customerId: linkedCustomer?.id 
        })
      });

      alert("Order submitted successfully!");
      setOrder([]);
      setLinkedCustomer(null);
      setCustomerEmail("");
      setRedeemVoucher(false);
      setLookupMessage("");
    } catch (err) {
      console.error(err);
      alert("Error submitting order.");
    }
  };

  const itemTotal = (item) => {
    const mods = (item.modifiers || []).reduce(
      (sum, modifier) =>
        sum + Number(modifier.price_adjustment || 0) * (modifier.qty || 1),
      0
    );
    return (Number(item.base_price) + mods) * item.qty;
  };

  const subtotal = order.reduce((sum, item) => sum + itemTotal(item), 0);
  
  let discount = 0;
  if (redeemVoucher && order.length > 0) {
    // Discount max item price visually before submission
    const maxPrice = Math.max(...order.map((item) => itemTotal(item)));
    discount = maxPrice;
  }
  
  const tax = Math.max(0, (subtotal - discount) * 0.0825);
  const total = Math.max(0, subtotal - discount) + tax;

  const SidebarContent = (
    <>
      <h2 className="cashier-heading">Current Order</h2>
      <div className="cashier-order-list">
        {order.map((item) => (
          <div key={item.instance_id} className="cashier-order-item">
            <span>
              {item.qty}x {item.name}
              {item.modifiers?.length
                ? ` (${item.modifiers
                    .map((m) => `${m.qty > 1 ? `${m.qty}x ` : ""}${m.name}`)
                    .join(", ")})`
                : ""}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="cashier-remove-btn" onClick={() => setQtyItem(item.instance_id, -1)}>
                -
              </button>
              <button className="cashier-remove-btn" onClick={() => setQtyItem(item.instance_id, 1)}>
                +
              </button>
              <button className="cashier-remove-btn" onClick={() => editItem(item)}>
                Edit
              </button>
              <button className="cashier-remove-btn" onClick={() => removeItem(item.instance_id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cashier-rewards-section" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '10px' }}>
        <h4>Rewards Account</h4>
        {!linkedCustomer ? (
          <div>
            <input 
              type="email" 
              placeholder="Customer Email" 
              value={customerEmail} 
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{ padding: '5px', width: '100%', marginBottom: '5px' }}
            />
            <button onClick={handleLookup} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', borderRadius: '4px' }}>Lookup</button>
            {lookupMessage && <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>{lookupMessage}</p>}
          </div>
        ) : (
          <div>
            <p><strong>{linkedCustomer.name || linkedCustomer.email}</strong></p>
            <p>Points: {linkedCustomer.points}</p>
            {linkedCustomer.points >= 65 && (
              <button 
                onClick={() => setRedeemVoucher(!redeemVoucher)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: redeemVoucher ? '#28a745' : '#17a2b8', 
                  color: 'white', 
                  borderRadius: '4px',
                  marginTop: '5px'
                }}
              >
                {redeemVoucher ? 'Voucher Applied (-65 pts)' : 'Apply Free Drink Voucher (--65 pts)'}
              </button>
            )}
            <button 
              onClick={() => { setLinkedCustomer(null); setRedeemVoucher(false); setCustomerEmail(""); setLookupMessage(""); }}
              style={{ width: '100%', padding: '5px', background: '#dc3545', color: 'white', borderRadius: '4px', marginTop: '5px' }}
            >
              Remove Account
            </button>
          </div>
        )}
      </div>

      <div className="cashier-pinned">
        {discount > 0 && (
          <div className="cashier-total-row" style={{ color: '#28a745' }}>
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="cashier-total-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="cashier-total-row">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="cashier-total-row" style={{ fontWeight: 'bold' }}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="cashier-submit-btn" disabled={order.length === 0} onClick={submitOrder}>
          Submit Order
        </button>
      </div>
    </>
  );

  const categories = ["All", ...new Set(products.map(p => p.category_name).filter(Boolean))];
  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category_name === activeCategory);

  const MenuContent = (
    <div className="cashier-menu">
      <h2 className="cashier-heading">Menu</h2>
      <div className="cashier-category-nav">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`cashier-category-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="cashier-product-grid">
        {filteredProducts.map((p) => (
          <button
            key={p.product_id}
            className={`cashier-product-btn ${p.is_available === false ? "unavailable" : ""}`}
            onClick={() => addItem(p)}
            disabled={p.is_available === false}
            title={p.is_available === false ? "Out of stock ingredients" : ""}
          >
            {p.name}
            {p.is_available === false ? " (Out of stock)" : ""}
          </button>
        ))}
      </div>
    </div>
  );

  if (customizing && currItem) {
    return (
      <div className="cashier-layout">
        <div className="cashier-menu">
          <h2 className="cashier-heading">Customize {currItem.name}</h2>
          {["Topping", "Ice Level", "Sugar Level", "Size", "Milk Type"].map((category) => (
            <div key={category} style={{ marginBottom: "12px" }}>
              <h4 style={{ marginBottom: "6px" }}>{category}</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {getProductModifiers(currItem.product_id)
                  .filter((modifier) => modifier.category === category)
                  .map((modifier) => {
                    const selected = order
                      .find((item) => item.instance_id === currItem.instance_id)
                      ?.modifiers?.find((entry) => entry.option_id === modifier.option_id);
                    return (
                      <button
                        key={modifier.option_id}
                        className="cashier-category-btn"
                        style={{ borderColor: selected ? "#333" : undefined }}
                        onClick={() => toggleModifier(modifier)}
                      >
                        {modifier.name}
                        {Number(modifier.price_adjustment) > 0
                          ? ` (+$${Number(modifier.price_adjustment).toFixed(2)})`
                          : ""}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          <button className="cashier-submit-btn" onClick={closeCustomization}>
            Done
          </button>
        </div>
        <div className="cashier-sidebar">
          <h2 className="cashier-heading">Selected Modifiers</h2>
          {(order.find((item) => item.instance_id === currItem.instance_id)?.modifiers || []).map(
            (modifier) => (
              <div key={modifier.option_id} className="cashier-order-item">
                <span>{modifier.name}</span>
                {modifier.category === "Topping" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="cashier-remove-btn"
                      onClick={() => setModifierQty(modifier.option_id, -1)}
                    >
                      -
                    </button>
                    <span>{modifier.qty || 1}</span>
                    <button
                      className="cashier-remove-btn"
                      onClick={() => setModifierQty(modifier.option_id, 1)}
                    >
                      +
                    </button>
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return showNav ? (
    <div className="cashier-page">
      <nav className="cashier-navbar">
        <button className="cashier-signout-btn" onClick={handleSignOut}>Sign Out</button>
      </nav>
      <div className="cashier-layout">
        {MenuContent}
        <div className="cashier-sidebar">
          {SidebarContent}
        </div>
      </div>
    </div>
  ) : (
    <div className="cashier-layout">
      {MenuContent}
      <div className="cashier-sidebar">
        {SidebarContent}
      </div>
    </div>
  );
};

export default Cashier;
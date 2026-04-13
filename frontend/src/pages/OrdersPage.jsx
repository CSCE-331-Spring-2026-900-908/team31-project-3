import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import "./OrdersPage.css";
import API_BASE_URL from "../config/apiBaseUrl";
import { getWeather } from "./WeatherAPI";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const OrdersPage = ({ cashierMode = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [temp, setTemp] = useState(null);

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
  }, []);

    useEffect(() => {
        async function loadWeather() {
            const data = await getWeather();
            setTemp(data.temp);
        }
        loadWeather();
    }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    const rec = "Recommended Based On Weather"
    
    const recArray = []
    for(const p of products){
      if(temp > 50 && !p.can_be_served_hot){
        recArray.push(p);
        continue;
      }

      else if(temp < 50 && p.can_be_served_hot){
        recArray.push(p);
        continue;
      }
    }

    const shuffled = [...recArray].sort(() => 0.5 - Math.random());
    const randomFive = shuffled.slice(0, 5);
    map.set(rec,randomFive);

    for (const p of products) {
      const cat = p.category_name || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    }

    return [...map.entries()].sort(([a], [b]) => {
    if (a === rec) return -1;
    if (b === rec) return 1;
    return a.localeCompare(b);
  });
  }, [products,temp]);

  const addItem = (product) => {
    setOrder((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing)
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeItem = (id) =>
    setOrder((prev) => prev.filter((i) => i.product_id !== id));

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

      // 2. Add Items
      for (const item of order) {
        await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.product_id,
            quantity: item.qty,
            modifiers: []
          })
        });
      }

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

  const subtotal = order.reduce((sum, i) => sum + i.base_price * i.qty, 0);

  let discount = 0;
  if (redeemVoucher && order.length > 0) {
    const maxPrice = Math.max(...order.map(i => i.base_price));
    discount = maxPrice;
  }
  
  const tax = Math.max(0, (subtotal - discount) * 0.0825);
  const total = Math.max(0, subtotal - discount) + tax;

  const handleTabClick = (t) => {
    if (t === "Orders") return;
    const params = new URLSearchParams({ tab: t });
    navigate(`/manager?${params.toString()}`);
  };

  return (
    <div className="orders-page">
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
          {grouped.filter(([cat]) => selectedCategory === "All" || cat === selectedCategory).map(([category, items]) => (
            <div key={category} className="orders-category-section">
              <h3 className="orders-category-heading">{category}</h3>
              <div className="orders-product-grid">
                {items.map((p) => (
                  <button
                    key={p.product_id}
                    className="orders-product-btn"
                    onClick={() => addItem(p)}
                  >
                    <span className="orders-product-name">{p.name}</span>
                    <span className="orders-product-price">
                      ${Number(p.base_price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="orders-sidebar">
          <h2 className="orders-sidebar-heading">Current Order</h2>
          <div className="orders-order-list">
            {order.map((item) => (
              <div key={item.product_id} className="orders-order-item">
                <div className="orders-order-item-info">
                  <span className="orders-order-item-name">{item.name}</span>
                  <span className="orders-order-item-qty">x{item.qty}</span>
                </div>
                <div className="orders-order-item-right">
                  <span className="orders-order-item-price">
                    ${(item.base_price * item.qty).toFixed(2)}
                  </span>
                  <button
                    className="orders-remove-btn"
                    onClick={() => removeItem(item.product_id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {order.length === 0 && (
              <p className="orders-empty">No items added yet.</p>
            )}
          </div>

          <div className="orders-rewards-panel">
            <h4 className="orders-rewards-heading">Rewards Account</h4>
            {!linkedCustomer ? (
              !isRewardsExpanded ? (
                <button 
                  className="orders-rewards-btn"
                  style={{ background: '#e5e7eb', color: '#374151', border: '1px dashed #9ca3af' }}
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
                    className="orders-rewards-input"
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleLookup} className="orders-rewards-btn">Lookup</button>
                    <button 
                      onClick={() => { setIsRewardsExpanded(false); setCustomerEmail(""); setLookupMessage(""); }} 
                      className="orders-rewards-btn" 
                      style={{ background: '#9ca3af' }}
                    >
                      Cancel
                    </button>
                  </div>
                  {lookupMessage && <p className="orders-rewards-msg">{lookupMessage}</p>}
                </div>
              )
            ) : (
              <div>
                <p className="orders-rewards-customer"><strong>{linkedCustomer.name || linkedCustomer.email}</strong></p>
                <p className="orders-rewards-customer">Points: {linkedCustomer.points}</p>
                {linkedCustomer.points >= 65 && (
                  <button 
                    onClick={() => setRedeemVoucher(!redeemVoucher)}
                    className={`orders-rewards-voucher-btn ${redeemVoucher ? 'applied' : ''}`}
                  >
                    {redeemVoucher ? 'Voucher Applied (-65 pts)' : 'Apply Free Drink (' + String.fromCharCode(8211) + '65 pts)'}
                  </button>
                )}
                <button 
                  onClick={() => { setLinkedCustomer(null); setRedeemVoucher(false); setCustomerEmail(""); setLookupMessage(""); }}
                  className="orders-rewards-remove-btn"
                >
                  Remove Account
                </button>
              </div>
            )}
          </div>

          <div className="orders-pinned">
            {discount > 0 && (
              <div className="orders-sub-row" style={{ color: '#28a745' }}>
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
    </div>
  );
};

export default OrdersPage;

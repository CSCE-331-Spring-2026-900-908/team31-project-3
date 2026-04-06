import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Manager.css";
import "./OrdersPage.css";
import API_BASE_URL from "../config/apiBaseUrl";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const OrdersPage = ({ cashierMode = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE_URL}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
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

  const total = order.reduce((sum, i) => sum + i.base_price * i.qty, 0);

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
                    <div className="orders-product-img-placeholder" />
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
          <div className="orders-pinned">
            <div className="orders-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              className="orders-submit-btn"
              disabled={order.length === 0}
              onClick={() => {
                alert("Order submitted!");
                setOrder([]);
              }}
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

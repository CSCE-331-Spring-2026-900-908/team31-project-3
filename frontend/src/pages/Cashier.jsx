import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cashier.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const Cashier = ({ showNav = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState([]);

  useEffect(() => {
    fetch(`${API}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const addItem = (product) => {
    setOrder((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeItem = (id) => setOrder((prev) => prev.filter((i) => i.product_id !== id));
  const handleSignOut = () => navigate("/");

  const total = order.reduce((sum, i) => sum + i.base_price * i.qty, 0);

  return showNav ? (
    <div className="cashier-page">
      <nav className="cashier-navbar">
        <button className="cashier-signout-btn" onClick={handleSignOut}>Sign Out</button>
      </nav>
      <div className="cashier-layout">
        <div className="cashier-menu">
          <h2 className="cashier-heading">Menu</h2>
          <div className="cashier-product-grid">
            {products.map((p) => (
              <button key={p.product_id} className="cashier-product-btn" onClick={() => addItem(p)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="cashier-sidebar">
          <h2 className="cashier-heading">Current Order</h2>
          <div className="cashier-order-list">
            {order.map((item) => (
              <div key={item.product_id} className="cashier-order-item">
                <span>{item.name}</span>
                <button className="cashier-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
              </div>
            ))}
          </div>
          <div className="cashier-pinned">
            <div className="cashier-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="cashier-submit-btn" disabled={order.length === 0} onClick={() => { alert("Order submitted!"); setOrder([]); }}>
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="cashier-layout">
      <div className="cashier-menu">
        <h2 className="cashier-heading">Menu</h2>
        <div className="cashier-product-grid">
          {products.map((p) => (
            <button key={p.product_id} className="cashier-product-btn" onClick={() => addItem(p)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="cashier-sidebar">
        <h2 className="cashier-heading">Current Order</h2>
        <div className="cashier-order-list">
          {order.map((item) => (
            <div key={item.product_id} className="cashier-order-item">
              <span>{item.name}</span>
              <button className="cashier-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="cashier-pinned">
          <div className="cashier-total-row">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="cashier-submit-btn" disabled={order.length === 0} onClick={() => { alert("Order submitted!"); setOrder([]); }}>
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cashier;
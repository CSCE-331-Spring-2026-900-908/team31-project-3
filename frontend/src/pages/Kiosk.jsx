import { useState, useEffect } from "react";
import "./Kiosk.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const categories = ["Milk Foam Series", "Milk Tea Series", "Creative Mix Series", "Brewed Tea Series", "Coffee Series", "Slush Series"];

const Kiosk = ({ showNav = false }) => {
  const [customizing, setCustomizing] = useState(false);
  const [currItem, setCurrItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [productModifiers, setProductModifiers] = useState([]);
  const [order, setOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Milk Tea Series");
  let defaultModifiers = [];

  useEffect(() => {
    fetch(`${API}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch(`${API}/productmodifier`)
      .then((r) => r.json())
      .then((data) => setProductModifiers(Array.isArray(data) ? data : []))
      .catch(console.error);
    for(const modifier of productModifiers) {
      if(modifier.is_default) {
        defaultModifiers.push({ ...modifier, qty: 1 });
      }
    }
  }, []);

  const addItem = (product) => {
    setOrder((prev) => {
      setCustomizing(true);
      setCurrItem({product})
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, modifiers: structuredClone(defaultModifiers), qty: 1 }];
    });
  };

  const addModifier = (modifier) => {
    if(currItem == null) {
      return;
    }
    setOrder((prev) => {
      const existing = currItem.modifiers.find((i) => i.option_id === modifier.option_id);
      if (existing) return prev.map((item) => item === currItem ? { ...item, modifiers: item.modifiers.map((i) => i.option_id === modifier.option_id ? { ...i, qty: i.qty + 1 } : i) } : item);
      return [...prev, { ...modifier, qty: 1 }];
    });
  };

  const removeModifier = (modifier) => {
    if(currItem == null) {
      return;
    }
  };

  const placeOrder = () => {
    const orderData = { employee_id: 1, created_at: new Date(), total_tax: 0, total_final: 0 };
    const [orderID, setOrderID] = useState([]);
    fetch(`${API}/orders`)
      .then((r) => r.json())
      .then((data) => setOrderID(data))
      .catch(console.error);
    for(let i = 0; i < order.length; i++) {
      fetch(`${API}/orders/${orderID}`).then();
    }
  };

  const removeItem = (id) => setOrder((prev) => prev.filter((i) => i.product_id !== id));

  const total = order.reduce((sum, i) => sum + i.base_price * i.qty, 0);

  return showNav ? (
    customizing ? (
      <div>
        
      </div>
    ) : (
    <div className="kiosk-page">
      <nav className="kiosk-navbar">
        <button className="kiosk-signout-btn">Sign Out</button>
      </nav>
      <div className="kiosk-layout">
        <div className="kiosk-topbar">
          {categories.map((category) =>
            <button key={category} className="kiosk-category-btn" onClick={() => setSelectedCategory(category)}>{category}</button>
          )}
        </div>

        <div className="kiosk-menu">
          <h2 className="kiosk-heading">Menu</h2>
          <div className="kiosk-product-grid">
            {products.filter((p) => p.category_name === selectedCategory).map((p) => (
              <button key={p.product_id} className="kiosk-product-btn" onClick={() => addItem(p)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="kiosk-sidebar">
          <h2 className="kiosk-heading">Current Order</h2>
          <div className="kiosk-order-list">
            {order.map((item) => (
              <div key={item.product_id} className="kiosk-order-item">
                <span>{item.name}</span>
                <button className="kiosk-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
              </div>
            ))}
          </div>
          <div className="kiosk-pinned">
            <div className="kiosk-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="kiosk-submit-btn" disabled={order.length === 0} onClick={() => { alert("Order submitted!"); setOrder([]); }}>
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
    )
  ) : (
    <div className="kiosk-layout">
      <div className="kiosk-menu">
        <h2 className="kiosk-heading">Menu</h2>
        <div className="kiosk-product-grid">
          {products.map((p) => (
            <button key={p.product_id} className="kiosk-product-btn" onClick={() => addItem(p)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="kiosk-sidebar">
        <h2 className="kiosk-heading">Current Order</h2>
        <div className="kiosk-order-list">
          {order.map((item) => (
            <div key={item.product_id} className="kiosk-order-item">
              <span>{item.name}</span>
              <button className="kiosk-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="kiosk-pinned">
          <div className="kiosk-total-row">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="kiosk-submit-btn" disabled={order.length === 0} onClick={() => { alert("Order submitted!"); setOrder([]); }}>
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Kiosk;
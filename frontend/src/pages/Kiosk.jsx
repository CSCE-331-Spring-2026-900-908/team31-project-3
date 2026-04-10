import { useState, useEffect } from "react";
import "./Kiosk.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const categories = ["Milk Foam Series", "Milk Tea Series", "Creative Mix Series", "Brewed Tea Series", "Coffee Series", "Slush Series"];

const Kiosk = ({ showNav = false }) => {
  const [customizing, setCustomizing] = useState(false);
  const [viewCart, setViewCart] = useState(false);
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
      const newItem = { ...product, modifiers: structuredClone(defaultModifiers), qty: 1 };
      setCurrItem(newItem);
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, newItem];
    });
  };

  const customizeItem = (item) => {
    setCurrItem(item);
    setCustomizing(true);
  };

  const endCustomization = () => {
    setCurrItem(null);
    setCustomizing(false);
  };

  const addModifier = (modifier, exclusive) => {
    if(currItem === null) {
      return;
    }
    setOrder((prev) => {
      if (exclusive) return prev.map((item) => item === currItem ? { ...item, modifiers: item.modifiers.filter((i) => i.category !== modifier.category).concat({ ...modifier, qty: 1 }) } : item);
      const existing = currItem.modifiers.find((i) => i.option_id === modifier.option_id);
      if (existing) return prev.map((item) => item === currItem ? { ...item, modifiers: item.modifiers.map((i) => i.option_id === modifier.option_id ? { ...i, qty: i.qty + 1 } : i) } : item);
      return [...prev, { ...modifier, qty: 1 }];
    });
  };

  const removeModifier = (modifier) => {
    if(currItem === null) {
      return;
    }
    setOrder((prev) => {
      return prev.map((item) => item === currItem ? { ...item, modifiers: item.modifiers.filter((i) => i.option_id !== modifier.option_id) } : item);
    });
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

  if (customizing && currItem) {
    return (
      <div className="kiosk-page">
        <nav className="kiosk-navbar">
          <button className="kiosk-signout-btn">Sign Out</button>
        </nav>
        <div className="kiosk-layout">
          <div className="kiosk-topbar">
          <button className="kiosk-back-btn" onClick={() => endCustomization()}>Back to Menu</button>
            <h2 className="kiosk-heading">{currItem.name}</h2>
          </div>
        <div className="kiosk-display-layout">
            <div className="kiosk-menu">
              <h2 className="kiosk-heading">Toppings</h2>
              <div className="kiosk-product-grid">
                {productModifiers.filter((m) => m.category === "Topping").map((m) => (
                  <button key={m.option_id} className="kiosk-product-btn" onClick={() => addModifier(m)}>
                    {m.name} {currItem.modifiers.find((i) => i.option_id === m.option_id) ? `(${currItem.modifiers.find((i) => i.option_id === m.option_id).qty})` : ""}
                  </button>
                ))}
              </div>
              <h2 className="kiosk-heading">Ice Level</h2>
              <div className="kiosk-product-grid">
                {productModifiers.filter((m) => m.category === "Ice Level").map((m) => (
                  <button key={m.option_id} className="kiosk-product-btn" onClick={() => addModifier(m)}>
                    {m.name}
                  </button>
                ))}
              </div>
              <h2 className="kiosk-heading">Sugar Level</h2>
              <div className="kiosk-product-grid">
                {productModifiers.filter((m) => m.category === "Sugar Level").map((m) => (
                  <button key={m.option_id} className="kiosk-product-btn" onClick={() => addModifier(m)}>
                    {m.name}
                  </button>
                ))}
              </div>
              <h2 className="kiosk-heading">Size</h2>
              <div className="kiosk-product-grid">
                {productModifiers.filter((m) => m.category === "Size").map((m) => (
                  <button key={m.option_id} className="kiosk-product-btn" onClick={() => addModifier(m)}>
                    {m.name}
                  </button>
                ))}
              </div>
              <h2 className="kiosk-heading">Milk Type</h2>
              <div className="kiosk-product-grid">
                {productModifiers.filter((m) => m.category === "Milk Type").map((m) => (
                  <button key={m.option_id} className="kiosk-product-btn" onClick={() => addModifier(m)}>
                    {m.name}
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
            </div>
          </div>
        </div>
      </div>
    )
  } else if (viewCart) {
    return (
      <div className="kiosk-page">
        <nav className="kiosk-navbar">
          <button className="kiosk-signout-btn">Sign Out</button>
        </nav>
        <div className="kiosk-layout">
          <div className="kiosk-topbar">
            <button className="kiosk-category-btn" onClick={() => setViewCart(false)}>Back to Menu</button>
          </div>
          <div className="kiosk-menu">
            <h2 className="kiosk-heading">Cart</h2>
            <div className="kiosk-product-grid">
              {order.map((item) => (
                <div key={item.product_id} className="kiosk-order-item">
                  <span>{item.name} x{item.qty}</span>
                  <button className="kiosk-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return showNav ? (
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
        <div className="kiosk-display-layout">
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
    </div>
  ) : (
    <div className="kiosk-layout">
      <div className="kiosk-display-layout">
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
    </div>
  );
};

export default Kiosk;
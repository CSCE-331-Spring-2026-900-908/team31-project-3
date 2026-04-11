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
  let productCounter = 0;

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
      const newItem = { ...product, modifiers: structuredClone(defaultModifiers), qty: 1, instance_id: productCounter++ };
      setCurrItem(newItem);
      // const existing = prev.find((i) => i.product_id === product.product_id);
      // if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i);
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

  const toCart = () => {
    setCurrItem(null);
    setCustomizing(false);
    setViewCart(true);
  };

  const addModifier = (modifier, exclusive) => {
    if(currItem === null) {
      return;
    }
    setOrder((prev) => {
      if (exclusive) return prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: item.modifiers.filter((i) => i.category !== modifier.category).concat({ ...modifier, qty: 1 }) } : item);
      const existing = currItem.modifiers.find((i) => i.option_id === modifier.option_id);
      if (existing) return prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: item.modifiers.map((m) => m.option_id === modifier.option_id ? { ...m, qty: m.qty + 1 } : m) } : item);
      // return [...prev, { ...item, modifiers: [...item.modifiers, { ...modifier, qty: 1 }] }];
      return prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: [...item.modifiers, { ...modifier, qty: 1 }] } : item);
    });
  };

  const removeModifier = (option_id) => {
    if(currItem === null) {
      return;
    }
    setOrder((prev) => {
      return prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: item.modifiers.filter((i) => i.option_id !== option_id) } : item);
    });
  };

  const setQtyModifier = (option_id, delta) => {
    if(currItem === null) {
      return;
    }
    if(order.filter((item) => item.instance_id === currItem.instance_id)[0].modifiers.find((m) => m.option_id === option_id && m.qty + delta <= 0)) {
      removeModifier({ option_id });
      return;
    }
    setOrder((prev) => {
      return prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: item.modifiers.map((i) => i.option_id === option_id ? { ...i, qty: Math.max(i.qty + delta, 0) } : i) } : item);
    });
  };

  const setQtyItem = (instance_id, delta) => {
    setOrder((prev) => {
      return prev.map((item) => item.instance_id === instance_id ? { ...item, qty: Math.max(item.qty + delta, 0) } : item);
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

  const removeItem = (id) => setOrder((prev) => prev.filter((i) => i.instance_id !== id));

  const total = order.reduce((sum, i) => sum + i.base_price * i.qty, 0);

  if (customizing && currItem) {
    return (
      <div className="kiosk-page">
        <nav className="kiosk-navbar">
          <button className="kiosk-signout-btn">Sign Out</button>
        </nav>
        <div className="kiosk-layout">
          <div className="kiosk-topbar">
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
              <h2 className="kiosk-heading">{currItem.name}</h2>
              <div className="kiosk-order-list">
                {order.filter(item => item.instance_id === currItem.instance_id)[0]?.modifiers.map((modifier) => (
                  <div key={modifier.option_id} className="kiosk-order-item">
                    <span>{modifier.name}</span>
                    <button className="kiosk-subtract-btn" onClick={() => setQtyModifier(modifier.option_id, -1)}>-</button>
                    <span>{modifier.qty}</span>
                    <button className="kiosk-add-btn" onClick={() => setQtyModifier(modifier.option_id, 1)}>+</button>
                    <button className="kiosk-remove-btn" onClick={() => removeModifier(modifier.option_id)}>✕</button>
                  </div>
                ))}
              </div>
              <button className="kiosk-back-btn" onClick={() => endCustomization()}>Back to Menu</button>
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
            <div className="kiosk-cart">
              {order.map((item) => (
                <div key={item.product_id} className="kiosk-order-item">
                  <span>{item.name} x{item.qty}</span>
                  <button className="kiosk-remove-btn" onClick={() => customizeItem(item)}>EDIT</button>
                </div>
              ))}
            </div>
            <button className="kiosk-submit-btn" disabled={order.length === 0} onClick={() => { alert("Order submitted!"); setOrder([]); }}>
              Submit Order
            </button>
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
                <div key={item.instance_id} className="kiosk-order-item">
                  <span>{item.name}</span>
                  <button className="kiosk-remove-btn" onClick={() => removeItem(item.instance_id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="kiosk-pinned">
              <div className="kiosk-total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="kiosk-back-btn" onClick={() => toCart()}>View Cart</button>
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
                <button className="kiosk-remove-btn" onClick={() => removeItem(item.instance_id)}>✕</button>
              </div>
            ))}
          </div>
          <div className="kiosk-pinned">
            <div className="kiosk-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="kiosk-back-btn" onClick={() => toCart()}>View Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kiosk;
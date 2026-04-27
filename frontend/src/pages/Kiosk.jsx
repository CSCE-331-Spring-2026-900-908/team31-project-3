import { useState, useEffect, useMemo } from "react";
import "./Kiosk.css";
import { getWeather } from "./WeatherAPI";
import Chatbot from "./Chatbot";
import API_BASE_URL from "../config/apiBaseUrl";
import vegan_icon from "../assets/vegan_icon.png"; 
import dairy_icon from "../assets/Dairyicon.png"; 

const API = API_BASE_URL;

const RECOMMENDED = "Recommended Based On Weather";
const categories = ["Milk Foam Series", "Milk Tea Series", "Creative Mix Series", "Brewed Tea Series", "Coffee Series", "Slush Series", "Seasonal Series"];

const Kiosk = ({ showNav = false }) => {
  const [customizing, setCustomizing] = useState(false);
  const [currItem, setCurrItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [productModifiersByProductId, setProductModifiersByProductId] = useState({});
  const [order, setOrder] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(RECOMMENDED);
  const [weatherData, setWeatherData] = useState(null);
  const [rewardsEmail, setRewardsEmail] = useState("");
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [redeemVoucher, setRedeemVoucher] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeUI, setLargeUI] = useState(false);
  useEffect(() => {
    fetch(`${API}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const getProductModifiers = (productId) =>
    productModifiersByProductId[productId] || [];

  const ensureProductModifiers = async (productId) => {
    if (productModifiersByProductId[productId]) {
      return productModifiersByProductId[productId];
    }
    const response = await fetch(`${API}/product/${productId}/modifiers`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load product modifiers.");
    }
    const modifiers = Array.isArray(data) ? data : [];
    setProductModifiersByProductId((prev) => ({ ...prev, [productId]: modifiers }));
    return modifiers;
  };

  useEffect(() => {
    async function loadWeather() {
      try {
        const data = await getWeather();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to load weather", err);
      }
    }
    loadWeather();
  }, []);

  const recommendedProducts = useMemo(() => {
    const tmp = weatherData?.temp ?? 70;
    const filtered = products.filter((p) =>
      tmp > 50 ? !p.can_be_served_hot : p.can_be_served_hot
    );
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, [products, weatherData]);

  const addItem = async (product) => {
    try {
      const productModifiers = await ensureProductModifiers(product.product_id);
      const defaults = productModifiers
        .filter((m) => m.is_default)
        .map((m) => ({ ...m, qty: 1 }));
      const instance_id = Date.now() + Math.random();
      const newItem = { ...product, modifiers: defaults, qty: 1, instance_id };

      setOrder((prev) => [...prev, newItem]);
      setCurrItem(newItem);
      setCustomizing(true);
    } catch (err) {
      alert(err.message || "Could not load customization options.");
    }
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

  const endCustomization = () => {
    setCurrItem(null);
    setCustomizing(false);
  };

  const addModifier = (modifier) => {
    if (currItem === null) return;
    setOrder((prev) => {
      const isTopping = modifier.category === "Topping";
      return prev.map((item) => {
        if (item.instance_id !== currItem.instance_id) return item;
        let newModifiers = [...item.modifiers];
        if (isTopping) {
          const existingId = newModifiers.findIndex(m => m.option_id === modifier.option_id);
          if (existingId >= 0) newModifiers.splice(existingId, 1);
          else newModifiers.push({ ...modifier, qty: 1 });
        } else {
          newModifiers = newModifiers.filter(m => m.category !== modifier.category);
          newModifiers.push({ ...modifier, qty: 1 });
        }
        return { ...item, modifiers: newModifiers };
      });
    });
  };

  const removeModifier = (option_id) => {
    if (currItem === null) return;
    setOrder((prev) => prev.map((item) => item.instance_id === currItem.instance_id ? { ...item, modifiers: item.modifiers.filter((i) => i.option_id !== option_id) } : item));
  };

  const setQtyModifier = (option_id, delta) => {
    if (currItem === null) return;
    setOrder((prev) => prev.map((item) => {
      if (item.instance_id !== currItem.instance_id) return item;
      const modIndex = item.modifiers.findIndex(m => m.option_id === option_id);
      if (modIndex === -1) return item;
      const newMods = [...item.modifiers];
      const updatedMod = { ...newMods[modIndex], qty: (newMods[modIndex].qty || 1) + delta };
      if (updatedMod.qty <= 0) newMods.splice(modIndex, 1);
      else newMods[modIndex] = updatedMod;
      // newMods[modIndex].qty += delta;
      // if (newMods[modIndex].qty <= 0) newMods.splice(modIndex, 1);
      return { ...item, modifiers: newMods };
    }));
  };

  const setQtyItem = (instance_id, delta) => {
    const item = order.find((item) => item.instance_id === instance_id);
    if (!item) return;
    if (item.qty + delta <= 0) {
      setOrder((prev) => prev.filter((i) => i.instance_id !== instance_id));
      setCurrItem(null);
      setCustomizing(false);
      return;
    }
    setOrder((prev) => prev.map((i) => i.instance_id === instance_id ? { ...i, qty: i.qty + delta } : i));
  };

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper: Proxies external image URLs locally to bypass hotlink protection
  const getProxiedImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return `${API}/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleLookup = async () => {
    if (!rewardsEmail.trim()) return;
    try {
      const res = await fetch(`${API}/customers/lookup?email=${encodeURIComponent(rewardsEmail)}`);
      if (!res.ok) {
        setLookupMessage("Customer not found.");
        setLinkedCustomer(null);
        setRedeemVoucher(false);
        return;
      }
      const data = await res.json();
      setLinkedCustomer(data);
      if (data.points >= 65) {
        setRedeemVoucher(true);
        setLookupMessage(`Found! ${data.name} (${data.points} pts). Free Drink Applied!`);
      } else {
        setRedeemVoucher(false);
        setLookupMessage(`Found! ${data.name} (${data.points} pts). 65 needed for free drink.`);
      }
    } catch (err) {
      setLookupMessage("Error looking up account.");
    }
  };

  const placeOrder = async () => {
    if (order.length === 0) return;
    try {
      const payload = {
        employeeId: 1,
        customerId: linkedCustomer?.id || null,
        redeemVoucher: redeemVoucher,
        items: order.map(item => ({
          productId: item.product_id,
          quantity: item.qty,
          modifiers: (item.modifiers || []).flatMap(m => Array(m.qty || 1).fill(m.option_id))
        }))
      };

      const res = await fetch(`${API}/orders/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Bulk submission failed");

      setOrder([]);
      setLinkedCustomer(null);
      setRewardsEmail("");
      setRedeemVoucher(false);
      setLookupMessage("");
      setRewardsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error submitting order.");
    }
  };

  const removeItem = (instance_id) => setOrder((prev) => prev.filter((i) => i.instance_id !== instance_id));

  const itemTotal = (item) => {
    const modCost = (item.modifiers || []).reduce(
      (sum, m) => sum + Number(m.price_adjustment || 0) * (m.qty || 1),
      0
    );
    return (Number(item.base_price) + modCost) * item.qty;
  };

  const subtotal = order.reduce((sum, i) => sum + itemTotal(i), 0);
  let discount = 0;
  if (redeemVoucher && order.length > 0) {
    const maxPrice = Math.max(...order.map(i => i.base_price));
    discount = maxPrice;
  }
  const tax = Math.max(0, (subtotal - discount) * 0.0825);
  const total = Math.max(0, subtotal - discount) + tax;

  // Weather Widget Component
  const WeatherWidget = () => (
    weatherData && (
      <div className="kiosk-weather-widget">
        <img src={weatherData.icon} alt="Weather icon" />
        <div className="kiosk-weather-info">
          <span className="kiosk-weather-temp">{weatherData.temp}°F</span>
          <span className="kiosk-weather-desc">{weatherData.description}</span>
        </div>
      </div>
    )
  );

  // Render customization screen
  if (customizing && currItem) {
    return (
      <div
        className={[
          "kiosk-page",
          highContrast ? "kiosk-page--high-contrast" : "",
          largeUI ? "kiosk-page--large-ui" : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showNav && (
          <nav className="kiosk-navbar">
            <button className="kiosk-signout-btn">Sign Out</button>
          </nav>
        )}
        <div className="kiosk-accessibility-controls" aria-label="Accessibility settings">
          <button
            type="button"
            className={`kiosk-accessibility-btn ${highContrast ? "active" : ""}`}
            onClick={() => setHighContrast((value) => !value)}
            aria-pressed={highContrast}
          >
            {highContrast ? "High Contrast: On" : "High Contrast: Off"}
          </button>
          <button
            type="button"
            className={`kiosk-accessibility-btn ${largeUI ? "active" : ""}`}
            onClick={() => setLargeUI((value) => !value)}
            aria-pressed={largeUI}
          >
          {largeUI ? "Large UI: On" : "Large UI: Off"}
        </button>
        </div>
        <div className="kiosk-layout customizing">
          <div className="kiosk-topbar">
            <h2 className="kiosk-heading">Customizing: {currItem.name}</h2>
            <WeatherWidget />
          </div>
          <div className="kiosk-display-layout">
            <div className="kiosk-menu" aria-label="Customization options">
              {['Topping', 'Ice Level', 'Sugar Level', 'Size', 'Milk Type'].map(category => (
                <div key={category} className="kiosk-modifier-group" aria-label={category}>
                  <h2 className="kiosk-heading">{category}s</h2>
                  <div className="kiosk-product-grid modifiers">
                    {getProductModifiers(currItem.product_id).filter((m) => m.category === category).map((m) => {
                      const activeItem = order.find(item => item.instance_id === currItem.instance_id);
                      const applied = activeItem?.modifiers.find((i) => String(i.option_id) === String(m.option_id));
                      return (
                        <div key={m.option_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button className={`kiosk-product-btn ${applied ? 'applied' : ''}`} onClick={() => addModifier(m)} style={{ flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span>{m.name}</span>
                              {Number(m.price_adjustment) > 0 && (
                                <span style={{ fontSize: '0.85rem', color: highContrast ? applied ? '#000000' : '#ffffff' : applied ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>
                                  +${Number(m.price_adjustment).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {category === 'Topping' && m.image_url && (
                              <img 
                                src={m.image_url} 
                                alt={m.name} 
                                className="kiosk-product-image" 
                              />
                            )}
                          </button>
                          {category === 'Topping' && applied && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '8px', background: '#e2e8f0', borderRadius: '8px' }}>
                              <button onClick={() => setQtyModifier(m.option_id, -1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }} aria-label={`Decrease quantity of ${m.name}`}>-</button>
                              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }} role="status" aria-label={`Quantity of ${m.name}`} aria-live="polite">
                                {applied.qty || 1}
                              </span>
                              <button onClick={() => setQtyModifier(m.option_id, 1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }} aria-label={`Increase quantity of ${m.name}`}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="kiosk-sidebar customize-sidebar">
              <h2 className="kiosk-heading">{currItem.name} Details</h2>
              <div className="kiosk-order-list">
                <div className="kiosk-order-item cart-item" style={{ marginBottom: '16px' }}>
                  <div className="cart-item-header">
                    <span className="cart-item-name">Drink Quantity</span>
                  </div>
                  <div className="modifier-controls">
                    <button className="kiosk-qty-btn" onClick={() => setQtyItem(currItem.instance_id, -1)} aria-label={`Decrease quantity of ${currItem.name}`}>-</button>
                    <span className="kiosk-qty-text" role="status" aria-label={`Quantity of ${currItem.name}`} aria-live="polite">
                      {order.find(item => item.instance_id === currItem.instance_id)?.qty || 1}
                    </span>
                    <button className="kiosk-qty-btn" onClick={() => setQtyItem(currItem.instance_id, 1)} aria-label={`Increase quantity of ${currItem.name}`}>+</button>
                  </div>
                </div>
                {order.find(item => item.instance_id === currItem.instance_id)?.modifiers.map((modifier) => (
                  <div key={modifier.option_id} className="kiosk-order-item" style={{ padding: '8px 0', borderBottom: 'none' }}>
                    <span className="modifier-name">
                      {modifier.qty > 1 ? `${modifier.qty}x ` : ''}{modifier.name} {Number(modifier.price_adjustment) > 0 ? `(+$${(Number(modifier.price_adjustment) * (modifier.qty || 1)).toFixed(2)})` : ''}
                    </span>
                  </div>
                ))}
              </div>
              <button className="kiosk-submit-btn" onClick={() => endCustomization()} style={{ marginBottom: '8px' }}>Done Customizing</button>
              <button className="kiosk-back-btn" onClick={() => { removeItem(currItem.instance_id); endCustomization(); }}>Cancel Item</button>
            </div>
          </div>
        </div>
        <Chatbot />
      </div>
    );
  }

  // Main menu view
  return (
    <div
      className={[
        "kiosk-page",
        highContrast ? "kiosk-page--high-contrast" : "",
        largeUI ? "kiosk-page--large-ui" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showNav && (
        <nav className="kiosk-navbar">
          <button className="kiosk-signout-btn">Sign Out</button>
        </nav>
      )}
      <div className="kiosk-accessibility-controls" aria-label="Accessibility settings">
        <button
          type="button"
          className={`kiosk-accessibility-btn ${highContrast ? "active" : ""}`}
          onClick={() => setHighContrast((value) => !value)}
          aria-pressed={highContrast}
        >
          {highContrast ? "High Contrast: On" : "High Contrast: Off"}
        </button>
        <button
          type="button"
          className={`kiosk-accessibility-btn ${largeUI ? "active" : ""}`}
          onClick={() => setLargeUI((value) => !value)}
          aria-pressed={largeUI}
        >
          {largeUI ? "Large UI: On" : "Large UI: Off"}
        </button>
      </div>
      <div className="kiosk-layout">
        <div className="kiosk-topbar">
          <div className="kiosk-category-scroll">
            <button key={RECOMMENDED} className={`kiosk-category-btn${selectedCategory === RECOMMENDED ? " active" : ""}`} onClick={() => scrollToCategory(RECOMMENDED)}>{RECOMMENDED}</button>
            {categories.map((category) =>
              <button key={category} className={`kiosk-category-btn${selectedCategory === category ? " active" : ""}`} onClick={() => scrollToCategory(category)}>{category}</button>
            )}
          </div>
          <WeatherWidget />
        </div>
        <div className="kiosk-display-layout">
          <div className="kiosk-menu" style={{ scrollBehavior: 'smooth' }}>
            {recommendedProducts.length > 0 && (
              <div id={`category-${RECOMMENDED.replace(/\s+/g, '-')}`} style={{ scrollMarginTop: '24px' }}>
                <h2 className="kiosk-heading">{RECOMMENDED}</h2>
                <div className="kiosk-product-grid">
                  {recommendedProducts.map((p) => (
                    <button key={`rec-${p.product_id}`} className="kiosk-product-btn" onClick={() => addItem(p)}>
                      {p.name}
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="kiosk-product-image" 
                      />
                        {(p.diet === 'Vegan') && 
                          <img className="dietImg" src = {vegan_icon}/>}
                        {(p.diet === 'Dairy') && 
                          <img className="dietImg" src = {dairy_icon}/>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {categories.map(category => {
              const catProducts = products.filter((p) => p.category_name === category);
              if (catProducts.length === 0) return null;
              return (
                <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} style={{ scrollMarginTop: '24px' }}>
                  <h2 className="kiosk-heading">{category}</h2>
                  <div className="kiosk-product-grid">
                    {catProducts.map((p) => (
                      <button key={p.product_id} className="kiosk-product-btn" onClick={() => addItem(p)}>
                        {p.name}
                        <img 
                          src={getProxiedImageUrl(p.image_url)} 
                          alt={p.name} 
                          className="kiosk-product-image" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f8fafc' rx='12'/><text x='50' y='50' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' font-weight='600' fill='%2394a3b8'>NO IMAGE</text></svg>";
                          }}
                        />
                        
                        
                        
                        {(p.diet === 'Vegan') && 
                          <img className="dietImg" src = {vegan_icon}/>}
                        {(p.diet === 'Dairy') && 
                          <img className="dietImg" src = {dairy_icon}/>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Rewards Floating Overlay ── */}
          <div className="kiosk-rewards-overlay">
            {/* Toggle button — always visible */}
            <button
              className={`kiosk-rewards-fab${linkedCustomer ? ' linked' : ''}`}
              onClick={() => setRewardsOpen(o => !o)}
            >
              🎁 {linkedCustomer ? linkedCustomer.name.split(' ')[0] : 'Rewards'}
              {linkedCustomer && (
                <span className="kiosk-rewards-fab-pts">
                  {redeemVoucher ? `${linkedCustomer.points - 65} pts` : `${linkedCustomer.points} pts`}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {rewardsOpen && (
              <div className="kiosk-rewards-dropdown">
                <div className="kiosk-rewards-dropdown-section">
                  <input
                    type="email"
                    placeholder="Enter rewards email..."
                    value={rewardsEmail}
                    onChange={(e) => setRewardsEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="kiosk-email-field"
                    style={{ marginBottom: '8px' }}
                    autoFocus
                    aria-label="Rewards email input field"
                  />
                  <button onClick={handleLookup} className="kiosk-apply-rewards-btn" style={{ width: '100%' }}>Look Up</button>
                  {lookupMessage && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px', textAlign: 'center', lineHeight: 1.4 }}>{lookupMessage}</div>
                  )}
                </div>
                {linkedCustomer && (
                  <div className="kiosk-rewards-dropdown-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px' }}>{linkedCustomer.name}</div>
                    <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600, marginBottom: '10px' }}>
                      {redeemVoucher
                        ? <><span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '4px' }}>{linkedCustomer.points}</span><span style={{ color: '#ef4444', fontWeight: 800 }}>{linkedCustomer.points - 65} pts</span></>
                        : <>{linkedCustomer.points} pts</>
                      }
                    </div>
                    {linkedCustomer.points >= 65 && (
                      <button onClick={() => setRedeemVoucher(!redeemVoucher)} className={`kiosk-voucher-btn${redeemVoucher ? ' active' : ''}`}>
                        {redeemVoucher ? '✓ Voucher Applied' : 'Use Free Drink (-65 pts)'}
                      </button>
                    )}
                    <button onClick={() => { setLinkedCustomer(null); setRedeemVoucher(false); setRewardsEmail(''); setLookupMessage(''); }} className="kiosk-rewards-remove-btn">
                      Remove Account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="kiosk-sidebar main-cart-sidebar">
            <h2 className="kiosk-heading">Your Order</h2>

            <div className="kiosk-order-list">

              {order.map((item) => (
                <div key={item.instance_id} className="kiosk-order-item cart-item">
                  <div className="cart-item-header">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">${itemTotal(item).toFixed(2)}</span>
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                     <div className="cart-item-modifiers">
                        {item.modifiers.map(m => `${m.qty > 1 ? `${m.qty}x ` : ''}${m.name}${Number(m.price_adjustment) > 0 ? ` (+$${(Number(m.price_adjustment) * (m.qty || 1)).toFixed(2)})` : ''}`).join(", ")}
                     </div>
                  )}
                  <div className="modifier-controls">
                    <button className="kiosk-qty-btn" onClick={() => setQtyItem(item.instance_id, -1)} aria-label={`Decrease quantity of ${item.name}`}>-</button>
                    <span className="kiosk-qty-text" role="status" aria-label={`Quantity of ${item.name}`} aria-live="polite">{item.qty}</span>
                    <button className="kiosk-qty-btn" onClick={() => setQtyItem(item.instance_id, 1)} aria-label={`Increase quantity of ${item.name}`}>+</button>
                    <button className="kiosk-edit-btn" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`}>EDIT</button>
                    <button className="kiosk-remove-btn" onClick={() => removeItem(item.instance_id)} aria-label={`Remove ${item.name}`}>✕</button>
                  </div>
                </div>
              ))}
              {order.length === 0 && (
                <div className="kiosk-empty-cart">
                  <p>Your cart is empty.</p>
                  <p>Select an item to begin!</p>
                </div>
              )}
            </div>
            <div className="kiosk-pinned">



              {discount > 0 && (
                <div className="kiosk-total-row" style={{ paddingTop: '8px', borderTop: 'none', color: '#2dd4bf' }}>
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="kiosk-total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="kiosk-total-row tax">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="kiosk-total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button 
                className="kiosk-submit-btn" 
                disabled={order.length === 0} 
                onClick={placeOrder}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default Kiosk;
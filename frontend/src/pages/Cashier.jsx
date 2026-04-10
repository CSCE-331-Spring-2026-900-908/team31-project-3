import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cashier.css";
import API_BASE_URL from "../config/apiBaseUrl";

const Cashier = ({ showNav = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState([]);
  
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

  const addItem = (product) => {
    setOrder((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeItem = (id) => setOrder((prev) => prev.filter((i) => i.product_id !== id));
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
    // Discount max item price visually before submission
    const maxPrice = Math.max(...order.map(i => i.base_price));
    discount = maxPrice;
  }
  
  const tax = Math.max(0, (subtotal - discount) * 0.0825);
  const total = Math.max(0, subtotal - discount) + tax;

  const SidebarContent = (
    <>
      <h2 className="cashier-heading">Current Order</h2>
      <div className="cashier-order-list">
        {order.map((item) => (
          <div key={item.product_id} className="cashier-order-item">
            <span>{item.qty}x {item.name}</span>
            <button className="cashier-remove-btn" onClick={() => removeItem(item.product_id)}>✕</button>
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
          {SidebarContent}
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
        {SidebarContent}
      </div>
    </div>
  );
};

export default Cashier;
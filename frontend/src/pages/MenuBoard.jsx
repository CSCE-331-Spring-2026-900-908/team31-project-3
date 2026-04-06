import { useState, useEffect } from "react";
import "./MenuBoard.css";
import API_BASE_URL from "../config/apiBaseUrl";

const MenuBoard = () => {
  const [products, setProducts] = useState([]);
  const [productModifiers, setProductModifiers] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = () => {
    fetch(`${API_BASE_URL}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch(`${API_BASE_URL}/productmodifier`)
      .then((r) => r.json())
      .then((data) => setProductModifiers(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 60 seconds to keep the menu board live
    const dataInterval = setInterval(fetchData, 60000);
    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // Dynamically extract categories from products
  const categories = [...new Set(products.map((p) => p.category_name))].filter(Boolean).sort();

  let toppingItems = productModifiers.filter((modifier) => modifier.category === "Topping");

  return (
    <div className="menu-board-fullscreen">
      <div className="menu-header">
        <h1 className="menu-title">Menu</h1>
        <div className="menu-clock">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <div className="menu-masonry">
        {categories.map((category) => {
          const categoryProducts = products.filter((product) => product.category_name === category);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category} className="menu-column">
              <h2>{category}</h2>
              <table>
                <tbody>
                  {categoryProducts.map((product) => (
                    <tr key={product.id || product.name}>
                      <td className="label">{product.name}</td>
                      <td className="price">${product.base_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {toppingItems.length > 0 && (
          <div className="menu-column toppings-column">
            <h2>Toppings</h2>
            <table>
              <tbody>
                {toppingItems.map((topping, idx) => (
                  <tr key={topping.id || topping.name || idx}>
                    <td className="label">{topping.name}</td>
                    <td className="price">${topping.price_adjustment.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBoard;

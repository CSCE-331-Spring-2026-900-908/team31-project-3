import { useState, useEffect } from "react";
import "./MenuBoard.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const categories = ["Milk Foam Series", "Milk Tea Series", "Creative Mix Series", "Brewed Tea Series", "Coffee Series", "Slush Series"];
const menu = [
  { name: "Green Milk Tea", category_name: "Milk Tea Series", base_price: 4.99 },
  { name: "Green Milk Foam", category_name: "Milk Foam Series", base_price: 5.99 },
  { name: "Mocha Coffee", category_name: "Coffee Series", base_price: 6.99 },
];
const toppings = [
  { name: "Pearl (Boba))", price_adjustment: 0.50},
  { name: "Milk Foam", price_adjustment: 0.75},
  { name: "Pudding", price_adjustment: 0.50}
];

const MenuBoard = () => {
  const [products, setProducts] = useState([]);
  const [productModifiers, setProductModifiers] = useState([]);

  useEffect(() => {
    fetch(`${API}/product`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch(`${API}/productmodifier`)
      .then((r) => r.json())
      .then((data) => setProductModifiers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  let productContent = 
  <div className="horizontalDiv">
    {categories.map(category => (
      <div>
        <h1>{category}</h1>
        <table>
          {products.filter(product => product.category_name === category).map(product => (
              <tr>
                <td className="label">{product.name}</td>
                <td className="price">{product.base_price.toFixed(2)}</td>
              </tr>
          ))}
        </table>
      </div>
    ))}
  </div>;
  let toppings = productModifiers.filter(modifier => modifier.category === "Topping");
  let modifierContent =
  <div>
    <h1>Toppings</h1>
    <div className="horizontalDiv">
      <table>
        {toppings.slice(0, Math.ceil(toppings.length / 3)).map(topping => (
          <tr>
            <td className="label">{topping.name}</td>
            <td className="price">{topping.price_adjustment.toFixed(2)}</td>
          </tr>
        ))}
      </table>
      <hr></hr>
      <table>
        {toppings.slice(Math.ceil(toppings.length / 3), Math.ceil(2 * toppings.length / 3)).map(topping => (
          <tr>
            <td className="label">{topping.name}</td>
            <td className="price">{topping.price_adjustment.toFixed(2)}</td>
          </tr>
        ))}
      </table>
      <hr></hr>
      <table>
        {toppings.slice(Math.ceil(2 * toppings.length / 3), toppings.length).map(topping => (
          <tr>
            <td className="label">{topping.name}</td>
            <td className="price">{topping.price_adjustment.toFixed(2)}</td>
          </tr>
        ))}
      </table>
    </div>
  </div>;
  return <div>{productContent}{modifierContent}</div>;
};

export default MenuBoard;

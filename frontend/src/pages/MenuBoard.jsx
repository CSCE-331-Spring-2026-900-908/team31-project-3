import { useState, useEffect } from "react";
import "./MenuBoard.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const categories = ["Milk Tea Series", "Milk Foam Series", "Coffee Series"];
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
  // useEffect(() => {
  //   const fetchProduct = async () => {
  //     try {
  //       const res = await fetch("http://localhost:3001/product");
  //       if(!res.ok) {
  //         throw new Error("Failed to load products: " + res.statusText);
  //       }
  //       const data = await res.json();
  //       setProduct(data);
  //       res = await fetch("http://localhost:3001/productmodifier");
  //       if(!res.ok) {
  //         throw new Error("Failed to load product modifiers: " + res.statusText);
  //       }
  //       data = await res.json();
  //       setProductModifier(data);
  //     } catch(err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProduct();
  // }, []);
  // if(loading) {
  //   return <p>Loading menu...</p>;
  // }
  // if(error) {
  //   return <p>Error: {error}</p>;
  // }

  let productContent = 
  <div className="horizontalDiv">
    {categories.map(category => (
      <div>
        <h1>{category}</h1>
        <table>
          {menu.filter(product => product.category_name === category).map(product => (
              <tr>
                <td>{product.name}</td>
                <td>{product.base_price.toFixed(2)}</td>
              </tr>
          ))}
        </table>
      </div>
    ))}
  </div>;
  let modifierContent =
  <div>
    <h1>Toppings</h1>
    <table>
      {toppings.map(modifier => (
        <tr>
          <td>{modifier.name}</td>
          <td>{modifier.price_adjustment.toFixed(2)}</td>
        </tr>
      ))}
    </table>
  </div>;
  return <div>{productContent}{modifierContent}</div>;
};

export default MenuBoard;

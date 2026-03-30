import React, { useEffect, useState } from "react";
import "./MenuBoard.css";

const categories = ["Milk Tea Series", "Milk Foam Series", "Coffee Series"];
const menu = [
  { name: "Green Milk Tea", category: "Milk Tea", price: 4.99 },
  { name: "Green Milk Foam", category: "Milk Foam", price: 5.99 },
  { name: "Mocha Coffee", category: "Coffee", price: 6.99 },
];

const MenuBoard = () => {
  const [product, setProduct] = useState([]);
  const [productModifier, setProductModifier] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch("http://localhost:3001/product");
        if(!res.ok) {
          throw new Error("Failed to load products: " + res.statusText);
        }
        const data = await res.json();
        setProduct(data);
        res = await fetch("http://localhost:3001/productmodifier");
        if(!res.ok) {
          throw new Error("Failed to load product modifiers: " + res.statusText);
        }
        data = await res.json();
        setProductModifier(data);
      } catch(err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, []);
  if(loading) {
    return <p>Loading menu...</p>;
  }
  if(error) {
    return <p>Error: {error}</p>;
  }

  let content = categories.map(category => (
    <div>
      <h1>{category}</h1>
      <table>
        {product.filter(item => item.category_name === category).map(item => (
            <tr>
              <td>{item.name}</td>
              <td>{item.base_price}</td>
            </tr>
        ))}
      </table>
    </div>
  ));
  return <div className="horizontalDiv">{content}</div>;
};

export default MenuBoard;

import React from "react";
import "./MenuBoard.css";

const categories = ["Milk Tea", "Milk Foam", "Coffee"];
const menu = [
  { name: "Green Milk Tea", category: "Milk Tea", price: 4.99 },
  { name: "Green Milk Foam", category: "Milk Foam", price: 5.99 },
  { name: "Mocha Coffee", category: "Coffee", price: 6.99 },
];

const MenuBoard = () => {
  let content = categories.map(category => (
    <div>
      <h1>{category}</h1>
      <table>
        {menu.filter(product => product.category === category).map(product => (
            <tr>
              <td>{product.name}</td>
              <td>{product.price}</td>
            </tr>
        ))}
      </table>
    </div>
  ));
  return <div className="horizontalDiv">{content}</div>;
};

export default MenuBoard;

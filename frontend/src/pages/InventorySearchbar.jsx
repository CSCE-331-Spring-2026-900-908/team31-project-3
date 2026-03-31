import {MouseEvent, useState} from "react";

function Message (props) {
    const {items, heading, onSelect} = props;

    const message = items.length === 0 && <p>no item found</p>

    //Event handler
    const handleClick = (event) => console.log(event);

    const [selectIndex, upSelectIndex] = useState(-1);

    return (
    <> 
        <h1 className="list-group">{heading}</h1>
        <ul>
            {items.length === 0 ? <p>no item found</p> : null}
            {message}
            {items.map((item, index)=> 
            <li 
                className= "list-group-item"
                key = {item}
                onClick={() => {
                    upSelectIndex(index);
                    onSelect(item);
                }
                }
            >
                {item}
            </li>)}
        </ul>
    </>
    );
}

export function GridTable() {
    const data = [
    {
      item_id: 19,
      item_name: "Hibiscus Syrup",
      quantity: 20,
      unit_type: "liters",
      expiration_date: "2026-09-02",
      target_val: 20
    },
    {
      item_id: 20,
      item_name: "Peach Syrup",
      quantity: 20,
      unit_type: "liters",
      expiration_date: "2026-09-02",
      target_val: 20
    },
    {
      item_id: 21,
      item_name: "Ginger Syrup",
      quantity: 10,
      unit_type: "liters",
      expiration_date: "2026-09-02",
      target_val: 15
    },
    {
      item_id: 23,
      item_name: "White Pearls",
      quantity: 50,
      unit_type: "kg",
      expiration_date: "2026-03-07",
      target_val: 55
    },
    {
      item_id: 34,
      item_name: "Matcha Powder",
      quantity: 29.94,
      unit_type: "kg",
      expiration_date: "2027-03-02",
      target_val: 100
    }
  ];

  return (
    <div className="inventory-grid">

      {/* headers */}
      <div className="header">ID</div>
      <div className="header">Item Name</div>
      <div className="header">Quantity</div>
      <div className="header">Unit</div>
      <div className="header">Expiration</div>
      <div className="header">Target</div>
      
      {/* data */}
      {data.map((item) => (
        <>
          <div key={item.item_id + "id"}>{item.item_id}</div>
          <div>{item.item_name}</div>
          <div>{item.quantity}</div>
          <div>{item.unit_type}</div>
          <div>{item.expiration_date}</div>
          <div>{item.target_val}</div>
        </>
      ))}

    </div>
  );
}

export default Message;

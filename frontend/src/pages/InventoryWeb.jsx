import React from "react";
import "./InventoryWeb.css";
import Message, {GridTable} from "./InventorySearchbar";


const InventoryWeb = () => {
  const allitems = ["New York", "San Francisco", "Paris", "London"];

  const handleSelectItem = (item) => {
    console.log(item);
  };

  return (
    <div>
        <h1>INVENTORY</h1>
      {/* <Message
        items={allitems}
        heading="helloHeading"
        onSelect={handleSelectItem}
      /> */}
     <GridTable/>
    </div>
    
  );
};

export default InventoryWeb;
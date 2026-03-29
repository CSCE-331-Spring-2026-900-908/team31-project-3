import React from "react";
import "./App.css";
import Message from "./InventorySearchbar";


const App = () => {
  const allitems = ['New York', 'San Francisco', 'Paris', 'London']

  const handleSelectItem = (item) => {
    console.log(item);
  }
  return (
    <div>
      <Message
        items={allitems}
        heading="helloHeading" 
        onSelect={handleSelectItem}
      />
    </div>
    )
};

export default App;

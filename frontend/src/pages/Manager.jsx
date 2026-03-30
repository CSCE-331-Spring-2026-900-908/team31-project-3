import { useState } from "react";
import Cashier from "./Cashier";
import "./Manager.css";
import InventoryWeb from "./InventoryWeb";


const TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const Manager = () => {
  const [tab, setTab] = useState("Orders");

  return (
    <div className="manager-layout">
      <nav className="manager-navbar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`manager-nav-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <button className="manager-signout-btn">Sign Out</button>
      </nav>

      {tab === "Orders" ? (
        <Cashier />
      ) : (
        <div className="manager-content">
          {tab === "Menu"      && <Section title="Menu Items" />}
          {tab === "Employees"     && <Section title="Employees" />}
          {tab === "Inventory" && <InventoryWeb/>}
          {tab === "Reports"   && <Section title="Reports" />}
        </div>
      )}
    </div>
  );
};

const Section = ({ title }) => (
  <div className="manager-section">
    <h2>{title}</h2>
  </div>
);

export default Manager;

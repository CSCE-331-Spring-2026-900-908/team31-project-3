import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cashier from "./Cashier";
import "./Manager.css";


const TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const Manager = () => {
  const [tab, setTab] = useState("Orders");
  const navigate = useNavigate();

  return (
    <div className="manager-layout">
      <nav className="manager-navbar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`manager-nav-btn${tab === t ? " active" : ""}`}
            onClick={() => {
              if (t === "Reports") {
                navigate("/reports");
                return;
              }
              setTab(t);
            }}
          >
            {t}
          </button>
        ))}
        <button className="manager-signout-btn" onClick={() => navigate("/")}>
          Sign Out
        </button>
      </nav>

      {tab === "Orders" ? (
        <Cashier />
      ) : (
        <div className="manager-content">
          {tab === "Menu"      && <Section title="Menu Items" />}
          {tab === "Employees"     && <Section title="Employees" />}
          {tab === "Inventory" && <Section title="Inventory" />}
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

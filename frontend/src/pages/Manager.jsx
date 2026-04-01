import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cashier from "./Cashier";
import "./Manager.css";

const TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];
const DEFAULT_TAB = "Orders";

const getInitialTab = (search) => {
  const requestedTab = new URLSearchParams(search).get("tab");
  return TABS.includes(requestedTab) &&
    requestedTab !== "Reports" &&
    requestedTab !== "Employees"
    ? requestedTab
    : DEFAULT_TAB;
};

const Manager = () => {
  const location = useLocation();
  const [tab, setTab] = useState(() => getInitialTab(location.search));
  const navigate = useNavigate();

  useEffect(() => {
    setTab(getInitialTab(location.search));
  }, [location.search]);

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
              if (t === "Employees") {
                navigate("/employees");
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
          {tab === "Inventory" && <Section title="Inventory" />}
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

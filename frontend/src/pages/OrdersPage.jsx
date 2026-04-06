import { useNavigate } from "react-router-dom";
import Cashier from "./Cashier";
import "./Manager.css";

const MANAGER_TABS = ["Orders", "Menu", "Employees", "Inventory", "Reports"];

const OrdersPage = () => {
  const navigate = useNavigate();

  const handleTabClick = (t) => {
    if (t === "Orders") return;
    const params = new URLSearchParams({ tab: t });
    navigate(`/manager?${params.toString()}`);
  };

  return (
    <div className="manager-layout page">
      <nav className="manager-navbar">
        {MANAGER_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`manager-nav-btn${t === "Orders" ? " active" : ""}`}
            onClick={() => handleTabClick(t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          className="manager-signout-btn"
          onClick={() => navigate("/")}
        >
          Sign Out
        </button>
      </nav>

      <Cashier />
    </div>
  );
};

export default OrdersPage;

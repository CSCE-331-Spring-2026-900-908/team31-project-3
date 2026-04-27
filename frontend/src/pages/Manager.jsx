import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Manager.css";

const TAB_ROUTES = {
  Orders: "/orders",
  Menu: "/menu",
  Employees: "/employees",
  Inventory: "/inventory",
  Reports: "/reports",
};

const Manager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (requestedTab && TAB_ROUTES[requestedTab]) {
      navigate(TAB_ROUTES[requestedTab], { replace: true });
    } else if (!requestedTab) {
      navigate("/reports", { replace: true });
    }
  }, [location.search, navigate]);

  return null;
};

export default Manager;

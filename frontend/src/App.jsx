import { Navigate, Route, Routes } from "react-router-dom";
import Portal from "./pages/Portal";
import MenuBoard from "./pages/MenuBoard";
import Customer from "./pages/Customer";
import Manager from "./pages/Manager";
import ManagerGate from "./pages/ManagerGate";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import EmployeesPage from "./pages/EmployeesPage";
import MenuEditPage from "./pages/MenuEditPage";
import OrdersPage from "./pages/OrdersPage";
import InventoryPage from "./pages/InventoryPage";
import Kiosk from "./pages/Kiosk";
import "./App.css";

const App = () => (
  <Routes>
    <Route path="/" element={<Portal />} />
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/reports"
      element={
        <ManagerGate>
          <ReportsPage />
        </ManagerGate>
      }
    />
    <Route
      path="/employees"
      element={
        <ManagerGate>
          <EmployeesPage />
        </ManagerGate>
      }
    />
    <Route
      path="/menu"
      element={
        <ManagerGate>
          <MenuEditPage />
        </ManagerGate>
      }
    />
    <Route
      path="/orders"
      element={
        <ManagerGate>
          <OrdersPage />
        </ManagerGate>
      }
    />
    <Route path="/cashier" element={<OrdersPage cashierMode />} />
    <Route
      path="/inventory"
      element={
        <ManagerGate>
          <InventoryPage />
        </ManagerGate>
      }
    />
    <Route path="/menu-board" element={<MenuBoard />} />
    <Route path="/customer" element={<Kiosk />} />
    <Route
      path="/manager"
      element={
        <ManagerGate>
          <Manager />
        </ManagerGate>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

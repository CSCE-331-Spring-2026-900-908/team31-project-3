import { Navigate, Route, Routes } from "react-router-dom";
import Portal from "./pages/Portal";
import MenuBoard from "./pages/MenuBoard";
import Customer from "./pages/Customer";
import Manager from "./pages/Manager";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import EmployeesPage from "./pages/EmployeesPage";
import MenuEditPage from "./pages/MenuEditPage";
import OrdersPage from "./pages/OrdersPage";
import InventoryPage from "./pages/InventoryPage";
import "./App.css";

const App = () => (
  <Routes>
    <Route path="/" element={<Portal />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/employees" element={<EmployeesPage />} />
    <Route path="/menu" element={<MenuEditPage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/cashier" element={<OrdersPage cashierMode />} />
    <Route path="/inventory" element={<InventoryPage />} />
    <Route path="/menu-board" element={<MenuBoard />} />
    <Route path="/customer" element={<Customer />} />
    <Route path="/manager" element={<Manager />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

import { Navigate, Route, Routes } from "react-router-dom";
import Portal from "./pages/Portal";
import MenuBoard from "./pages/MenuBoard";
import Customer from "./pages/Customer";
import Cashier from "./pages/Cashier";
import Manager from "./pages/Manager";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import "./App.css";

const App = () => (
  <Routes>
    <Route path="/" element={<Portal />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/menu-board" element={<MenuBoard />} />
    <Route path="/customer" element={<Customer />} />
    <Route path="/cashier" element={<Cashier showNav />} />
    <Route path="/manager" element={<Manager />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;

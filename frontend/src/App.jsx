import { Routes, Route } from "react-router-dom";
import Portal from "./pages/Portal";
import MenuBoard from "./pages/MenuBoard";
import Customer from "./pages/Customer";
import Cashier from "./pages/Cashier";
import Manager from "./pages/Manager";

const App = () => (
  <Routes>
    <Route path="/" element={<Portal />} />
    <Route path="/menu-board" element={<MenuBoard />} />
    <Route path="/customer" element={<Customer />} />
    <Route path="/cashier" element={<Cashier />} />
    <Route path="/manager" element={<Manager />} />
  </Routes>
);

export default App;

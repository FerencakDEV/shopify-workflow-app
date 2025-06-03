import React from "react";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import WidgetPage from './pages/WidgetPage';
// sem môžeš doplniť aj ďalšie page komponenty

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/orders" element={<OrdersPage />} /> */}
        {/* <Route path="/staff" element={<StaffPage />} /> */}
        <Route path="/status/:key" element={<WidgetPage />} />
      </Routes>
    </div>
  );
}

export default App;

import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import WidgetPage from './pages/WidgetPage';
import OrdersFullscreen from './pages/OrdersFullscreen';
import WorkloadFullscreen from './pages/WorkloadFullscreen';

function App() {
  const location = useLocation();
  const isFullscreen = location.pathname === '/orders/fullscreen' || location.pathname === '/workload/fullscreen';

  return (
    <div className="bg-gray-100 min-h-screen">
      {!isFullscreen && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/status/:slug" element={<WidgetPage />} />
        <Route path="/orders/fullscreen" element={<OrdersFullscreen />} />
        <Route path="/workload/fullscreen" element={<WorkloadFullscreen />} />
      </Routes>
    </div>
  );
}

export default App;

import React from "react";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import WidgetPage from './pages/WidgetPage';
import OrdersFullscreen from './pages/OrdersFullscreen';
import WorkloadFullscreen from './pages/WorkloadFullscreen';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
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

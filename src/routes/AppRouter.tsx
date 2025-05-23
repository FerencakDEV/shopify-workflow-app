import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/Home";
import OrdersByStatus from "../pages/OrderByStatus";
import StaffWorkload from "../pages/StaffWorkload";

const AppRouter = () => {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<OrdersByStatus />} />
          <Route path="/workload" element={<StaffWorkload />} />
          <Route path="/orders/status/:status" element={<OrdersByStatus />} />

        </Routes>
      </DashboardLayout>
    </Router>
  );
};

export default AppRouter;

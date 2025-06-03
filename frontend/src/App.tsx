import React from "react";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import WidgetPage from './pages/WidgetPage';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders/:key" element={<WidgetPage />} />
      </Routes>
    </div>
  );
}

export default App;

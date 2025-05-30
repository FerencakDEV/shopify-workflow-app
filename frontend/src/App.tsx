import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import OrdersByStatus from './pages/OrdersByStatus';
import StaffWorkload from './pages/StaffWorkload';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders" element={<OrdersByStatus />} />
        <Route path="/staff" element={<StaffWorkload />} />
      </Routes>
    </Router>
  );
}

export default App;

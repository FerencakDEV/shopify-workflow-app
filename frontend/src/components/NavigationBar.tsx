import { Link } from 'react-router-dom';
import { MdHome, MdList, MdPerson } from 'react-icons/md';

const NavBar = () => {
  return (
    <nav className="flex gap-4 px-6 py-2 bg-gray-50 text-sm font-medium border-b">
      <Link to="/" className="flex items-center gap-2 hover:text-blue-600 transition">
        <MdHome /> Home
      </Link>
      <Link to="/orders/fullscreen" className="flex items-center gap-2 hover:text-blue-600 transition">
        <MdList /> Orders by Status ▾
      </Link>
      <Link to="/workload/fullscreen" className="flex items-center gap-2 hover:text-blue-600 transition">
        <MdPerson /> Staff Workload ▾
      </Link>
    </nav>
  );
};

export default NavBar;

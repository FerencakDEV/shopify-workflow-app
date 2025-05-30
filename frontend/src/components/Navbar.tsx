import { Link } from 'react-router-dom';
import * as MdIcons from 'react-icons/md';
import '../styles/navbar.css';

const NavBar = () => {
  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-item">
        <MdIcons.MdHome className="icon" /> Home
      </Link>
      <div className="nav-item dropdown">
        <MdIcons.MdList className="icon" /> Orders by Status <span className="arrow">▾</span>
        {/* dropdown obsah ak chceš */}
      </div>
      <div className="nav-item dropdown">
       <MdIcons.MdPerson className="icon" /> Staff Workload <span className="arrow">▾</span>
        {/* dropdown obsah ak chceš */}
      </div>
    </nav>
  );
};

export default NavBar;

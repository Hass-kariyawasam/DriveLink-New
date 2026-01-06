import React from 'react';
import { Link } from 'react-router-dom';
import '../css/style.css'; // Global Styles

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">Drivelink-Pro</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login" className="btn-login">Login</Link>
      </div>
    </nav>
  );
};

export default Navbar;
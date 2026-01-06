import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../css/sidebar.css'; // Sidebar CSS import

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Active Menu එක පාට කරන්න
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav id="sidebar" className={isExpanded ? 'expanded' : ''}>
      <div className="sidebar-header">
        <div className="logo-container">
          <i className="fas fa-tachometer-alt logo-img" style={{fontSize:'24px', color:'#fff'}}></i>
          <span className="logo-text">DriveLink</span>
        </div>
        <button id="toggle-btn" onClick={toggleSidebar}>
          {isExpanded ? '<' : '>'}
        </button>
      </div>

      <ul className="sidebar-menu">
        <li className={isActive('/dashboard')}>
          <Link to="/dashboard">
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        <li className={isActive('/map')}>
          <Link to="/map">
            <i className="fas fa-map-marker-alt"></i>
            <span>Live Tracking</span>
          </Link>
        </li>
        <li className={isActive('/reports')}>
          <Link to="/reports">
            <i className="fas fa-file-alt"></i>
            <span>Reports</span>
          </Link>
        </li>
        <li className={isActive('/profile')}>
          <Link to="/profile">
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
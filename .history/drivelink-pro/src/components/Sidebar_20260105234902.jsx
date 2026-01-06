import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import '../css/sidebar.css'; // Make sure you move sidebar.css to src/css/

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav id="sidebar" className={isExpanded ? 'expanded' : ''}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="https://www.svgrepo.com/show/530571/conversation.svg" alt="Logo" className="logo-img" />
          <span className="logo-text">DriveLink</span>
        </div>
        <button id="toggle-btn" onClick={toggleSidebar}>
          <i className={`fas fa-chevron-${isExpanded ? 'left' : 'right'}`}></i>
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
            <span>Trip Reports</span>
          </Link>
        </li>
        <li className={isActive('/health')}>
          <Link to="/health">
            <i className="fas fa-heartbeat"></i>
            <span>Vehicle Health</span>
          </Link>
        </li>
        <li className={isActive('/reminders')}>
          <Link to="/reminders">
            <i className="fas fa-bell"></i>
            <span>Reminders</span>
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
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../css/sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [username, setUsername] = useState("--");
  
  // ✅ FIX 1: Initialize State from LocalStorage directly (No Effect needed for this)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if null
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ FIX 2: Sync Body Class with State changes
  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || "User");
        }
      }
    };
    fetchUserName();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const toggleSidebar = () => setIsExpanded(!isExpanded);
  
  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode); // Just toggle state, useEffect handles the rest
  };
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav id="sidebar" className={isExpanded ? 'expanded' : ''}>
      
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="DriveLink" className="logo-img" />
          <span className="logo-text">
             <span className="highlight" style={{color:'#fff'}}>Drive</span>
             <span className="highlight2" style={{color:'#C4FB6D'}}>Link</span>
          </span>
        </div>
        <button id="toggle-btn" onClick={toggleSidebar}>
          <i className={`fas fa-chevron-${isExpanded ? 'left' : 'right'}`}></i>
        </button>
      </div>

      <ul className="sidebar-menu">
        
        {/* Username */}
        <li>
            <p className="username-text" style={{
                marginLeft: isExpanded ? '20px' : '0', 
                display: isExpanded ? 'block' : 'none',
                color: '#b0b3c1', fontSize: '14px', marginBottom:'10px'
            }}>
                Hi, {username}!
            </p>
            <div className="divider"></div>
        </li>

        {/* Dashboard */}
        <li className={isActive('/dashboard')}>
          <Link to="/dashboard">
            <i className="fa-solid fa-solar-panel"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        
        {/* Fuel Status */}
        <li className={isActive('/fuel')}>
          <Link to="/fuel">
            <i className="fa-solid fa-gas-pump"></i>
            <span>Fuel Status</span>
          </Link>
        </li>
        
        {/* Battery Status */}
        <li className={isActive('/battery')}>
          <Link to="/battery">
            <i className="fa-solid fa-car-battery"></i>
            <span>Battery Status</span>
          </Link>
        </li>

        {/* Live Tracking */}
        <li className={isActive('/map')}>
          <Link to="/map">
            <i className="fa-solid fa-map-location-dot"></i>
            <span>Live Tracking</span>
          </Link>
        </li>

        {/* Trip Manage */}
        <li className={isActive('/trips')}>
          <Link to="/trips">
            <i className="fa-solid fa-compass"></i>
            <span>Trip Manage</span>
          </Link>
        </li>

        {/* Vehicle Health */}
        <li className={isActive('/health')}>
          <Link to="/health">
            <i className="fa-solid fa-heart-pulse"></i>
            <span>Vehicle Health</span>
          </Link>
        </li>

        {/* Trip Report (Direct Link) */}
        <li className={isActive('/tripreport')}>
          <Link to="/tripreport"> 
            <i className="fa-solid fa-flask-vial"></i>
            <span>Trip Report</span>
          </Link>
        </li>

        {/* Reminders */}
        <li className={isActive('/reminders')}>
          <Link to="/reminders">
            <i className="fa-solid fa-bell"></i>
            <span>Reminders</span>
          </Link>
        </li>

       \\

        {/* Profile */}
        <li className={isActive('/profile')}>
          <Link to="/profile">
            <i className="fa-solid fa-user-large"></i>
            <span>Profile</span>
          </Link>
        </li>
      </ul>

      <div className="divider"></div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme Toggle Button */}
        <button id="theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
            <span style={{display: isExpanded ? 'inline' : 'none'}}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
        </button>
        <button id="logout-button" className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span style={{display: isExpanded ? 'inline' : 'none'}}>Logout</span>
        </button>
      </div>

    </nav>
  );
};

export default Sidebar;
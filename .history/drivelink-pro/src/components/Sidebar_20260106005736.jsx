import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../css/sidebar.css'; 

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [username, setUsername] = useState("--");
  
  const location = useLocation();
  const navigate = useNavigate();

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
  const toggleReports = () => setIsReportsOpen(!isReportsOpen);
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav id="sidebar" className={isExpanded ? 'expanded' : ''}>
      
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="DriveLink" className="logo-img" />
          <span className="logo-text">
             <span className="highlight" style={{color:'#fff'}}>Drive</span>
             <span className="highlight2" style={{color:'#C4FB6D'}}>link</span>
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

        {/* Reports Dropdown */}
        <li className={`has-submenu ${isReportsOpen ? 'active' : ''}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); toggleReports(); }}>
            <i className="fa-solid fa-flask-vial"></i>
            <span>Reports</span>
            <i className={`fas fa-chevron-${isReportsOpen ? 'up' : 'down'} arrow`} style={{marginLeft:'auto', fontSize:'12px'}}></i>
          </a>
          <ul className="sub-menu" style={{ 
              display: isReportsOpen ? 'block' : 'none',
              paddingLeft: '50px' // Submenu indent
          }}>
            <li><Link to="/reports/trip"> Trip Report</Link></li>
            <li><Link to="/reports/fuel"> Fuel Report</Link></li>
            <li><Link to="/reports/battery"> Battery Report</Link></li>
          </ul>
        </li>

        {/* Reminders */}
        <li className={isActive('/reminders')}>
          <Link to="/reminders">
            <i className="fa-solid fa-bell"></i>
            <span>Reminders</span>
          </Link>
        </li>

        {/* History */}
        <li className={isActive('/history')}>
          <Link to="/history">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>History</span>
          </Link>
        </li>

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
        <button id="theme-toggle">
            <i className="fas fa-moon"></i>
            <span style={{display: isExpanded ? 'inline' : 'none'}}>Dark Mode</span>
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
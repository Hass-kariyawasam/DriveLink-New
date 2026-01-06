import React from 'react';
import { Link } from 'react-router-dom';
import '../webstyle.css'; // CSS Import එක

const Home = () => {
  return (
    // 👇 මුළු Page එකම මේ class එක ඇතුලට දැම්මා
    <div className="public-layout">
      
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">DriveLink</Link>
          <ul className="navbar-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="#">About</Link></li>
            <li><Link to="#">Contact</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <h1>Welcome to DriveLink Pro</h1>
        
        <p className="project-desc">
          The Ultimate IoT Solution for Vehicle Monitoring. <br />
          Track your <strong>Fuel Level</strong>, <strong>Battery Health</strong>, and 
          <strong> Live Location</strong> in real-time.
        </p>

        <div className="btn-container">
            <Link to="/login" className="btn primary-btn" style={{background:'white', color:'#333'}}>Login</Link>
            <Link to="/register" className="btn secondary-btn" style={{background:'#333', color:'white', border:'2px solid #333'}}>Get Started</Link>
        </div>
      </div>

      {/* Features Section */}
      <section className="features" style={{display:'flex', justifyContent:'center', gap:'20px', padding:'50px', flexWrap:'wrap'}}>
          <div className="feature-card" style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
              <h3>⛽ Fuel Monitor</h3>
              <p>Check real-time fuel levels accurately.</p>
          </div>
          <div className="feature-card" style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
              <h3>🔋 Battery Health</h3>
              <p>Monitor battery percentage instantly.</p>
          </div>
          <div className="feature-card" style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
              <h3>📍 GPS Tracking</h3>
              <p>Track your vehicle location anywhere.</p>
          </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2025 Team TeraNode. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
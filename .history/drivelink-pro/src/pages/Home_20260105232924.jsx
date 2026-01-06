import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/webstyle.css'; 

const Home = () => {
  useEffect(() => {
    document.body.className = 'home-body';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
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

      {/* Hero Section (මැද කොටස) */}
      <main className="main-content">
        <section className="hero">
          <h1>Welcome to DriveLink Pro</h1>
          
          {/* Project Description */}
          <p className="project-desc">
            The Ultimate IoT Solution for Vehicle Monitoring. <br />
            Track your <strong>Fuel Level</strong>, <strong>Battery Health</strong>, and 
            <strong> Live Location</strong> in real-time.
          </p>

          {/* Get Started Button (හරියටම මැද) */}
          <div className="btn-container">
             <Link to="/login" className="btn primary-btn">Login</Link>
             <Link to="/register" className="btn secondary-btn">Get Started</Link>
          </div>
        </section>

        {/* Features Section (පහළින් පෙන්නන කොටස්) */}
        <section className="features">
            <div className="feature-card">
                <h3>⛽ Fuel Monitor</h3>
                <p>Check real-time fuel levels accurately.</p>
            </div>
            <div className="feature-card">
                <h3>🔋 Battery Health</h3>
                <p>Monitor battery percentage instantly.</p>
            </div>
            <div className="feature-card">
                <h3>📍 GPS Tracking</h3>
                <p>Track your vehicle location anywhere.</p>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2025 Team TeraNode. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './webstyle.css'; // ඔබේ පරණ CSS ෆයිල් එක මෙතනට import කරන්න

const Home = () => {
  // Mobile Menu එක open/close කරන්න State එකක්
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Blur Overlay & Toast (CSS වල styles තිබුණොත් පෙනේවි) */}
      <div id="blurOverlay" className="blur-overlay"></div>
      <div id="toast" className="toast">
        <span id="toastMessage"></span>
      </div>

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">Drivelink</Link>
          
          <ul className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <li><Link to="/">Home</Link></li>
            <li><a href="#about">About</a></li> {/* තවම පිටු නැති නිසා anchor tags තිබ්බා */}
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="navbar-toggle" id="mobile-menu" onClick={toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </div>
      </nav>

      {/* Body Section */}
      <main className="main-content">
        <section className="hero">
          <h1>Welcome to Drivelink</h1>
          <p>Smart Solutions</p>
          {/* "Get Started" එබුවාම Login පිටුවට යන්න හදමු */}
          <Link to="/login" className="btn">Get Started</Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2025 TeraNode. All rights reserved.</p>
          <ul className="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
};

export default Home;
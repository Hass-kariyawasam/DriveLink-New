import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../webstyle.css'; // Home CSS එක විතරක් load කරන්න

const Home = () => {
  // මේකෙන් කරන්නේ Home page එකට ආවම body එකේ කලින් තිබ්බ styles අයින් කරලා home එකට අදාල සුදු පාට දාන එක
  useEffect(() => {
    document.body.className = 'home-body'; // අපි CSS වල මේකට පොඩි වෙනසක් කරමු
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
            <li><Link to="#">Services</Link></li>
            <li><Link to="#">Contact</Link></li>
          </ul>
          <div className="navbar-toggle" id="mobile-menu">
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
          <div className="btn-container" style={{marginTop: '20px'}}>
             <Link to="/login" className="btn">Login</Link>
             <Link to="/register" className="btn" style={{marginLeft:'10px', background:'#333'}}>Register</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2025 TeraNode. All rights reserved.</p>
          <ul className="footer-links">
            <li><Link to="#">Privacy Policy</Link></li>
            <li><Link to="#">Terms of Service</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
};

export default Home;
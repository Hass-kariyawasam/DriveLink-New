import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Fuel, MapPin, Activity, ArrowRight } from 'lucide-react'; // අයිකන්ස්
import './Home.css'; // ඔබේ webstyle.css එක මෙතනට සම්බන්ධ කරමු

const Home = () => {
  return (
    <div className="home-container">
      {/* 1. Navigation Bar */}
      <nav className="navbar">
        <div className="logo">
          <h2>DriveLink</h2>
        </div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About Us</a></li>
        </ul>
        <div className="auth-buttons">
          {/* Login සහ Register පිටු වලට යන්න Link පාවිච්චි කරනවා */}
          <Link to="/login" className="btn btn-login">Login</Link>
          <Link to="/register" className="btn btn-register">Register</Link>
        </div>
      </nav>

      {/* 2. Hero Section (ප්‍රධාන කොටස) */}
      <header className="hero-section" id="home">
        <div className="hero-content">
          <h1>Smart IoT Vehicle Management System</h1>
          <p>
            Monitor fuel, battery health, and track your vehicle in real-time. 
            Upgrade your old vehicle with modern smart technology.
          </p>
          <div className="hero-btns">
            <Link to="/register" className="btn btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
           {/* මෙතනට ඔබේ වාහනයක හෝ Device එකේ පින්තූරයක් දාන්න */}
           <img src="/assets/hero-car.png" alt="Smart Vehicle" />
        </div>
      </header>

      {/* 3. Features Section (විශේෂාංග) */}
      <section className="features-section" id="features">
        <h2 className="section-title">Why Choose DriveLink?</h2>
        <div className="features-grid">
          
          <div className="feature-card">
            <div className="icon-bg"><Fuel size={30} /></div>
            <h3>Fuel Monitoring</h3>
            <p>Track real-time fuel levels and calculate costs effectively to save money.</p>
          </div>

          <div className="feature-card">
            <div className="icon-bg"><ShieldCheck size={30} /></div>
            <h3>Battery Health</h3>
            <p>Get alerts for low voltage and protect your battery from unexpected failures.</p>
          </div>

          <div className="feature-card">
            <div className="icon-bg"><MapPin size={30} /></div>
            <h3>GPS Tracking</h3>
            <p>Live location tracking to ensure your vehicle is safe and within boundaries.</p>
          </div>

          <div className="feature-card">
            <div className="icon-bg"><Activity size={30} /></div>
            <h3>Engine Diagnostics</h3>
            <p>Monitor RPM and engine temperature to prevent breakdowns before they happen.</p>
          </div>

        </div>
      </section>

      {/* 4. Footer Section */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 DriveLink - Smart IoT Solutions. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
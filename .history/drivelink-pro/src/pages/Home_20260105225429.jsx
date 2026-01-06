import React from 'react';
import { Link } from 'react-router-dom';
import '../css/home.css'; // අපි අර හදපු style sheet එක link කරමු

const Home = () => {
  return (
    <div className="home-container">
      
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to DriveLink</h1>
          <p>
            The smartest way to manage your driving experience. 
            Connect, Share, and Drive with confidence.
          </p>
          
          <div className="btn-group">
            <Link to="/register" className="primary-btn">Get Started</Link>
            <Link to="/login" className="secondary-btn">Log In</Link>
          </div>
        </div>
      </section>

      {/* 2. Features Section (පහළින් තියෙන කොටස්) */}
      <section className="features-section">
        <div className="feature-card">
          <h3>🚀 Fast Service</h3>
          <p>Experience lightning-fast connections and real-time updates.</p>
        </div>
        <div className="feature-card">
          <h3>🔒 Secure</h3>
          <p>Your data is protected with top-tier security standards.</p>
        </div>
        <div className="feature-card">
          <h3>🌍 Global Access</h3>
          <p>Access your dashboard from anywhere in the world.</p>
        </div>
      </section>

    </div>
  );
};

export default Home;
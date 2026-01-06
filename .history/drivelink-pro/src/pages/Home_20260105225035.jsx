import React from 'react';
import { Link } from 'react-router-dom';
import '../css/home.css'; // Home CSS එක විතරයි

const Home = () => {
  return (
    <div className="home-hero">
      <h1>Welcome to Drivelink-Pro</h1>
      <p>Secure, Fast, and Reliable connection for everyone.</p>
      <Link to="/register" className="cta-btn">Get Started</Link>
    </div>
  );
};

export default Home;
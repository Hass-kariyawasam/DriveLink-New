// src/components/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import '../css/sidebar.css';
import '../css/dashboardstyle.css';

const Layout = ({ children }) => {
  return (
    <div className="dashboard-app">
      <Sidebar />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};
const toggleTheme = () => {
  document.body.classList.toggle('light-mode');
};

// Button එක update කරන්න
<button id="theme-toggle" onClick={toggleTheme}>
    <i className="fas fa-moon"></i>
    <span>Dark Mode</span>
</button>

export default Layout;


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

export default Layout;
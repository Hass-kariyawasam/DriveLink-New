import React from 'react';
import Sidebar from './Sidebar';
import '../css/sidebar.css';       // Sidebar Styles
import '../css/dashboardstyle.css'; // Dashboard Styles


const Layout = ({ children }) => {
  return (
    // 👇 මේ dashboard-app class එක හරි වැදගත්
    <div className="dashboard-app">
      
      <Sidebar />
      
      {/* Main Content එක */}
      <main className="dashboard-main">
        {children}
      </main>
      
    </div>
  );
};

export default Layout;
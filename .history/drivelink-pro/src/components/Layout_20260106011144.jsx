import React from 'react';
import Sidebar from './Sidebar';
import '../css/dashboardstyle.css'; 
import '../css/sidebar.css';

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
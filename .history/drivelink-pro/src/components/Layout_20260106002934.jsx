import React from 'react';
import Sidebar from './Sidebar';
import '../css/dashboardstyle.css'; 
import '../css/sidebar.css';

const Layout = ({ children }) => {
  return (
    // 👇 මෙන්න මේ class එකෙන් තමයි Dashboard CSS විතරක් වැඩ කරන්නේ
    <div className="dashboard-app">
      
      <Sidebar />
      
      <main style={{ flexGrow: 1, padding: '20px', width: '100%', overflowY: 'auto' }}>
        {children}
      </main>
      
    </div>
  );
};

export default Layout;
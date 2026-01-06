import React from 'react';
import Sidebar from './Sidebar';
import '../css/sidebar.css'; 
import '../css/dashboardstyle.css'; 

const Layout = ({ children }) => {
  return (
    // 👇 මෙන්න මෙතන "dashboard-layout" කියන class එක දැම්මා
    <div className="dashboard-layout">
      
      <Sidebar />
      
      <main className="dashboard-main-content">
        {children}
      </main>
      
    </div>
  );
};

export default Layout;
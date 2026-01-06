import React from 'react';
import Sidebar from './Sidebar';
import '../css/dashboardstyle.css'; // Move dashboardstyle.css to src/css/

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: '20px', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
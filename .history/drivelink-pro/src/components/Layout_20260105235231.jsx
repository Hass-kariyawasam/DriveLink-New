import React from 'react';
import Sidebar from './Sidebar';
import '../css/dashboardstyle.css'; // Dashboard CSS එක මෙතනට

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#11121a' }}>
      {/* වම් පැත්තේ Sidebar එක */}
      <Sidebar />
      
      {/* දකුණු පැත්තේ Main Content එක */}
      <main style={{ flexGrow: 1, padding: '20px', width: '100%', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
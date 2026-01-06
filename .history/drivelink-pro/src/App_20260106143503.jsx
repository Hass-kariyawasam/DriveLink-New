import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import TripManage from './pages/TripManage';

// Pages Import
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FuelStatus from './pages/FuelStatus';
import BatteryStatus from './pages/BatteryStatus';

// 👇 Redirect Logic එක හැදුවා
const AppRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation(); // දැනට ඉන්න පිටුව ගන්න

  useEffect(() => {
    // Phone එකක් නම් සහ දැනට ඉන්නේ මුල් පිටුවේ ('/') නම් විතරක් Dashboard එකට යවන්න
    if (Capacitor.isNativePlatform() && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, location]);

  return null;
};

function App() {
  
  // Status Bar Hide කිරීම (Phone එකට විතරයි)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hideStatusBar = async () => {
        try {
          await StatusBar.hide();
        } catch (err) {
          console.log('Status bar plugin error', err);
        }
      };
      hideStatusBar();
    }
  }, []);

  return (
    <Router>
      {/* 👇 මේකෙන් දැන් බාධාවකින් තොරව පිටු මාරු වෙන්න පුළුවන් */}
      <AppRedirect /> 

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (Dashboard & Others) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/trips" element={<TripManage />} />
      </Routes>
    </Router>
  );
}


export default App;
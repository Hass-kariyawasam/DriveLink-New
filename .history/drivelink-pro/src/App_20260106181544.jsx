import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

// Pages Import
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FuelStatus from './pages/FuelStatus';
import BatteryStatus from './pages/BatteryStatus';
import TripManage from './pages/TripManage';
import LiveTracking from './pages/LiveTracking'; // 👇 Live Tracking import කළා
import TripReport from './pages/TripReport';

// Redirect Logic
const AppRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (Capacitor.isNativePlatform() && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, location]);

  return null;
};

function App() {
  
  // Status Bar Hide (Mobile)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hideStatusBar = async () => {
        try {
          await StatusBar.hide();
        } catch (err) {
          console.log('Status bar error', err);
        }
      };
      hideStatusBar();
    }
  }, []);

  return (
    <Router>
      <AppRedirect /> 

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/trips" element={<TripManage />} />
        
        {/* 👇 මෙන්න විසඳුම: Link එක /map හෝ /live-tracking වුනත් වැඩ කරයි */}
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/map" element={<LiveTracking />} />
        <Route path="/tripreport" element={<TripReport />} />

      </Routes>
    </Router>
  );
}

export default App;
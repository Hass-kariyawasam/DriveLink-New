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
import LiveTracking from './pages/LiveTracking';
import TripReport from './pages/TripReport'; // අපි කලින් හැදුවා
import VehicleHealth from './pages/VehicleHealth'; // අලුතින් හැදුවා

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
        <Route path="/fuelstatus.html" element={<FuelStatus />} /> {/* HTML Link Fix */}

        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/batterystatus.html" element={<BatteryStatus />} /> {/* HTML Link Fix */}

        <Route path="/trips" element={<TripManage />} />
        <Route path="/tripmange.html" element={<TripManage />} /> {/* HTML Link Fix */}
        
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/livetraking.html" element={<LiveTracking />} /> {/* HTML Link Fix */}
        <Route path="/map" element={<LiveTracking />} />

        {/* 👇 අලුතින් එකතු කළ Routes (Errors Fix) */}
        
        {/* 1. Vehicle Health Route */}
        <Route path="/health" element={<VehicleHealth />} />
        <Route path="/vehicalhelth.html" element={<VehicleHealth />} /> 

        {/* 2. Trip Report Routes (Multiple options to catch errors) */}
        <Route path="/tripreport" element={<TripReport />} />
        <Route path="/reports/trip" element={<TripReport />} /> {/* Error Fix */}
        <Route path="/tripreport.html" element={<TripReport />} />

      </Routes>
    </Router>
  );
}

export default App;
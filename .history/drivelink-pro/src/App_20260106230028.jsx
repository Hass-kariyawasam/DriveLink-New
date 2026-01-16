import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

// --- IMPORTS ---
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FuelStatus from './pages/FuelStatus';
import BatteryStatus from './pages/BatteryStatus';
import TripManage from './pages/TripManage';
import LiveTracking from './pages/LiveTracking';
import TripReport from './pages/TripReport'; 
import VehicleHealth from './pages/VehicleHealth'; // 1. Import New Page
import TripView from './pages/TripView';
// ... anith imports ...
import Reminders from './pages/Reminders';
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
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hideStatusBar = async () => {
        try { await StatusBar.hide(); } catch (err) { console.log(err); }
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
        
        {/* Main Features */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Fuel & Battery (Handling HTML links if any exist) */}
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/fuelstatus.html" element={<FuelStatus />} />

        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/batterystatus.html" element={<BatteryStatus />} />

        {/* Trips & Map */}
        <Route path="/trips" element={<TripManage />} />
        <Route path="/tripmange.html" element={<TripManage />} />
        
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/livetraking.html" element={<LiveTracking />} />
        <Route path="/map" element={<LiveTracking />} />
        <Route path="/tripreport" element={<TripReport />} />
        <Route path="/reports/view/:id" element={<TripView />} /> {/* New Route */}
        <Route path="/reminders" element={<Reminders />} />

        {/* --- FIXING THE MISSING ROUTES HERE --- */}
        
        {/* 1. Fix "/health" error */}
        <Route path="/health" element={<VehicleHealth />} />
        <Route path="/vehicalhelth.html" element={<VehicleHealth />} />

        {/* 2. Fix "/reports/trip" error */}
        <Route path="/tripreport" element={<TripReport />} />
        <Route path="/reports/trip" element={<TripReport />} /> 
        <Route path="/tripreport.html" element={<TripReport />} />

      </Routes>
    </Router>
  );
}

export default App;
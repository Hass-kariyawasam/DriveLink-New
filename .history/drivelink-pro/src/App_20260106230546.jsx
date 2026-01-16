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

// 🔥 New Imports we created
import VehicleHealth from './pages/VehicleHealth';
import TripReport from './pages/TripReport';
import TripView from './pages/TripView';
import Reminders from './pages/Reminders';

// Redirect Logic (Mobile Back Button Handling etc.)
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
  // Hide Status Bar on Mobile
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
        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- Dashboard --- */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* --- Fuel & Battery --- */}
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/fuelstatus.html" element={<FuelStatus />} /> {/* For legacy links */}

        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/batterystatus.html" element={<BatteryStatus />} />

        {/* --- Trips & Map --- */}
        <Route path="/trips" element={<TripManage />} />
        <Route path="/tripmange.html" element={<TripManage />} />
        
        <Route path="/map" element={<LiveTracking />} />
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/livetraking.html" element={<LiveTracking />} />

        {/* --- VEHICLE HEALTH (Updated) --- */}
        <Route path="/health" element={<VehicleHealth />} />
        <Route path="/vehicalhelth.html" element={<VehicleHealth />} />

        {/* --- REPORTS (Updated) --- */}
        <Route path="/tripreport" element={<TripReport />} />
        <Route path="/reports/trip" element={<TripReport />} /> 
        <Route path="/tripreport.html" element={<TripReport />} />
        
        {/* View Single Trip Detail */}
        <Route path="/reports/view/:id" element={<TripView />} />

        {/* --- REMINDERS (Updated) --- */}
        <Route path="/reminders" element={<Reminders />} />

        {/* --- FUTURE PAGES (Placeholders) --- */}
        {/* Sidebar එකේ Link කරලා තිබුනට තාම හදලා නැත්නම් මේවා Comment කරලා තියන්න */}
        {/* <Route path="/history" element={<History />} /> */}
        {/* <Route path="/profile" element={<Profile />} /> */}

      </Routes>
    </Router>
  );
}

export default App;
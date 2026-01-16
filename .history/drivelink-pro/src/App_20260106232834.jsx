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

// 🔥 Notification Imports
import { requestForToken, onMessageListener } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🔥 New Page Imports
import VehicleHealth from './pages/VehicleHealth';
import TripReport from './pages/TripReport';
import TripView from './pages/TripView';
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
  
  // 1. Hide Status Bar on Mobile
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hideStatusBar = async () => {
        try { await StatusBar.hide(); } catch (err) { console.log(err); }
      };
      hideStatusBar();
    }
  }, []);

  // 2. 🔥 Notification Logic (This fixes the ESLint error)
  useEffect(() => {
    // Permission ඉල්ලීම
    requestForToken();

    // ඇප් එක ඇතුලේ ඉද්දි Notification ආවොත් Toast එකක් පෙන්වීම
    onMessageListener().then((payload) => {
      // Toast Notification පෙන්වීම
      toast.info(`${payload.notification.title}: ${payload.notification.body}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      console.log('Foreground Message:', payload);
    }).catch(err => console.log('failed: ', err));
  }, []);

  return (
    <Router>
      <AppRedirect />
      
      {/* Notification Toast Container */}
      <ToastContainer /> 
      
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- Dashboard --- */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* --- Fuel & Battery --- */}
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/fuelstatus.html" element={<FuelStatus />} />

        <Route path="/battery" element={<BatteryStatus />} />
        <Route path="/batterystatus.html" element={<BatteryStatus />} />

        {/* --- Trips & Map --- */}
        <Route path="/trips" element={<TripManage />} />
        <Route path="/tripmange.html" element={<TripManage />} />
        
        <Route path="/map" element={<LiveTracking />} />
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/livetraking.html" element={<LiveTracking />} />

        {/* --- VEHICLE HEALTH --- */}
        <Route path="/health" element={<VehicleHealth />} />
        <Route path="/vehicalhelth.html" element={<VehicleHealth />} />

        {/* --- REPORTS --- */}
        <Route path="/tripreport" element={<TripReport />} />
        <Route path="/reports/trip" element={<TripReport />} /> 
        <Route path="/tripreport.html" element={<TripReport />} />
        
        {/* View Single Trip Detail */}
        <Route path="/reports/view/:id" element={<TripView />} />

        {/* --- REMINDERS --- */}
        <Route path="/reminders" element={<Reminders />} />

      </Routes>
    </Router>
  );
}

export default App;
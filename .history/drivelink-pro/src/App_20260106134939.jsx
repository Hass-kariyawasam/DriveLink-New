import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core'; // 👇 මේක import කරන්න
import { StatusBar } from '@capacitor/status-bar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FuelStatus from './pages/FuelStatus';
import BatteryStatus from './pages/BatteryStatus';

// 👇 මේ පොඩි Component එකෙන් තමයි තීරණය කරන්නේ කොහාටද යන්නේ කියලා
const AppRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Phone App එකක් නම් Dashboard එකට යන්න
    if (Capacitor.isNativePlatform()) {
      navigate('/dashboard');
    } 
    // Web එකක් නම් නිකන්ම Home එකේ ඉන්න (වෙනසක් කරන්න ඕන නෑ)
  }, [navigate]);

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
      {/* 👇 මේකෙන් තමයි මුලින්ම Check කරන්නේ Phone ද Web ද කියලා */}
      <AppRedirect /> 

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/battery" element={<BatteryStatus />} />
      </Routes>
    </Router>
  );
}

export default App;
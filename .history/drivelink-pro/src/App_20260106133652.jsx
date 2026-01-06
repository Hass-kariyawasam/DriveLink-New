import { StatusBar } from '@capacitor/status-bar';
import { useEffect } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages import කරගන්න
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import FuelStatus from './pages/FuelStatus';
import BatteryStatus from './pages/BatteryStatus';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* New Route */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/fuel" element={<FuelStatus />} />
        <Route path="/battery" element={<BatteryStatus />} />
      </Routes>
    </Router>
  );
}
// 👇 මේ පේළිය තමයි Error එකට හේතුව. මේක අනිවාර්යයෙන්ම දාන්න.
export default App;
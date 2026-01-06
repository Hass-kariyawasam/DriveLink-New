import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages Import
import Home from './pages/Home';
//import Login from './pages/Login';      // (මේවා අපි ඊළඟට හදමු)
//import Register from './pages/Register'; // (මේවා අපි ඊළඟට හදමු)
// Dashboard එක පසුව එකතු කරමු

function App() {
  return (
    <Router>
      <Routes>
        {/* "/" කියන්නේ මුල් පිටුවයි */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
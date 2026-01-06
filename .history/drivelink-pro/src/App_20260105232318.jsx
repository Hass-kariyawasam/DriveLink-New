import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages import කරගන්න
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

// 👇 මේ පේළිය තමයි Error එකට හේතුව. මේක අනිවාර්යයෙන්ම දාන්න.
export default App;
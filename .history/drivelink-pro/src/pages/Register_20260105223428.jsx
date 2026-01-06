import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase'; 
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { ref, set } from "firebase/database";
import './style.css'; // ඔබේ style.css එක මෙතනට import කරලා තියෙන්න ඕන

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    deviceId: '',
    vehicleType: 'dio',
    mileage: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await set(ref(db, 'users/' + user.uid), {
        username: formData.username,
        email: formData.email,
        deviceId: formData.deviceId,
        vehicleType: formData.vehicleType,
        mileage: formData.mileage
      });
      alert("Registration Successful!");
      navigate('/login');
    } catch (error) {
      alert("Registration Failed: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      alert("Google Sign-In Failed: " + error.message);
    }
  };

  return (
    <>
      {/* HTML එකේ තිබුණ Overlay සහ Toast එක එලෙසම */}
      <div id="blurOverlay" className="blur-overlay"></div>
      <div id="toast" className="toast">
        <span id="toastMessage">DriveLink</span>
      </div>

      <div className="register-container">
        <h1>DriveLink</h1>
        <h2>Register</h2>
        
        <form className="form" onSubmit={handleRegister}>
            <div className="form-group">
                <input type="text" id="username" placeholder="Username" required onChange={handleChange} />
            </div>
            <div className="form-group">
                <input type="email" id="email" placeholder="Email" required onChange={handleChange} />
            </div>
            <div className="form-group">
                <input type="password" id="password" placeholder="Password" required onChange={handleChange} />
            </div>
            <div className="form-group">
                <input type="password" id="confirmPassword" placeholder="Confirm-password" required onChange={handleChange} />
            </div>
            <div className="form-group">
                <input type="text" id="deviceId" placeholder="Device ID" required onChange={handleChange} />
            </div>
            <div className="form-group">
                <select id="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                    <option value="dio">Dio</option>
                    <option value="ct100">CT100</option>
                    <option value="fz">FZ</option>
                </select>
            </div>
            <div className="form-group">
                <input type="number" id="mileage" placeholder="Mileage (km)" required onChange={handleChange} />
            </div>

            <button type="submit" id="register-button">Register</button>

            <p>Already have an account? <Link to="/login">Login here</Link></p>
        </form>

        <div className="login-container1">
            <button type="button" id="google-login-button" onClick={handleGoogleLogin}>
                <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google Logo" />
                Sign in with Google
            </button>
        </div>
        
        <h4>©Team TeraNode</h4>
      </div>
    </>
  );
};

export default Register;
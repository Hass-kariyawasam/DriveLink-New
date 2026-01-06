import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import '../style.css'; 

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirmPassword: "", deviceId: "", vehicleType: "dio", mileage: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { alert("Passwords do not match!"); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: formData.username, email: formData.email, deviceId: formData.deviceId,
        vehicleType: formData.vehicleType, mileage: formData.mileage, timestamp: serverTimestamp()
      });
      alert("Registration Successful!");
      navigate("/login");
    } catch (error) { alert("Error: " + error.message); }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", result.user.uid), {
        username: result.user.displayName, email: result.user.email, timestamp: serverTimestamp()
      }, { merge: true });
      alert("Google Sign-In Successful!");
      navigate("/dashboard");
    } catch (error) { alert("Google Sign-In Failed: " + error.message); }
  };

  return (
    // 👇 මෙන්න මේ wrapper එක දාන්න
    <div className="auth-layout">
      <div className="register-container">
        <h1>DriveLink</h1>
        <h2>Register</h2>
        <form className="form" onSubmit={handleRegister}>
          <div className="form-group"><input type="text" id="username" placeholder="Username" onChange={handleChange} required /></div>
          <div className="form-group"><input type="email" id="email" placeholder="Email" onChange={handleChange} required /></div>
          <div className="form-group"><input type="password" id="password" placeholder="Password" onChange={handleChange} required /></div>
          <div className="form-group"><input type="password" id="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required /></div>
          <div className="form-group"><input type="text" id="deviceId" placeholder="Device ID" onChange={handleChange} required /></div>
          <div className="form-group">
            <select id="vehicleType" onChange={handleChange} value={formData.vehicleType}>
              <option value="dio">Dio</option>
              <option value="ct100">CT100</option>
              <option value="fz">FZ</option>
            </select>
          </div>
          <div className="form-group"><input type="number" id="mileage" placeholder="Mileage (km)" onChange={handleChange} required /></div>

          <button type="submit">Register</button>
        </form>

        <p style={{marginTop:'15px'}}>Already have an account? <Link to="/login" style={{color:'#06e690'}}>Login</Link></p>

        <div className="login-container1" style={{marginTop:'15px'}}>
          <button id="google-login-button" onClick={handleGoogleLogin} type="button">
            <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google Logo" style={{width:'20px', marginRight:'10px'}} />
            Sign in with Google
          </button>
        </div>
        <h4 style={{marginTop:'20px'}}>©Team TeraNode</h4>
      </div>
    </div>
  );
};

export default Register;
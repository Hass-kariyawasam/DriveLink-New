import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import '../style.css'; 

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    deviceId: "",
    vehicleType: "dio",
    mileage: ""
  });

  useEffect(() => {
    document.body.className = 'auth-body';
    return () => { document.body.className = ''; };
  }, []);

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
      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save Extra Data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: formData.username,
        email: formData.email,
        deviceId: formData.deviceId,
        vehicleType: formData.vehicleType,
        mileage: formData.mileage,
        timestamp: serverTimestamp()
      });

      alert("Registration Successful!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="register-container">
      <h1>DriveLink</h1>
      <h2>Register</h2>
      <form className="form" onSubmit={handleRegister}>
        <div className="form-group">
          <input type="text" id="username" placeholder="Username" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <input type="email" id="email" placeholder="Email" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <input type="password" id="password" placeholder="Password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <input type="password" id="confirmPassword" placeholder="Confirm-password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <input type="text" id="deviceId" placeholder="Device ID" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <select id="vehicleType" onChange={handleChange} value={formData.vehicleType}>
            <option value="dio">Dio</option>
            <option value="ct100">CT100</option>
            <option value="fz">FZ</option>
          </select>
        </div>
        <div className="form-group">
          <input type="number" id="mileage" placeholder="Mileage (km)" onChange={handleChange} required />
        </div>

        <button type="submit" id="register-button">Register</button>
        <p>Already have an account? <Link to="/login">Login here</Link></p>
      </form>
      <h4>©Team TeraNode</h4>
    </div>
  );
};

export default Register;
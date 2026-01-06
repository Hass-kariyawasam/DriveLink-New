import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match!");
    }

    try {
      // 1. Firebase Auth එකේ User කෙනෙක් හදනවා
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Realtime Database එකේ User ගේ විස්තර Save කරනවා
      await set(ref(db, 'users/' + user.uid), {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        vehicles: {} // වාහන සඳහා හිස් ඉඩක්
      });

      // සාර්ථක නම් Dashboard එකට යවන්න
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Join DriveLink today</p>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" name="username" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="text" name="phone" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" required onChange={handleChange} />
          </div>

          <button type="submit" className="auth-btn">Register</button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import '../css/style.css'; // CSS Import

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
      navigate("/dashboard"); // Dashboard එකට යවන්න
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Google Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      alert("Google Login Failed: " + error.message);
    }
  };

  return (
    // 👇 මෙන්න මේ wrapper එකෙන් styles වෙන් කරනවා
    <div className="auth-layout">
      <div className="register-container">
        <h1>DriveLink</h1>
        <h2>Login</h2>
        
        <form className="form" onSubmit={handleLogin}>
          <div className="form-group">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit">Login</button>
        </form>

        <p style={{marginTop:'15px'}}>Don't have an account? <Link to="/register" style={{color:'#06e690'}}>Register</Link></p>

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

export default Login;
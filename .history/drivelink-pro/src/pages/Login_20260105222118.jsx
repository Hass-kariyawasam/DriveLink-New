import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase'; // firebase configuration import
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import './style.css'; // ඔබේ style.css එක import කිරීම

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // සාර්ථක නම් Dashboard එකට
    } catch (error) {
      alert("Login Failed: " + error.message);
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
      <div id="blurOverlay" className="blur-overlay"></div>
      
      <div className="login-container">
        <h1>DriveLink</h1>
        <h2>Login</h2>
        <form className="form" onSubmit={handleLogin}>
          <div className="form-group">
            <input 
              type="email" 
              id="email" 
              placeholder="Email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              id="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" id="login-button">Login</button>
          
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
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

export default Login;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import '../style.css'; // Auth CSS

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Body Background වෙනස් කිරීම (CSS Class එක මාරු කිරීම)
  useEffect(() => {
    document.body.className = 'auth-body';
    return () => { document.body.className = ''; };
  }, []);

  // Login Function
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!"); // Toast එක පස්සේ ලස්සනට දාමු
      navigate("/"); // Dashboard එකට හෝ Home එකට යවන්න
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  // Google Login Function
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Google Login Successful!");
      navigate("/");
    } catch (error) {
      alert("Google Login Failed: " + error.message);
    }
  };

  return (
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
        <button type="submit" id="login-button">Login</button>
      </form>

      <p>Don't have an account? <Link to="/register">Register</Link></p>
      <br />

      <div className="login-container1">
        <button id="google-login-button" onClick={handleGoogleLogin} type="button">
          <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google Logo" />
          Sign in with Google
        </button>
      </div>
      <h4>©Team TeraNode</h4>
    </div>
  );
};

export default Login;
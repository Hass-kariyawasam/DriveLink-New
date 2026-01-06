import React from 'react';
import { Link } from 'react-router-dom';
import '../css/auth.css'; // Auth CSS එක විතරයි

const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        <form>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter email" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" required />
          </div>
          <button type="submit" className="auth-btn">Log In</button>
        </form>
        <p className="switch-link">
          New here? <Link to="/register">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
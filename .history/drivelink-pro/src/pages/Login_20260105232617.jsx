import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/style.css'; // Auth CSS

const Login = () => {
  // Login page එකට ආවම අඳුරු පසුබිම (Gradient) වැටෙන්න ඕන නිසා
  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => { document.body.classList.remove('auth-body'); };
  }, []);

  return (
    <div className="register-container">
      <h1>DriveLink</h1>
      <h2>Login</h2>
      <form className="form">
        <div className="form-group">
          <input type="email" id="email" placeholder="Email" required />
        </div>
        <div className="form-group">
          <input type="password" id="password" placeholder="Password" required />
        </div>
        <button type="button" id="login-button">Login</button>

        <p>Don't have an account? <Link to="/register">Register here</Link></p>
        <p style={{marginTop:'10px'}}><Link to="/">Back to Home</Link></p>
      </form>
      
       {/* Toast & Blur Overlay logic React විදියට පස්සේ දාගන්න පුළුවන් */}
       <div id="toast" className="toast"><span id="toastMessage">DriveLink</span></div>
    </div>
  );
};

export default Login;
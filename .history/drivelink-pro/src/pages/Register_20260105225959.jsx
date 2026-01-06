import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../style.css'; // Auth CSS

const Register = () => {
  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => { document.body.classList.remove('auth-body'); };
  }, []);

  return (
    <div className="register-container">
      <h1>DriveLink</h1>
      <h2>Register</h2>
      <form className="form">
        <div className="form-group">
          <input type="text" id="username" placeholder="Username" required />
        </div>
        <div className="form-group">
          <input type="email" id="email" placeholder="Email" required />
        </div>
        <div className="form-group">
          <input type="password" id="password" placeholder="Password" required />
        </div>
        <div className="form-group">
            <input type="password" id="confirm-password" placeholder="Confirm-password" required />
        </div>
        
        {/* Dropdown එක */}
        <div className="form-group">
             <select id="vehicle-type" style={{width: '100%', padding: '10px', borderRadius:'5px'}}>
                <option value="dio">Dio</option>
                <option value="ct100">CT100</option>
                <option value="fz">FZ</option>
             </select>
        </div>

        <button type="button" id="register-button">Register</button>

        <p>Already have an account? <Link to="/login">Login here</Link></p>
      </form>

      <div className="login-container1" style={{marginTop:'20px'}}>
        <button id="google-login-button" style={{background:'#DB4437', color:'white', border:'none', padding:'10px', width:'100%', borderRadius:'5px'}}>
            Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Register;
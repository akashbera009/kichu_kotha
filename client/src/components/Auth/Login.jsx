// frontend/src/components/Auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, currentUser, token , requestFirebaseToken} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to chat
  const from = location.state?.from?.pathname || '/chat';

  // Effect to handle navigation after successful login
  useEffect(() => {
    if (currentUser && token) {
      console.log('User logged in, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [currentUser, token, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Navigation will be handled by useEffect after state updates
        requestFirebaseToken();
        console.log('Login successful, waiting for navigation...');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">কিছু কথা</h1>
          <p className="auth-subtitle">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="auth-link"> Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for forgot password
    try {
      // In a real application, you would call your backend endpoint here:
      // await axios.post('/api/auth/forgot-password', { email });
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating network request
      
      setSubmitted(true);
      toast.success('Password reset link sent!');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '450px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-500)', fontSize: '0.875rem', fontWeight: '500', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <h2>Forgot Password</h2>
        <p className="auth-subtitle">
          {submitted 
            ? "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
            : "Enter the email address associated with your account and we'll send you a link to reset your password."}
        </p>

        {!submitted && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {submitted && (
          <button 
            onClick={() => setSubmitted(false)} 
            className="btn btn-secondary btn-lg btn-block" 
            style={{ marginTop: '1rem' }}
          >
            Try another email
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
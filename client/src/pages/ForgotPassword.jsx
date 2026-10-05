import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, Send } from 'lucide-react';
import client from '../api/client.js';
import './AuthPage.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const { data } = await client.post('/api/auth/forgot-password', { email });
      setMessage(data.message || 'If the account exists, a reset link was sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request password reset');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card card animate-fade-in">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your account email and we will send password reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <input
                className="input"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {error ? <p className="error-msg">{error}</p> : null}
          {message ? <p className="success-msg">{message}</p> : null}

          <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={busy}>
            <Send size={18} />
            <span>{busy ? 'Sending Reset Link…' : 'Send Reset Link'}</span>
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <Link to="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

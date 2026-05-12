import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="muted auth-sub">Enter your account email and we will send password reset instructions.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          {error ? <p className="error-msg">{error}</p> : null}
          {message ? <p className="success-msg">{message}</p> : null}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-toggle muted">
          Remembered your password?{' '}
          <Link to="/" className="link-btn">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

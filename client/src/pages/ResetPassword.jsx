import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client.js';
import './AuthPage.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    if (!token) {
      setError('Reset token is missing.');
      setBusy(false);
      return;
    }

    try {
      await client.post('/api/auth/reset-password', { token, password });
      setMessage('Password updated successfully. Redirecting to login…');
      setTimeout(() => navigate('/'), 1300);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Create a New Password</h1>
        <p className="muted auth-sub">Use the reset token from your email to choose a new password.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            New password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {error ? <p className="error-msg">{error}</p> : null}
          {message ? <p className="success-msg">{message}</p> : null}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="auth-toggle muted">
          <Link to="/" className="link-btn">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

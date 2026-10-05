import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    <div className="auth-wrapper">
      <div className="auth-card card animate-fade-in">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <h1 className="auth-title">New Password</h1>
          <p className="auth-subtitle">Choose a secure new password for your ChatApp account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="input-wrapper">
              <input
                className="input"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error ? <p className="error-msg">{error}</p> : null}
          {message ? <p className="success-msg">{message}</p> : null}

          <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={busy}>
            <KeyRound size={18} />
            <span>{busy ? 'Updating…' : 'Update Password'}</span>
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

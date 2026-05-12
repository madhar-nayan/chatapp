import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('signup');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('email', email);
      fd.append('password', password);
      if (avatar) fd.append('profilePicture', avatar);
      await register(fd);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Chat App</h1>
        <p className="muted auth-sub">
          {mode === 'signup'
            ? 'Create your account to connect and chat with friends.'
            : 'Welcome back — sign in to continue.'}
        </p>

        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="auth-form">
            <label className="auth-label">
              Username
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
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
            <label className="auth-label">
              Password
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
            <label className="auth-label">
              Profile picture (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              />
            </label>
            {error ? <p className="error-msg">{error}</p> : null}
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
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
            <label className="auth-label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <p className="auth-toggle muted" style={{ margin: 0 }}>
              <Link to="/forgot-password" className="link-btn">
                Forgot password?
              </Link>
            </p>
            {error ? <p className="error-msg">{error}</p> : null}
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Log in'}
            </button>
          </form>
        )}

        <p className="auth-toggle muted">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('login'); setError(''); }}>
                Log in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('signup'); setError(''); }}>
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

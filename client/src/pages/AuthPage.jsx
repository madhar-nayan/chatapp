import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, Mail, User, Image, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('signup');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatar(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

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
      const msg = typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : (err.message || 'Could not create account');
      setError(msg);
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
      const msg = typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : (err.message || 'Login failed');
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card card animate-fade-in">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <h1 className="auth-title">ChatApp</h1>
          <p className="auth-subtitle">
            {mode === 'signup'
              ? 'Join ChatApp to connect, share, and video chat in real-time.'
              : 'Welcome back — enter your credentials to continue.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`mode-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Create Account
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
        </div>

        {/* Form Body */}
        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="auth-form">
            {/* Avatar Selection */}
            <div className="avatar-upload-section">
              <div className="avatar-upload-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="preview-img" />
                ) : (
                  <div className="preview-placeholder">
                    <User size={24} color="var(--text-muted)" />
                  </div>
                )}
                <label className="upload-btn-badge" title="Upload avatar">
                  <Image size={14} color="#FFFFFF" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <span className="upload-label-text">
                {avatar ? avatar.name : 'Upload Profile Picture (Optional)'}
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">Username</label>
              <div className="input-wrapper">
                <input
                  className="input"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
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

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={busy}>
              <span>{busy ? 'Creating Account…' : 'Get Started'}</span>
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email</label>
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

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="input-wrapper">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn-primary btn-lg auth-submit-btn" disabled={busy}>
              <span>{busy ? 'Signing In…' : 'Sign In'}</span>
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p className="muted small">
            By registering, you agree to ChatApp&apos;s Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

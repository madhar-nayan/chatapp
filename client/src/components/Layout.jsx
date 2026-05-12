import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-inner container">
          <button type="button" className="brand" onClick={() => navigate('/feed')}>
            Chat App
          </button>
          <div className="top-actions">
            <button type="button" className="btn btn-ghost btn-sm theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <span className="top-user muted">@{user?.username}</span>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav" aria-label="Main">
        <NavLink to="/feed" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span>Search</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span>Messages</span>
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <span>Alerts</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span>Profile</span>
        </NavLink>
        <button type="button" className="nav-item nav-logout" onClick={() => { logout(); navigate('/'); }}>
          Log out
        </button>
      </nav>
    </div>
  );
}

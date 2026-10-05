import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  PlusSquare,
  MessageSquare,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './common/Avatar.jsx';
import CreatePostModal from './posts/CreatePostModal.jsx';
import client from '../api/client.js';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    let active = true;
    async function fetchUnread() {
      try {
        const { data } = await client.get('/api/notifications');
        if (active && data.notifications) {
          const unread = data.notifications.filter((n) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch {
        /* ignore */
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // refresh count
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handlePostCreated = () => {
    // If currently on feed, refresh feed or dispatch event
    window.dispatchEvent(new CustomEvent('post-created'));
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-header-inner container">
          <button type="button" className="brand-logo" onClick={() => navigate('/feed')}>
            <span className="brand-icon">
              <Sparkles size={20} color="#FFFFFF" />
            </span>
            <span className="brand-text">ChatApp</span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" aria-label="Desktop Main Navigation">
            <NavLink to="/feed" className={({ isActive }) => (isActive ? 'desk-link active' : 'desk-link')}>
              <Home size={19} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => (isActive ? 'desk-link active' : 'desk-link')}>
              <Search size={19} />
              <span>Search</span>
            </NavLink>
            <button
              type="button"
              className="desk-link create-btn-desktop"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusSquare size={19} />
              <span>Create</span>
            </button>
            <NavLink to="/chat" className={({ isActive }) => (isActive ? 'desk-link active' : 'desk-link')}>
              <MessageSquare size={19} />
              <span>Messages</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'desk-link active' : 'desk-link')}>
              <div className="icon-with-badge">
                <Bell size={19} />
                {unreadCount > 0 && <span className="unread-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </div>
              <span>Notifications</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'desk-link active' : 'desk-link')}>
              <User size={19} />
              <span>Profile</span>
            </NavLink>
          </nav>

          {/* Right Header Actions */}
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle dark theme"
            >
              {theme === 'dark' ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#7C3AED" />}
            </button>

            {/* Mobile notification bell in header */}
            <button
              type="button"
              className="mobile-notif-btn"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="mobile-unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {/* User Profile Avatar Link */}
            <div className="header-profile-link" onClick={() => navigate('/profile')}>
              <Avatar src={user?.profilePicture} name={user?.username} size="sm" showBorder />
              <span className="header-username">{user?.username}</span>
            </div>

            {/* Desktop Logout Button */}
            <button
              type="button"
              className="btn btn-ghost btn-sm desktop-logout-btn"
              onClick={() => {
                logout();
                navigate('/');
              }}
              title="Log out"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="app-main-content">
        {children}
      </main>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink to="/feed" className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}>
          <Search size={22} />
          <span>Search</span>
        </NavLink>

        <button
          type="button"
          className="mobile-nav-item mobile-create-trigger"
          onClick={() => setIsCreateOpen(true)}
          aria-label="Create Post"
        >
          <div className="create-icon-wrapper">
            <PlusSquare size={22} />
          </div>
          <span>Create</span>
        </button>

        <NavLink to="/chat" className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}>
          <MessageSquare size={22} />
          <span>Messages</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}>
          <User size={22} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Global Create Post Modal / Bottom Sheet */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

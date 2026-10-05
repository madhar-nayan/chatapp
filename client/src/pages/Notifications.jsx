import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Share2, CheckCheck, Sparkles } from 'lucide-react';
import client from '../api/client.js';
import Avatar from '../components/common/Avatar.jsx';
import { UserSkeleton } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './Notifications.css';

const ICONS = {
  like: <Heart size={16} color="#EF4444" fill="#EF4444" />,
  comment: <MessageCircle size={16} color="#7C3AED" />,
  friend_request: <UserPlus size={16} color="#EC4899" />,
  friend_accept: <UserCheck size={16} color="#22C55E" />,
  share: <Share2 size={16} color="#3B82F6" />,
};

const LABELS = {
  like: 'liked your post',
  comment: 'commented on your post',
  friend_request: 'sent you a friend request',
  friend_accept: 'accepted your friend request',
  share: 'shared your post',
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await client.get('/api/notifications');
      setItems(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    await client.post(`/api/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    await client.post('/api/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (loading) {
    return (
      <div className="notif-page container">
        <div className="card" style={{ padding: '20px' }}>
          <UserSkeleton />
          <UserSkeleton />
        </div>
      </div>
    );
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="notif-page container">
      <div className="card notif-card">
        {/* Header */}
        <div className="notif-header">
          <div>
            <h1 className="notif-title">Notifications</h1>
            <p className="notif-subtitle">Stay updated with friend interactions and feed activity</p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm mark-all-btn"
              onClick={markAllRead}
              disabled={!hasUnread}
            >
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List or Empty State */}
        {items.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="You're all caught up 🎉"
            description="When friends like, comment, or interact with you, notifications will show up here."
          />
        ) : (
          <ul className="notif-list">
            {items.map((n) => {
              const icon = ICONS[n.type] || <Bell size={16} color="var(--primary)" />;
              const labelText = LABELS[n.type] || n.type;
              return (
                <li key={n._id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                  <Link
                    to={linkFor(n)}
                    className="notif-link-wrapper"
                    onClick={() => !n.read && markRead(n._id)}
                  >
                    <div className="notif-avatar-box">
                      <Avatar src={n.fromUser?.profilePicture} name={n.fromUser?.username} size="md" />
                      <div className="notif-type-icon">{icon}</div>
                    </div>

                    <div className="notif-body-text">
                      <p className="notif-text">
                        <strong className="notif-username">{n.fromUser?.username}</strong> {labelText}
                      </p>

                      {n.post?.caption && (
                        <p className="notif-caption-preview">&ldquo;{n.post.caption}&rdquo;</p>
                      )}

                      <span className="notif-time">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </Link>

                  {n.type === 'friend_request' && n.friendRequest && n.friendRequest.status === 'pending' && (
                    <div className="notif-action-box">
                      <Link to="/search" className="btn btn-primary btn-sm">
                        Respond
                      </Link>
                    </div>
                  )}

                  {!n.read && <span className="notif-unread-dot" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function linkFor(n) {
  if (n.type === 'friend_request' || n.type === 'friend_accept') {
    return `/user/${n.fromUser?._id || n.fromUser}`;
  }
  if (n.post?._id) return `/feed`;
  return '/feed';
}

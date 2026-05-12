import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { mediaUrl } from '../utils/mediaUrl.js';
import './Notifications.css';

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
      setItems(data.notifications);
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

  if (loading) return <p className="muted container">Loading…</p>;

  return (
    <div className="notif-page container">
      <div className="notif-head">
        <h1>Notifications</h1>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await client.post('/api/notifications/read-all');
            setItems((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
        >
          Mark all read
        </button>
      </div>
      {items.length === 0 ? (
        <p className="muted">You&apos;re all caught up.</p>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n._id} className={`notif-item card ${n.read ? 'read' : ''}`}>
              <Link
                to={linkFor(n)}
                className="notif-link"
                onClick={() => !n.read && markRead(n._id)}
              >
                {n.fromUser?.profilePicture ? (
                  <img src={mediaUrl(n.fromUser.profilePicture)} alt="" className="notif-av" />
                ) : (
                  <span className="notif-av placeholder" />
                )}
                <div>
                  <p>
                    <strong>{n.fromUser?.username}</strong> {LABELS[n.type] || n.type}
                  </p>
                  {n.post?.caption ? (
                    <p className="muted small truncate">&ldquo;{n.post.caption}&rdquo;</p>
                  ) : null}
                  <p className="muted small">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
              {n.type === 'friend_request' && n.friendRequest && n.friendRequest.status === 'pending' ? (
                <div className="notif-actions">
                  <Link to="/search" className="btn btn-primary btn-sm">
                    Respond
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
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

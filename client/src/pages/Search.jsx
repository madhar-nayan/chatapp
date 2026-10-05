import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, Check, Clock, UserCheck, UserX, Sparkles } from 'lucide-react';
import client from '../api/client.js';
import Avatar from '../components/common/Avatar.jsx';
import { UserSkeleton } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './Search.css';

export default function Search() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRec, setLoadingRec] = useState(true);

  async function search() {
    if (!q.trim()) return;
    setMsg('');
    setMsgType('');
    setLoadingSearch(true);
    try {
      const { data } = await client.get('/api/users/search', { params: { q } });
      setUsers(data.users || []);
    } catch {
      setMsgType('error');
      setMsg('Search failed. Please try again.');
    } finally {
      setLoadingSearch(false);
    }
  }

  async function loadRequests() {
    try {
      const { data } = await client.get('/api/friends/requests/incoming');
      setIncoming(data.requests || []);
    } catch {
      /* ignore */
    }
  }

  async function loadRecommended() {
    try {
      const { data } = await client.get('/api/users/recommended');
      setRecommended(data.users || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingRec(false);
    }
  }

  useEffect(() => {
    loadRequests();
    loadRecommended();
  }, []);

  async function sendRequest(userId) {
    setBusyId(userId);
    setMsg('');
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: true } : u)));
    setRecommended((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: true } : u)));

    try {
      await client.post(`/api/friends/request/${userId}`);
      setMsgType('success');
      setMsg('Friend request sent!');
    } catch (e) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: false } : u)));
      setRecommended((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: false } : u)));
      setMsgType('error');
      setMsg(e.response?.data?.error || 'Could not send friend request.');
    } finally {
      setBusyId(null);
    }
  }

  async function acceptRequest(id) {
    setBusyId(id);
    try {
      await client.post(`/api/friends/accept/${id}`);
      await loadRequests();
      setMsgType('success');
      setMsg('You are now friends!');
    } catch (e) {
      setMsgType('error');
      setMsg(e.response?.data?.error || 'Failed to accept request.');
    } finally {
      setBusyId(null);
    }
  }

  async function rejectRequest(id) {
    setBusyId(id);
    try {
      await client.post(`/api/friends/reject/${id}`);
      await loadRequests();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="search-page container">
      {/* Search Input Section */}
      <section className="card search-card">
        <h1 className="search-title">Discover People</h1>
        <p className="search-subtitle">Search for friends by username or email</p>

        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-icon" />
          <input
            className="input search-input"
            placeholder="Search username or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button type="button" className="btn btn-primary search-btn" onClick={search} disabled={loadingSearch}>
            {loadingSearch ? 'Searching…' : 'Search'}
          </button>
        </div>

        {msg && (
          <div className={msgType === 'success' ? 'success-msg' : msgType === 'error' ? 'error-msg' : 'info-msg'}>
            {msg}
          </div>
        )}

        {/* Search Results List */}
        {users.length > 0 && (
          <div className="search-results-section">
            <h3 className="section-label">Search Results</h3>
            <ul className="user-list">
              {users.map((u) => (
                <li key={u.id} className="user-row">
                  <Link to={`/user/${u.id}`} className="user-info">
                    <Avatar src={u.profilePicture} name={u.username} size="md" />
                    <div>
                      <strong className="user-name">{u.username}</strong>
                      <span className="user-email">{u.email}</span>
                    </div>
                  </Link>

                  {u.isFriend ? (
                    <span className="friend-badge">
                      <Check size={16} /> Friends ✓
                    </span>
                  ) : u.requested ? (
                    <button type="button" className="btn btn-subtle btn-sm action-touch-btn" disabled>
                      <Clock size={16} /> Requested
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm action-touch-btn"
                      disabled={busyId === u.id}
                      onClick={() => sendRequest(u.id)}
                    >
                      <UserPlus size={16} />
                      {busyId === u.id ? 'Sending…' : 'Add Friend'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Incoming Friend Requests */}
      {incoming.length > 0 && (
        <section className="card requests-card">
          <div className="card-header">
            <h2>Friend Requests</h2>
            <span className="badge badge-primary">{incoming.length}</span>
          </div>

          <ul className="user-list">
            {incoming.map((r) => (
              <li key={r._id} className="user-row">
                <Link to={`/user/${r.from._id}`} className="user-info">
                  <Avatar src={r.from.profilePicture} name={r.from.username} size="md" />
                  <div>
                    <strong className="user-name">{r.from.username}</strong>
                    <span className="user-email">Wants to connect with you</span>
                  </div>
                </Link>

                <div className="req-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm action-touch-btn"
                    disabled={busyId === r._id}
                    onClick={() => acceptRequest(r._id)}
                  >
                    <UserCheck size={16} /> Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm action-touch-btn"
                    disabled={busyId === r._id}
                    onClick={() => rejectRequest(r._id)}
                  >
                    <UserX size={16} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended Profiles */}
      <section className="card recommended-card">
        <div className="card-header">
          <h2>Recommended People</h2>
          <Sparkles size={18} color="var(--primary)" />
        </div>

        {loadingRec ? (
          <div>
            <UserSkeleton />
            <UserSkeleton />
          </div>
        ) : recommended.length === 0 ? (
          <p className="muted" style={{ padding: '16px' }}>No recommendations available right now.</p>
        ) : (
          <ul className="user-list">
            {recommended.map((u) => (
              <li key={u.id} className="user-row">
                <Link to={`/user/${u.id}`} className="user-info">
                  <Avatar src={u.profilePicture} name={u.username} size="md" />
                  <div>
                    <strong className="user-name">{u.username}</strong>
                    <span className="user-email">{u.email}</span>
                  </div>
                </Link>

                {u.requested ? (
                  <button type="button" className="btn btn-subtle btn-sm action-touch-btn" disabled>
                    <Clock size={16} /> Requested
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm action-touch-btn"
                    disabled={busyId === u.id}
                    onClick={() => sendRequest(u.id)}
                  >
                    <UserPlus size={16} />
                    {busyId === u.id ? 'Sending…' : 'Add Friend'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

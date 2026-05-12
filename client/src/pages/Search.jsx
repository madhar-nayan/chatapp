import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { mediaUrl } from '../utils/mediaUrl.js';
import './Search.css';

export default function Search() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function search() {
    setMsg('');
    setMsgType('');
    try {
      const { data } = await client.get('/api/users/search', { params: { q } });
      setUsers(data.users);
    } catch {
      setMsgType('error');
      setMsg('Search failed');
    }
  }

  async function loadRequests() {
    try {
      const { data } = await client.get('/api/friends/requests/incoming');
      setIncoming(data.requests);
    } catch {
      /* ignore */
    }
  }

  async function loadRecommended() {
    try {
      const { data } = await client.get('/api/users/recommended');
      setRecommended(data.users);
    } catch {
      /* ignore */
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
      setMsg('Friend request sent');
    } catch (e) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: false } : u)));
      setRecommended((prev) => prev.map((u) => (u.id === userId ? { ...u, requested: false } : u)));
      setMsgType('error');
      setMsg(e.response?.data?.error || 'Could not send request');
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
      setMsg('You are now friends');
    } catch (e) {
      setMsgType('error');
      setMsg(e.response?.data?.error || 'Failed');
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
      <section className="card search-box">
        <h2>Find people</h2>
        <div className="search-row">
          <input
            className="input"
            placeholder="Search by username or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button type="button" className="btn btn-primary" onClick={search}>
            Search
          </button>
        </div>
        {msg ? (
          <p className={msgType === 'success' ? 'success-msg' : msgType === 'error' ? 'error-msg' : 'info-msg'}>
            {msg}
          </p>
        ) : null}
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id} className="user-row">
              <Link to={`/user/${u.id}`} className="user-main">
                {u.profilePicture ? (
                  <img src={mediaUrl(u.profilePicture)} alt="" className="user-av" />
                ) : (
                  <span className="user-av placeholder" />
                )}
                <div>
                  <strong>{u.username}</strong>
                  <div className="muted small">{u.email}</div>
                </div>
              </Link>
              {u.isFriend ? (
                <span className="muted">Friends</span>
              ) : u.requested ? (
                <button type="button" className="btn btn-ghost btn-sm" disabled>
                  Requested
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busyId === u.id}
                  onClick={() => sendRequest(u.id)}
                >
                  {busyId === u.id ? 'Sending…' : 'Add friend'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card recommended-box">
        <h2>Recommended profiles</h2>
        {recommended.length === 0 ? (
          <p className="muted">No recommendations available right now.</p>
        ) : (
          <ul className="user-list">
            {recommended.map((u) => (
              <li key={u.id} className="user-row">
                <Link to={`/user/${u.id}`} className="user-main">
                  {u.profilePicture ? (
                    <img src={mediaUrl(u.profilePicture)} alt="" className="user-av" />
                  ) : (
                    <span className="user-av placeholder" />
                  )}
                  <div>
                    <strong>{u.username}</strong>
                    <div className="muted small">{u.email}</div>
                  </div>
                </Link>
                {u.requested ? (
                  <button type="button" className="btn btn-ghost btn-sm" disabled>
                    Requested
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === u.id}
                    onClick={() => sendRequest(u.id)}
                  >
                    {busyId === u.id ? 'Sending…' : 'Add friend'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card requests-box">
        <h2>Friend requests</h2>
        {incoming.length === 0 ? (
          <p className="muted">No pending requests</p>
        ) : (
          <ul className="user-list">
            {incoming.map((r) => (
              <li key={r._id} className="user-row">
                <Link to={`/user/${r.from._id}`} className="user-main">
                  {r.from.profilePicture ? (
                    <img src={mediaUrl(r.from.profilePicture)} alt="" className="user-av" />
                  ) : (
                    <span className="user-av placeholder" />
                  )}
                  <strong>{r.from.username}</strong>
                </Link>
                <div className="req-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === r._id}
                    onClick={() => acceptRequest(r._id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === r._id}
                    onClick={() => rejectRequest(r._id)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

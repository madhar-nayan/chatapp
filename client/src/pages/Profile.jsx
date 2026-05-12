import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mediaUrl } from '../utils/mediaUrl.js';
import './Profile.css';

export default function Profile({ self }) {
  const { user: me, refreshUser } = useAuth();
  const { id } = useParams();
  const userId = self ? me?._id : id;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [pictureFile, setPictureFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const { data } = await client.get(`/api/users/${userId}`);
        if (!cancelled) setProfile(data.user);
      } catch {
        if (!cancelled) setError('Profile not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setPictureFile(null);
  }, [profile]);

  useEffect(() => {
    if (self) refreshUser?.();
  }, [self, refreshUser]);

  const handleFileChange = (event) => {
    setPictureFile(event.target.files?.[0] ?? null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setPictureFile(null);
    }
    setError('');
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('bio', bio.trim());
      if (pictureFile) {
        formData.append('profilePicture', pictureFile);
      }

      await client.patch('/api/auth/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (self) {
        await refreshUser?.();
      }

      const { data } = await client.get(`/api/users/${userId}`);
      setProfile(data.user);
      setEditing(false);
      setPictureFile(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="muted container">Loading…</p>;
  if (error && !profile) return <p className="error-msg container">{error || 'Not found'}</p>;

  const pic = mediaUrl(profile.profilePicture);

  return (
    <div className="profile-page container">
      <div className="profile-header card">
        {pic ? <img className="profile-avatar" src={pic} alt="" /> : <div className="profile-avatar placeholder" />}
        <div className="profile-main">
          {editing ? (
            <input
              className="profile-field"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
            />
          ) : (
            <h1 className="profile-name">{profile.username}</h1>
          )}

          {editing ? (
            <textarea
              className="profile-textarea"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Add a short bio"
              rows={4}
            />
          ) : profile.bio ? (
            <p className="profile-bio">{profile.bio}</p>
          ) : (
            <p className="muted">No bio yet — add one to personalize your profile.</p>
          )}

          <p className="muted">{profile.friendsCount} friends</p>
          {profile.isSelf ? (
            <p className="muted">{profile.email}</p>
          ) : profile.isFriend ? (
            <p className="muted">You are friends</p>
          ) : (
            <p className="muted">Not friends — send a request from Search</p>
          )}

          {profile.isSelf ? (
            <div className="profile-actions">
              {editing ? (
                <>
                  <label className="profile-upload">
                    <span>{pictureFile ? pictureFile.name : 'Choose profile picture'}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <div className="profile-edit-buttons">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="btn btn-primary btn-sm profile-edit" onClick={() => setEditing(true)}>
                  Edit profile
                </button>
              )}
            </div>
          ) : profile.isFriend ? (
            <Link to={`/chat/${profile.id}`} className="btn btn-primary btn-sm profile-msg">
              Message
            </Link>
          ) : null}

          {editing && error ? <p className="error-msg">{error}</p> : null}
        </div>
      </div>

      {(profile.isFriend || profile.isSelf) && profile.friends?.length > 0 ? (
        <section className="friends-section">
          <h2>Friends</h2>
          <ul className="friends-grid">
            {profile.friends.map((f) => (
              <li key={f._id}>
                <Link to={`/user/${f._id}`} className="friend-chip">
                  {f.profilePicture ? (
                    <img src={mediaUrl(f.profilePicture)} alt="" />
                  ) : (
                    <span className="friend-placeholder" />
                  )}
                  <span>{f.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

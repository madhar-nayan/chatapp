import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit3, MessageSquare, Camera, Check, X, Users, Mail, Sparkles } from 'lucide-react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
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
  const [picturePreview, setPicturePreview] = useState(null);
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
        if (!cancelled) setError('Profile not found.');
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
    setPicturePreview(null);
  }, [profile]);

  useEffect(() => {
    if (self) refreshUser?.();
  }, [self, refreshUser]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setPictureFile(selected);
    if (selected) {
      setPicturePreview(URL.createObjectURL(selected));
    } else {
      setPicturePreview(null);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setPictureFile(null);
      setPicturePreview(null);
    }
    setError('');
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username is required.');
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
      setPicturePreview(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page container">
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <Skeleton style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }} />
          <Skeleton style={{ width: '160px', height: '24px', margin: '0 auto 8px' }} />
          <Skeleton style={{ width: '220px', height: '16px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page container">
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p className="error-msg" style={{ justifyContent: 'center' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page container">
      {/* Profile Header Card */}
      <div className="profile-header-card card animate-fade-in">
        <div className="profile-cover-banner" />

        <div className="profile-header-content">
          {/* Avatar Area */}
          <div className="profile-avatar-container">
            <Avatar
              src={picturePreview || profile.profilePicture}
              name={profile.username}
              size="xxl"
              showBorder
            />
            {editing && (
              <label className="profile-avatar-overlay" title="Change picture">
                <Camera size={24} color="#FFFFFF" />
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* User Information & Editing */}
          <div className="profile-details">
            {editing ? (
              <div className="profile-edit-form">
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Bio</label>
                  <textarea
                    className="input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell friends about yourself…"
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="edit-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Check size={16} />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="profile-name">@{profile.username}</h1>
                
                {profile.bio ? (
                  <p className="profile-bio-text">{profile.bio}</p>
                ) : (
                  <p className="profile-bio-placeholder muted">No bio added yet.</p>
                )}

                {/* Stats Row */}
                <div className="profile-stats-row">
                  <div className="stat-pill">
                    <Users size={16} color="var(--primary)" />
                    <strong>{profile.friendsCount || 0}</strong>
                    <span>Friends</span>
                  </div>

                  {profile.isSelf && (
                    <div className="stat-pill">
                      <Mail size={16} color="var(--secondary)" />
                      <span className="email-text">{profile.email}</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="profile-action-buttons">
                  {profile.isSelf ? (
                    <button
                      type="button"
                      className="btn btn-primary edit-profile-btn"
                      onClick={() => setEditing(true)}
                    >
                      <Edit3 size={18} />
                      <span>Edit Profile</span>
                    </button>
                  ) : profile.isFriend ? (
                    <Link to={`/chat/${profile.id}`} className="btn btn-primary message-friend-btn">
                      <MessageSquare size={18} />
                      <span>Message</span>
                    </Link>
                  ) : (
                    <Link to="/search" className="btn btn-secondary">
                      <Sparkles size={18} />
                      <span>Add Friend in Search</span>
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Friends Grid Section */}
      {(profile.isFriend || profile.isSelf) && profile.friends?.length > 0 && (
        <section className="friends-section-card card">
          <div className="section-header">
            <h2>Friends</h2>
            <span className="badge badge-primary">{profile.friends.length}</span>
          </div>

          <div className="friends-chips-grid">
            {profile.friends.map((f) => (
              <Link key={f._id} to={`/user/${f._id}`} className="friend-card-chip">
                <Avatar src={f.profilePicture} name={f.username} size="md" />
                <span className="friend-chip-name">{f.username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

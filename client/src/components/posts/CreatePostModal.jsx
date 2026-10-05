import { useState, useEffect } from 'react';
import { Image, Video, X, Send, Sparkles } from 'lucide-react';
import client from '../../api/client.js';
import Avatar from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setMediaType(null);
      return;
    }
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaType(type);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const resetForm = () => {
    setCaption('');
    setFile(null);
    setPreview(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a photo or video to share.');
      return;
    }

    setPosting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('media', file);
      fd.append('caption', caption);

      const { data } = await client.post('/api/posts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onPostCreated(data.post);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar src={user?.profilePicture} name={user?.username} size="md" />
        <div>
          <strong style={{ fontSize: '0.95rem', display: 'block' }}>{user?.username}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sharing to Feed</span>
        </div>
      </div>

      <textarea
        className="input"
        rows={3}
        placeholder="What's on your mind?"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{
          resize: 'none',
          backgroundColor: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          fontSize: '0.95rem',
        }}
      />

      {preview ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: '#000',
            maxHeight: '260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mediaType === 'video' ? (
            <video src={preview} controls style={{ maxHeight: '260px', width: '100%', objectFit: 'contain' }} />
          ) : (
            <img src={preview} alt="Preview" style={{ maxHeight: '260px', width: '100%', objectFit: 'contain' }} />
          )}
          <button
            type="button"
            className="btn btn-danger btn-sm btn-icon-only"
            onClick={() => setFile(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px 16px',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            backgroundColor: 'var(--surface-hover)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
              Select Photo or Video
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PNG, JPG, MP4 supported</span>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={posting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={posting || !file}>
          {posting ? 'Publishing…' : 'Share Post'}
        </button>
      </div>
    </form>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '520px',
          borderBottomLeftRadius: isMobile ? 0 : 'var(--radius-xl)',
          borderBottomRightRadius: isMobile ? 0 : 'var(--radius-xl)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          padding: '20px',
          backgroundColor: 'var(--surface)',
          animation: isMobile ? 'slideUp 0.3s ease-out' : 'fadeIn 0.2s ease-out',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Post</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

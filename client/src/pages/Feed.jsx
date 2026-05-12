import { useEffect, useState } from 'react';
import client from '../api/client.js';
import PostCard from '../components/PostCard.jsx';
import './Feed.css';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    setError('');
    try {
      const { data } = await client.get('/api/posts/feed');
      setPosts(data.posts);
    } catch {
      setError('Could not load feed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function replacePost(updated) {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a photo or video');
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
      setPosts((prev) => [data.post, ...prev]);
      setCaption('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <p className="muted container">Loading feed…</p>;
  }

  return (
    <div className="feed container">
      <section className="create-post card">
        <h2 className="create-title">New post</h2>
        <form onSubmit={handleCreate} className="create-form">
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
            Photo or video
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <textarea
            className="input"
            rows={2}
            placeholder="Write a caption…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {error ? <p className="error-msg">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={posting}>
            {posting ? 'Sharing…' : 'Share'}
          </button>
        </form>
      </section>

      {posts.length === 0 ? (
        <p className="muted empty-feed">
          No posts yet. Add friends to see their posts, or share your first photo.
        </p>
      ) : (
        posts.map((p) => <PostCard key={p._id} post={p} onUpdate={replacePost} />)
      )}
    </div>
  );
}

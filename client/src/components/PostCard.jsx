import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl.js';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './PostCard.css';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const authorId = post.author?._id || post.author;
  const myId = user?._id?.toString?.() || user?._id;
  const liked = post.likes?.some((l) => {
    const id = (l._id ?? l)?.toString?.() ?? l;
    return id === myId;
  });

  async function toggleLike() {
    setBusy(true);
    try {
      const { data } = await client.post(`/api/posts/${post._id}/like`);
      onUpdate?.(data.post);
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const { data } = await client.post(`/api/posts/${post._id}/comment`, { text: comment });
      onUpdate?.(data.post);
      setComment('');
    } finally {
      setBusy(false);
    }
  }

  async function sharePost() {
    setBusy(true);
    try {
      const { data } = await client.post(`/api/posts/${post._id}/share`);
      onUpdate?.(data.post);
    } finally {
      setBusy(false);
    }
  }

  const src = mediaUrl(post.mediaUrl);

  return (
    <article className="post-card card">
      <header className="post-head">
        <Link to={`/user/${authorId}`} className="post-author">
          {post.author?.profilePicture ? (
            <img src={mediaUrl(post.author.profilePicture)} alt="" className="post-avatar" />
          ) : (
            <span className="post-avatar placeholder" />
          )}
          <span>{post.author?.username || 'User'}</span>
        </Link>
      </header>
      <div className="post-media-wrap">
        {post.mediaType === 'video' ? (
          <video className="post-media" src={src} controls playsInline />
        ) : (
          <img className="post-media" src={src} alt="" />
        )}
      </div>
      <div className="post-body">
        <div className="post-actions">
          <button type="button" className={`action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} disabled={busy}>
            {liked ? '♥ Liked' : '♡ Like'}
          </button>
          <button type="button" className="action-btn" onClick={sharePost} disabled={busy}>
            ↗ Share
          </button>
        </div>
        <p className="post-stats muted">
          {post.likes?.length || 0} likes · {post.comments?.length || 0} comments · {post.shares || 0} shares
        </p>
        {post.caption ? (
          <p>
            <Link to={`/user/${authorId}`} className="post-caption-user">
              {post.author?.username}
            </Link>{' '}
            {post.caption}
          </p>
        ) : null}
        <ul className="comment-list">
          {(post.comments || []).map((c) => (
            <li key={c._id}>
              <Link to={`/user/${c.user?._id || c.user}`}>{c.user?.username}</Link>: {c.text}
            </li>
          ))}
        </ul>
        <form onSubmit={submitComment} className="comment-form">
          <input
            className="input"
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            Post
          </button>
        </form>
      </div>
    </article>
  );
}

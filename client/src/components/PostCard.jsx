import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { mediaUrl } from '../utils/mediaUrl.js';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './common/Avatar.jsx';
import './PostCard.css';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [isLikedAnimation, setIsLikedAnimation] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const authorId = post.author?._id || post.author;
  const myId = user?._id?.toString?.() || user?._id;
  const liked = post.likes?.some((l) => {
    const id = (l._id ?? l)?.toString?.() ?? l;
    return id === myId;
  });

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    setIsLikedAnimation(!liked);
    try {
      const { data } = await client.post(`/api/posts/${post._id}/like`);
      onUpdate?.(data.post);
    } catch {
      setIsLikedAnimation(liked);
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim() || busy) return;
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
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await client.post(`/api/posts/${post._id}/share`);
      onUpdate?.(data.post);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  const src = mediaUrl(post.mediaUrl);
  const timeFormatted = post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  }) : 'Just now';

  return (
    <article className="post-card card animate-fade-in">
      {/* Post Header */}
      <header className="post-head">
        <Link to={`/user/${authorId}`} className="post-author-info">
          <Avatar
            src={post.author?.profilePicture}
            name={post.author?.username || 'User'}
            size="md"
          />
          <div className="post-meta">
            <strong className="post-author-name">{post.author?.username || 'User'}</strong>
            <span className="post-timestamp">{timeFormatted}</span>
          </div>
        </Link>
        <button type="button" className="btn btn-ghost btn-sm btn-icon-only post-options" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </header>

      {/* Caption if before media */}
      {post.caption ? (
        <div className="post-caption">
          <p>
            <Link to={`/user/${authorId}`} className="caption-username">
              {post.author?.username}
            </Link>{' '}
            {post.caption}
          </p>
        </div>
      ) : null}

      {/* Media Content Container */}
      <div className="post-media-wrap">
        {post.mediaType === 'video' ? (
          <video className="post-media" src={src} controls playsInline preload="metadata" />
        ) : (
          <img className="post-media" src={src} alt="Post content" loading="lazy" />
        )}
      </div>

      {/* Post Body & Actions */}
      <div className="post-body">
        {/* Action Buttons */}
        <div className="post-actions">
          <button
            type="button"
            className={`action-btn like-btn ${liked ? 'liked' : ''} ${isLikedAnimation ? 'animate-heart' : ''}`}
            onClick={toggleLike}
            disabled={busy}
            aria-label={liked ? 'Unlike post' : 'Like post'}
          >
            <Heart size={22} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : 'currentColor'} />
            <span className="action-count">{post.likes?.length || 0}</span>
          </button>

          <button type="button" className="action-btn comment-trigger-btn" aria-label="Comments">
            <MessageCircle size={22} />
            <span className="action-count">{post.comments?.length || 0}</span>
          </button>

          <button
            type="button"
            className="action-btn share-btn"
            onClick={sharePost}
            disabled={busy}
            aria-label="Share post"
          >
            <Share2 size={20} />
            <span className="action-count">{post.shares || 0}</span>
          </button>

          {copiedShare && <span className="share-toast">Shared & copied!</span>}
        </div>

        {/* Comment List */}
        {(post.comments || []).length > 0 && (
          <div className="post-comments-container">
            <ul className="comment-list">
              {post.comments.slice(-3).map((c) => (
                <li key={c._id} className="comment-item">
                  <Link to={`/user/${c.user?._id || c.user}`} className="comment-user">
                    {c.user?.username || 'User'}
                  </Link>
                  <span className="comment-text">{c.text}</span>
                </li>
              ))}
            </ul>
            {post.comments.length > 3 && (
              <span className="view-more-comments muted small">
                View all {post.comments.length} comments
              </span>
            )}
          </div>
        )}

        {/* Add Comment Input */}
        <form onSubmit={submitComment} className="comment-form">
          <input
            className="input comment-input"
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm comment-submit-btn"
            disabled={busy || !comment.trim()}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </article>
  );
}

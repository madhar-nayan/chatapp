import { useEffect, useState, useCallback } from 'react';
import { Image, Video, Sparkles } from 'lucide-react';
import client from '../api/client.js';
import PostCard from '../components/PostCard.jsx';
import StoryBar from '../components/posts/StoryBar.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { PostSkeleton } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import CreatePostModal from '../components/posts/CreatePostModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Feed.css';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadFeed = useCallback(async () => {
    setError('');
    try {
      const { data } = await client.get('/api/posts/feed');
      setPosts(data.posts || []);
    } catch {
      setError('Could not load feed posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const handleRefresh = () => loadFeed();
    window.addEventListener('post-created', handleRefresh);
    return () => window.removeEventListener('post-created', handleRefresh);
  }, [loadFeed]);

  function replacePost(updated) {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  function handlePostCreated(newPost) {
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <div className="feed-page container">
      {/* Horizontal Friends Story Bar */}
      <StoryBar onOpenCreate={() => setIsCreateModalOpen(true)} />

      {/* Create Post Prompt Card */}
      <div className="create-post-trigger-card card" onClick={() => setIsCreateModalOpen(true)}>
        <div className="create-trigger-top">
          <Avatar src={user?.profilePicture} name={user?.username} size="md" />
          <div className="trigger-input-placeholder">
            What&apos;s on your mind, {user?.username}?
          </div>
        </div>

        <div className="create-trigger-actions">
          <button type="button" className="trigger-action-btn">
            <Image size={18} color="#22C55E" />
            <span>Photo</span>
          </button>
          <button type="button" className="trigger-action-btn">
            <Video size={18} color="#EC4899" />
            <span>Video</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm trigger-post-btn">
            <Sparkles size={14} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Feed Posts Section */}
      {error && (
        <div className="card" style={{ padding: '16px', color: 'var(--error)', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No posts yet"
          description="Connect with friends or share your very first photo or video with your feed!"
          actionLabel="Create Post"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="posts-list">
          {posts.map((p) => (
            <PostCard key={p._id} post={p} onUpdate={replacePost} />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

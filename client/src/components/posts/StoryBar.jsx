import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Avatar from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import client from '../../api/client.js';

export default function StoryBar({ onOpenCreate }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    async function loadFriends() {
      try {
        const { data } = await client.get('/api/friends/list');
        setFriends(data.friends || []);
      } catch {
        /* ignore */
      }
    }
    loadFriends();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        overflowX: 'auto',
        padding: '12px 16px',
        marginBottom: '20px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Your Story item */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={onOpenCreate}
      >
        <div style={{ position: 'relative' }}>
          <Avatar src={user?.profilePicture} name={user?.username} size="lg" />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface)',
            }}
          >
            <Plus size={12} strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Your Story</span>
      </div>

      {/* Friends Stories */}
      {friends.map((f) => (
        <div
          key={f._id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Avatar
            src={f.profilePicture}
            name={f.username}
            size="lg"
            showBorder
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              maxWidth: '64px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {f.username}
          </span>
        </div>
      ))}
    </div>
  );
}

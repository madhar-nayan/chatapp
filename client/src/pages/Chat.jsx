import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Video, Send, Search, Phone, MoreVertical, Trash2, Copy, CheckCheck } from 'lucide-react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import Avatar from '../components/common/Avatar.jsx';
import VideoCall from '../components/VideoCall.jsx';
import { UserSkeleton } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import './Chat.css';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const bottomRef = useRef(null);
  const menuRef = useRef(null);
  const touchTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  const myId = me?._id?.toString?.() ?? me?._id;

  // Load friends list
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/friends/list');
        setFriends(data.friends || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch messages for selected thread
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/api/messages/${userId}`);
        if (!cancelled) setMessages(data.messages || []);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Socket listener for real-time private messages
  useEffect(() => {
    if (!socket || !userId) return undefined;

    const onMsg = (msg) => {
      const other = userId;
      const s = msg.sender?._id ?? msg.sender;
      const r = msg.recipient?._id ?? msg.recipient;
      const sid = s?.toString?.() ?? s;
      const rid = r?.toString?.() ?? r;
      if ((sid === myId && rid === other) || (sid === other && rid === myId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('private_message', onMsg);
    return () => socket.off('private_message', onMsg);
  }, [socket, userId, myId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebRTC incoming call listener
  useEffect(() => {
    if (!socket) return undefined;

    const onOffer = ({ from, offer }) => {
      if (from === myId) return;
      const f = friends.find((x) => (x._id?.toString?.() ?? x._id) === from);
      setIncoming({ from, offer, label: f?.username || 'Friend' });
    };

    socket.on('call:offer', onOffer);
    return () => socket.off('call:offer', onOffer);
  }, [socket, friends, myId]);

  // Context menu & Touch handlers for message bubbles
  function closeMessageMenu() {
    setMessageMenu(null);
    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }

  function getMenuPosition(x, y) {
    const offset = 12;
    const menuWidth = 180;
    const menuHeight = 100;
    return {
      x: Math.min(Math.max(offset, x), window.innerWidth - menuWidth - offset),
      y: Math.min(Math.max(offset, y), window.innerHeight - menuHeight - offset),
    };
  }

  function openMessageMenu(message, x, y) {
    const senderId = (message.sender?._id ?? message.sender)?.toString?.() ?? message.sender;
    const pos = getMenuPosition(x, y);
    setMessageMenu({
      id: message._id,
      text: message.text,
      mine: senderId === myId,
      x: pos.x,
      y: pos.y,
    });
  }

  function handleContextMenu(e, message) {
    e.preventDefault();
    openMessageMenu(message, e.clientX, e.clientY);
  }

  function handleTouchStart(e, message) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    touchTimerRef.current = window.setTimeout(() => {
      openMessageMenu(message, touch.clientX, touch.clientY);
      touchTimerRef.current = null;
    }, 500);
  }

  function handleTouchMove(e) {
    if (!touchTimerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (deltaX > 10 || deltaY > 10) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }

  function handleTouchEnd() {
    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }

  async function handleDeleteMessage() {
    if (!messageMenu) return;
    const messageId = messageMenu.id;
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
    closeMessageMenu();

    try {
      await client.delete(`/api/messages/${messageId}`);
    } catch (err) {
      console.error('Delete message failed', err);
    }
  }

  async function handleCopyMessage() {
    if (!messageMenu) return;
    try {
      await navigator.clipboard.writeText(messageMenu.text || '');
    } catch (err) {
      console.error('Copy failed', err);
    } finally {
      closeMessageMenu();
    }
  }

  useEffect(() => {
    if (!messageMenu) return undefined;
    function handleOutsideClick(event) {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      closeMessageMenu();
    }

    function handleEscape(event) {
      if (event.key === 'Escape') closeMessageMenu();
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [messageMenu]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !userId || !socket) return;
    socket.emit('private_message', { to: userId, text: text.trim() }, () => {});
    setText('');
  }

  const activeFriend = friends.find((f) => (f._id?.toString?.() ?? f._id) === userId);
  const filteredFriends = friends.filter((f) =>
    f.username?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="chat-app-wrapper container">
      {/* WebRTC Call Banner & Call Window */}
      {incoming && !activeCall ? (
        <div className="incoming-banner card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone className="animate-pulse" size={20} color="var(--primary)" />
            <span>Incoming video call from <strong>{incoming.label}</strong></span>
          </div>
          <div className="incoming-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setActiveCall({
                  peerId: incoming.from,
                  label: incoming.label,
                  isCaller: false,
                  offer: incoming.offer,
                });
                setIncoming(null);
                navigate(`/chat/${incoming.from}`);
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                socket?.emit('call:end', { to: incoming.from });
                setIncoming(null);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}

      {activeCall && socket ? (
        <VideoCall
          socket={socket}
          peerId={activeCall.peerId}
          peerLabel={activeCall.label}
          isCaller={activeCall.isCaller}
          remoteOffer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      ) : null}

      <div className={`chat-layout-container ${userId ? 'has-active-chat' : 'no-active-chat'}`}>
        {/* LEFT COLUMN: Sidebar Conversation List */}
        <aside className="chat-sidebar-card card">
          <div className="chat-sidebar-header">
            <h2 className="chat-title">Messages</h2>
            <div className="chat-search-box">
              <Search size={16} className="search-box-icon" />
              <input
                className="input search-box-input"
                placeholder="Search chats…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-friends-scroll">
            {loading ? (
              <div style={{ padding: '8px' }}>
                <UserSkeleton />
                <UserSkeleton />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p className="muted small">No conversations found. Add friends from Search to start chatting!</p>
              </div>
            ) : (
              <ul className="chat-friends-list">
                {filteredFriends.map((f) => {
                  const id = f._id?.toString?.() ?? f._id;
                  const isActive = id === userId;
                  return (
                    <li key={id}>
                      <Link
                        to={`/chat/${id}`}
                        className={`chat-friend-item ${isActive ? 'active' : ''}`}
                      >
                        <Avatar src={f.profilePicture} name={f.username} size="md" isOnline />
                        <div className="friend-item-info">
                          <div className="friend-item-top">
                            <strong className="friend-item-name">{f.username}</strong>
                          </div>
                          <span className="friend-item-preview muted small">Tap to message</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Active Chat Thread */}
        <section className="chat-main-card card">
          {!userId ? (
            <div className="no-chat-selected">
              <EmptyState
                icon={Video}
                title="Your Messages"
                description="Select a conversation from the sidebar or find a friend to start chatting."
              />
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <header className="chat-thread-header">
                <div className="thread-header-left">
                  {/* Mobile back button */}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-icon-only mobile-chat-back"
                    onClick={() => navigate('/chat')}
                    aria-label="Back to chat list"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <Link to={`/user/${userId}`} className="thread-user-info">
                    <Avatar src={activeFriend?.profilePicture} name={activeFriend?.username} size="md" isOnline />
                    <div>
                      <strong className="thread-user-name">{activeFriend?.username || 'Chat'}</strong>
                      <span className="thread-user-status">Online · Active now</span>
                    </div>
                  </Link>
                </div>

                <div className="thread-header-actions">
                  {activeFriend && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm video-call-btn"
                      onClick={() =>
                        setActiveCall({
                          peerId: userId,
                          label: activeFriend.username,
                          isCaller: true,
                          offer: null,
                        })
                      }
                      title="Start video call"
                    >
                      <Video size={18} />
                      <span className="desktop-only-text">Call</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm btn-icon-only">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </header>

              {/* Message Scroll View */}
              <div className="chat-scroll-area">
                {messages.length === 0 ? (
                  <div className="empty-thread-notice">
                    <p className="muted small">Say hello to {activeFriend?.username || 'your friend'} 👋</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const sid = (m.sender?._id ?? m.sender)?.toString?.() ?? m.sender;
                    const mine = sid === myId;
                    return (
                      <div
                        key={m._id}
                        className={`bubble-wrapper ${mine ? 'mine' : 'other'}`}
                        onContextMenu={(e) => handleContextMenu(e, m)}
                        onTouchStart={(e) => handleTouchStart(e, m)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      >
                        <div className={`chat-bubble ${mine ? 'mine' : 'other'}`}>
                          <span className="bubble-text">{m.text}</span>
                          <div className="bubble-footer">
                            <span className="bubble-time">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {mine && <CheckCheck size={14} className="bubble-check" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Context Menu Popup */}
              {messageMenu && (
                <div
                  ref={menuRef}
                  className="message-context-menu"
                  style={{ top: messageMenu.y, left: messageMenu.x }}
                >
                  {messageMenu.mine && (
                    <button type="button" className="menu-action-item danger" onClick={handleDeleteMessage}>
                      <Trash2 size={16} /> Delete Message
                    </button>
                  )}
                  <button type="button" className="menu-action-item" onClick={handleCopyMessage}>
                    <Copy size={16} /> Copy Text
                  </button>
                </div>
              )}

              {/* Composer Input Bar */}
              <form className="chat-composer-bar" onSubmit={sendMessage}>
                <input
                  className="input chat-composer-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-icon-only composer-send-btn"
                  disabled={!text.trim()}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

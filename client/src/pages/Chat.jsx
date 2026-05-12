import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { mediaUrl } from '../utils/mediaUrl.js';
import VideoCall from '../components/VideoCall.jsx';
import './Chat.css';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const bottomRef = useRef(null);
  const menuRef = useRef(null);
  const touchTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  const myId = me?._id?.toString?.() ?? me?._id;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/friends/list');
        setFriends(data.friends);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/api/messages/${userId}`);
        if (!cancelled) setMessages(data.messages);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!socket || !userId) return undefined;

    const onMsg = (msg) => {
      const other = userId;
      const s = msg.sender?._id ?? msg.sender;
      const r = msg.recipient?._id ?? msg.recipient;
      const sid = s?.toString?.() ?? s;
      const rid = r?.toString?.() ?? r;
      if (
        (sid === myId && rid === other) ||
        (sid === other && rid === myId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('private_message', onMsg);
    return () => socket.off('private_message', onMsg);
  }, [socket, userId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (loading) {
    return <p className="muted container">Loading…</p>;
  }

  return (
    <div className="chat-page container">
      {incoming && !activeCall ? (
        <div className="incoming-banner card">
          <p>
            Incoming video call from <strong>{incoming.label}</strong>
          </p>
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
              className="btn btn-ghost btn-sm"
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

      <div className="chat-layout">
        <aside className="chat-sidebar card">
          <h2>Messages</h2>
          <ul className="chat-friends">
            {friends.length === 0 ? (
              <li className="muted">Add friends in Search to start chatting.</li>
            ) : (
              friends.map((f) => {
                const id = f._id?.toString?.() ?? f._id;
                return (
                  <li key={id}>
                    <Link
                      to={`/chat/${id}`}
                      className={id === userId ? 'chat-friend active' : 'chat-friend'}
                    >
                      {f.profilePicture ? (
                        <img src={mediaUrl(f.profilePicture)} alt="" className="cf-av" />
                      ) : (
                        <span className="cf-av placeholder" />
                      )}
                      {f.username}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="chat-main card">
          {!userId ? (
            <p className="muted chat-placeholder">Select a friend to view messages.</p>
          ) : (
            <>
              <header className="chat-thread-head">
                <div>
                  <strong>{activeFriend?.username || 'Chat'}</strong>
                  <p className="muted small">Friends only · Real-time</p>
                </div>
                {activeFriend ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      setActiveCall({
                        peerId: userId,
                        label: activeFriend.username,
                        isCaller: true,
                        offer: null,
                      })
                    }
                  >
                    Video call
                  </button>
                ) : null}
              </header>
              <div className="chat-scroll">
                {messages.map((m) => {
                  const sid = (m.sender?._id ?? m.sender)?.toString?.() ?? m.sender;
                  const mine = sid === myId;
                  return (
                    <div
                      key={m._id}
                      className={mine ? 'bubble mine' : 'bubble'}
                      onContextMenu={(e) => handleContextMenu(e, m)}
                      onTouchStart={(e) => handleTouchStart(e, m)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                    >
                      <span className="bubble-text">{m.text}</span>
                      <span className="bubble-time muted small">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              {messageMenu ? (
                <div
                  ref={menuRef}
                  className="message-menu"
                  style={{ top: messageMenu.y, left: messageMenu.x }}
                >
                  {messageMenu.mine ? (
                    <button type="button" className="menu-item" onClick={handleDeleteMessage}>
                      Delete message
                    </button>
                  ) : null}
                  <button type="button" className="menu-item" onClick={handleCopyMessage}>
                    Copy message
                  </button>
                </div>
              ) : null}
              <form className="chat-compose" onSubmit={sendMessage}>
                <input
                  className="input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Message…"
                />
                <button type="submit" className="btn btn-primary">
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

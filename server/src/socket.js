import jwt from 'jsonwebtoken';
import Message from './models/Message.js';
import User from './models/User.js';

const userSockets = new Map();

function roomForUser(userId) {
  return `user:${userId}`;
}

async function areFriends(a, b) {
  const u = await User.findById(a).select('friends');
  return u?.friends.some((id) => id.equals(b));
}

export function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
    socket.join(roomForUser(uid));

    socket.on('private_message', async ({ to, text }, cb) => {
      try {
        const trimmed = (text || '').trim();
        if (!to || !trimmed) {
          cb?.({ error: 'Invalid message' });
          return;
        }
        const ok = await areFriends(uid, to);
        if (!ok) {
          cb?.({ error: 'Not friends' });
          return;
        }
        const msg = await Message.create({
          sender: uid,
          recipient: to,
          text: trimmed,
        });
        const populated = await Message.findById(msg._id)
          .populate('sender', 'username profilePicture')
          .populate('recipient', 'username profilePicture');
        io.to(roomForUser(to)).emit('private_message', populated);
        socket.emit('private_message', populated);
        cb?.({ ok: true, message: populated });
      } catch (e) {
        console.error(e);
        cb?.({ error: 'Send failed' });
      }
    });

    socket.on('call:offer', async ({ to, offer }) => {
      if (!to || !offer) return;
      if (!(await areFriends(uid, to))) return;
      io.to(roomForUser(to)).emit('call:offer', { from: uid, offer });
    });

    socket.on('call:answer', async ({ to, answer }) => {
      if (!to || !answer) return;
      if (!(await areFriends(uid, to))) return;
      io.to(roomForUser(to)).emit('call:answer', { from: uid, answer });
    });

    socket.on('call:ice', async ({ to, candidate }) => {
      if (!to || !candidate) return;
      if (!(await areFriends(uid, to))) return;
      io.to(roomForUser(to)).emit('call:ice', { from: uid, candidate });
    });

    socket.on('call:end', async ({ to }) => {
      if (!to) return;
      if (!(await areFriends(uid, to))) return;
      io.to(roomForUser(to)).emit('call:end', { from: uid });
    });

    socket.on('disconnect', () => {
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(uid);
      }
    });
  });
}

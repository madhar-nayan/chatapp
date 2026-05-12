import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

async function ensureFriends(meId, otherId) {
  const me = await User.findById(meId).select('friends');
  if (!me) return false;
  return me.friends.some((id) => id.equals(otherId));
}

router.get('/:userId', authRequired, attachUser, async (req, res) => {
  try {
    const otherId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      return res.status(400).json({ error: 'Invalid user' });
    }
    const ok = await ensureFriends(req.userId, otherId);
    if (!ok) {
      return res.status(403).json({ error: 'You can only message friends' });
    }
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherId },
        { sender: otherId, recipient: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');
    res.json({ messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.delete('/:messageId', authRequired, attachUser, async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message id' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.sender.equals(req.userId)) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await message.deleteOne();
    res.json({ ok: true, deletedId: messageId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

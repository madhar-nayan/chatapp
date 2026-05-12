import express from 'express';
import Notification from '../models/Notification.js';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('fromUser', 'username profilePicture')
      .populate('post', 'caption mediaUrl mediaType')
      .populate('friendRequest');
    res.json({ notifications: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.post('/:id/read', authRequired, attachUser, async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, recipient: req.userId });
    if (!n) return res.status(404).json({ error: 'Not found' });
    n.read = true;
    await n.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/read-all', authRequired, attachUser, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;

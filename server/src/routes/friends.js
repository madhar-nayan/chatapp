import express from 'express';
import mongoose from 'mongoose';
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

function areFriends(user, otherId) {
  return user.friends.some((id) => id.equals(otherId));
}

router.post('/request/:userId', authRequired, attachUser, async (req, res) => {
  try {
    const toId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(toId)) {
      return res.status(400).json({ error: 'Invalid user' });
    }
    if (toId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }
    const target = await User.findById(toId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (areFriends(req.user, target._id)) {
      return res.status(400).json({ error: 'Already friends' });
    }
    const reversePending = await FriendRequest.findOne({
      from: toId,
      to: req.userId,
      status: 'pending',
    });
    if (reversePending) {
      return res.status(409).json({ error: 'This user already sent you a request — check notifications' });
    }
    let fr = await FriendRequest.findOne({ from: req.userId, to: toId });
    if (fr) {
      if (fr.status === 'pending') {
        return res.status(409).json({ error: 'Friend request already pending' });
      }
      if (fr.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      fr.status = 'pending';
      await fr.save();
    } else {
      fr = await FriendRequest.create({ from: req.userId, to: toId, status: 'pending' });
    }
    await Notification.create({
      recipient: target._id,
      type: 'friend_request',
      fromUser: req.userId,
      friendRequest: fr._id,
    });
    const populated = await FriendRequest.findById(fr._id).populate('from', 'username profilePicture');
    res.status(201).json({ request: populated });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Request already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

router.post('/accept/:requestId', authRequired, attachUser, async (req, res) => {
  try {
    const fr = await FriendRequest.findById(req.params.requestId);
    if (!fr || fr.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (!fr.to.equals(req.userId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    fr.status = 'accepted';
    await fr.save();
    await User.updateOne({ _id: fr.from }, { $addToSet: { friends: fr.to } });
    await User.updateOne({ _id: fr.to }, { $addToSet: { friends: fr.from } });
    await Notification.create({
      recipient: fr.from,
      type: 'friend_accept',
      fromUser: fr.to,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to accept' });
  }
});

router.post('/reject/:requestId', authRequired, attachUser, async (req, res) => {
  try {
    const fr = await FriendRequest.findById(req.params.requestId);
    if (!fr || fr.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (!fr.to.equals(req.userId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    fr.status = 'rejected';
    await fr.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject' });
  }
});

router.get('/requests/incoming', authRequired, attachUser, async (req, res) => {
  try {
    const list = await FriendRequest.find({ to: req.userId, status: 'pending' })
      .populate('from', 'username profilePicture email')
      .sort({ createdAt: -1 });
    res.json({ requests: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

router.get('/list', authRequired, attachUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username profilePicture');
    res.json({ friends: user.friends });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

export default router;

import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', authRequired, attachUser, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ users: [] });
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [{ username: regex }, { email: regex }],
    })
      .select('username email profilePicture friends')
      .limit(20);

    const outgoingRequests = await FriendRequest.find({
      from: req.userId,
      status: 'pending',
      to: { $in: users.map((u) => u._id) },
    }).select('to');
    const requestedIds = new Set(outgoingRequests.map((r) => r.to.toString()));

    res.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        profilePicture: u.profilePicture,
        isFriend: u.friends.some((id) => id.equals(req.userId)),
        requested: requestedIds.has(u._id.toString()),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/recommended', authRequired, attachUser, async (req, res) => {
  try {
    const excludedIds = [req.user._id, ...(req.user.friends || [])];
    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedIds },
        },
      },
      {
        $addFields: {
          friendsCount: { $size: '$friends' },
        },
      },
      {
        $sort: { friendsCount: -1, createdAt: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          username: 1,
          email: 1,
          profilePicture: 1,
          friendsCount: 1,
        },
      },
    ]);

    const outgoingRequests = await FriendRequest.find({
      from: req.userId,
      status: 'pending',
      to: { $in: users.map((u) => u._id) },
    }).select('to');
    const requestedIds = new Set(outgoingRequests.map((r) => r.to.toString()));

    res.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        profilePicture: u.profilePicture,
        friendsCount: u.friendsCount,
        isFriend: false,
        requested: requestedIds.has(u._id.toString()),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load recommendations' });
  }
});

router.get('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email profilePicture bio friends createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isFriend = user.friends.some((id) => id.equals(req.userId));
    const isSelf = user._id.equals(req.userId);
    const friendsList = await User.find({ _id: { $in: user.friends } })
      .select('username profilePicture')
      .limit(100);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: isSelf ? user.email : undefined,
        profilePicture: user.profilePicture,
        bio: user.bio,
        friendsCount: user.friends.length,
        friends: isFriend || isSelf ? friendsList : [],
        isFriend,
        isSelf,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;

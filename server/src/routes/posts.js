import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { uploadPostMedia, publicUploadPath } from '../config/upload.js';

const router = express.Router();

async function createNotification({ recipient, type, fromUser, post, friendRequest }) {
  if (recipient.equals(fromUser)) return;
  await Notification.create({ recipient, type, fromUser, post, friendRequest });
}

router.post('/', authRequired, attachUser, uploadPostMedia.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file required' });
    }
    const mime = req.file.mimetype;
    const mediaType = mime.startsWith('video/') ? 'video' : 'image';
    const mediaUrl = publicUploadPath('posts', req.file.filename);
    const post = await Post.create({
      author: req.userId,
      mediaUrl,
      mediaType,
      caption: (req.body.caption || '').trim(),
    });
    const populated = await Post.findById(post._id).populate('author', 'username profilePicture');
    res.status(201).json({ post: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/feed', authRequired, attachUser, async (req, res) => {
  try {
    const friendIds = [...req.user.friends.map((id) => id.toString()), req.userId.toString()];
    const posts = await Post.find({ author: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    res.json({ posts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

router.post('/:id/like', authRequired, attachUser, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const idx = post.likes.findIndex((id) => id.equals(req.userId));
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(req.userId);
      await createNotification({
        recipient: post.author,
        type: 'like',
        fromUser: req.userId,
        post: post._id,
      });
    }
    await post.save();
    const updated = await Post.findById(post._id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    res.json({ post: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Like failed' });
  }
});

router.post('/:id/comment', authRequired, attachUser, async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ user: req.userId, text });
    await post.save();
    await createNotification({
      recipient: post.author,
      type: 'comment',
      fromUser: req.userId,
      post: post._id,
    });
    const updated = await Post.findById(post._id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    res.json({ post: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Comment failed' });
  }
});

router.post('/:id/share', authRequired, attachUser, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.sharedBy.some((id) => id.equals(req.userId))) {
      post.shares += 1;
      post.sharedBy.push(req.userId);
      await post.save();
      await createNotification({
        recipient: post.author,
        type: 'share',
        fromUser: req.userId,
        post: post._id,
      });
    }
    const updated = await Post.findById(post._id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    res.json({ post: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Share failed' });
  }
});

export default router;

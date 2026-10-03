import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { uploadAvatar, publicUploadPath } from '../config/upload.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { sendEmail } from '../utils/mail.js';

const router = express.Router();

router.post('/register', uploadAvatar.single('profilePicture'), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.trim() }] });
    if (exists) {
      return res.status(409).json({ error: 'Username or email already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    let profilePicture = '';
    if (req.file) {
      profilePicture = publicUploadPath('avatars', req.file.filename);
    }
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      profilePicture,
    });
    const token = signToken(user._id.toString());
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json({ token, user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user._id.toString());
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('Password reset requested for:', email, 'Found user:', !!user);
    const genericOk = () =>
      res.json({
        message: 'If the account exists, a reset link was sent.',
      });

    if (!user) {
      return genericOk();
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password/${token}`;
    console.log('\n========================================');
    console.log(`[PASSWORD RESET LINK]: ${resetUrl}`);
    console.log('========================================\n');

    const subject = 'Password reset request';
    const text = `You requested a password reset. Use this link to set a new password:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
    const html = `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>If you did not request this, ignore this message.</p>`;

    try {
      await sendEmail({ to: user.email, subject, text, html });
    } catch (mailErr) {
      const detail =
        mailErr instanceof Error ? mailErr.message : 'Unknown email error';
      console.error('Password reset email failed:', detail);
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: detail,
        });
      }
      console.warn('⚠️ Development mode: Email delivery failed, but reset link was generated and logged above.');
    }

    return genericOk();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Unable to process reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Unable to reset password' });
  }
});

router.patch('/me', authRequired, attachUser, uploadAvatar.single('profilePicture'), async (req, res) => {
  try {
    const { username, bio } = req.body;
    const user = req.user;

    if (username != null) {
      const trimmed = username.toString().trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'Username is required' });
      }
      if (trimmed !== user.username) {
        const exists = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
        if (exists) {
          return res.status(409).json({ error: 'Username is already taken' });
        }
        user.username = trimmed;
      }
    }

    if (bio != null) {
      user.bio = bio.toString().trim();
    }

    if (req.file) {
      user.profilePicture = publicUploadPath('avatars', req.file.filename);
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json({ user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

router.get('/me', authRequired, attachUser, (req, res) => {
  res.json({ user: req.user });
});

router.get('/validate', authRequired, attachUser, (req, res) => {
  res.json({ active: true, user: req.user });
});

router.post('/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ active: true, payload });
  } catch {
    return res.status(401).json({ active: false, error: 'Invalid or expired token' });
  }
});

export default router;

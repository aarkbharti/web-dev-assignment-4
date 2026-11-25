const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const bus = require('../events');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }
  if (!emailRe.test(email)) return res.status(400).json({ message: 'Invalid email format' });
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const cleanEmail = email.toLowerCase().trim();
  if (db.users.findOne((u) => u.email === cleanEmail)) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);
  const role = cleanEmail === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'user';
  const user = db.users.insert({ username: username.trim(), email: cleanEmail, password: hash, role });
  bus.emit('user:registered', user);
  res.status(201).json({ message: 'User registered', id: user._id, username: user.username, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.findOne((u) => u.email === cleanEmail);
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    bus.emit('user:loginFailed', cleanEmail);
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  bus.emit('user:login', user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
  res.status(200).json({ message: 'Login successful', token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Protected route: current user's profile
router.get('/me', authenticate, (req, res) => {
  const user = db.users.findOne((u) => u._id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user._id, username: user.username, email: user.email, role: user.role });
});

module.exports = router;

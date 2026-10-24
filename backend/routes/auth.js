const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Standalone Free Auth Routes (No database or passwords required)
const DEFAULT_USER = {
  id: 'free_developer',
  _id: 'free_developer',
  name: 'Developer',
  email: 'guest@codeatlas.dev',
  role: 'developer'
};

// Sign up — immediate free access
router.post('/signup', async (req, res) => {
  const user = {
    ...DEFAULT_USER,
    name: req.body.name || DEFAULT_USER.name,
    email: req.body.email || DEFAULT_USER.email
  };
  res.status(201).json({ token: 'free-token', user });
});

// Admin Sign up
router.post('/admin-signup', async (req, res) => {
  const user = {
    ...DEFAULT_USER,
    name: req.body.name || 'Administrator',
    email: req.body.email || 'admin@codeatlas.dev',
    role: 'admin'
  };
  res.status(201).json({ token: 'free-token', user });
});

// Login — immediate free access
router.post('/login', async (req, res) => {
  res.json({ token: 'free-token', user: DEFAULT_USER });
});

// Get current profile
router.get('/me', authMiddleware, async (req, res) => {
  res.json(DEFAULT_USER);
});

// Update profile
router.put('/me', authMiddleware, async (req, res) => {
  const updatedUser = {
    ...DEFAULT_USER,
    ...req.body
  };
  res.json(updatedUser);
});

// Change password mock
router.put('/change-password', authMiddleware, async (req, res) => {
  res.json({ message: 'Preferences updated successfully' });
});

// Delete account mock
router.delete('/me', authMiddleware, async (req, res) => {
  res.json({ message: 'Session reset' });
});

module.exports = router;

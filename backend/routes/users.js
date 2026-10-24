const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// In-memory friends store
if (!global.friendsStore) global.friendsStore = new Map();

// Get current user's network profile (friends & requests)
router.get('/network', authMiddleware, async (req, res) => {
  try {
    const list = global.friendsStore.get(req.user.id) || [];
    res.json({
      friends: list,
      friendRequests: []
    });
  } catch (err) {
    res.json({ friends: [], friendRequests: [] });
  }
});

// Search for users to collaborate with
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const onlineKeys = global.onlineUsers ? Array.from(global.onlineUsers.keys()) : [];
    const results = onlineKeys
      .filter(k => k !== req.user.id)
      .map(k => ({
        _id: k,
        name: 'Developer ' + k.substring(0, 5),
        email: `${k}@codeatlas.dev`,
        avatar: null,
        status: 'none'
      }));
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// Send a collaboration/friend request
router.post('/request/:targetId', authMiddleware, async (req, res) => {
  res.json({ message: 'Collaboration request sent successfully!' });
});

// Accept a collaboration request
router.post('/accept/:requesterId', authMiddleware, async (req, res) => {
  res.json({ message: 'Collaboration request accepted!' });
});

// Reject a collaboration request
router.post('/reject/:requesterId', authMiddleware, async (req, res) => {
  res.json({ message: 'Collaboration request rejected' });
});

module.exports = router;

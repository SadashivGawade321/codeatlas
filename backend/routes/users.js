const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get current user's network profile (friends & requests)
router.get('/network', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'name email avatar')
      .populate('friendRequests', 'name email avatar');
    
    res.json({
      friends: user.friends,
      friendRequests: user.friendRequests
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search for users to collaborate with (excludes self and existing friends)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUser = await User.findById(req.user.id);
    
    // Base filter: not self, not already friends
    const filter = {
      $and: [
        { _id: { $ne: currentUser._id } }, // not self
        { _id: { $nin: currentUser.friends } } // not already friends
      ]
    };

    if (query && query.length >= 2) {
      filter.$and.push({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
    }

    const users = await User.find(filter).select('name email avatar').limit(50);

    // Map to add relationship status
    const results = users.map(u => {
      let status = 'none';
      if (currentUser.friendRequests.includes(u._id)) status = 'incoming_request';
      // We don't have outgoing requests tracked natively, but for simplicity we assume 'none'
      // If we need strict outgoing requests, we would query if u.friendRequests includes currentUser._id
      return { _id: u._id, name: u.name, email: u.email, avatar: u.avatar, status };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a collaboration/friend request
router.post('/request/:targetId', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.targetId;
    if (targetId === req.user.id) return res.status(400).json({ message: 'Cannot add yourself' });

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.friends.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already collaborators' });
    }

    if (targetUser.friendRequests.includes(req.user.id)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    targetUser.friendRequests.push(req.user.id);
    await targetUser.save();

    res.json({ message: 'Collaboration request sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a collaboration request
router.post('/accept/:requesterId', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUser = await User.findById(req.user.id);
    const requesterUser = await User.findById(requesterId);

    if (!currentUser.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: 'No request found' });
    }

    // Remove from requests, add to friends
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== requesterId);
    if (!currentUser.friends.includes(requesterId)) currentUser.friends.push(requesterId);
    await currentUser.save();

    // Also add current user to requester's friends
    if (requesterUser && !requesterUser.friends.includes(currentUser._id)) {
      requesterUser.friends.push(currentUser._id);
      await requesterUser.save();
    }

    res.json({ message: 'Collaboration request accepted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a collaboration request
router.post('/reject/:requesterId', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUser = await User.findById(req.user.id);

    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== requesterId);
    await currentUser.save();

    res.json({ message: 'Collaboration request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

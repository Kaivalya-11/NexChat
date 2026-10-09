const express = require('express');
const router = express.Router();
const store = require('../store');
const { authMiddleware } = require('../middleware/auth');

// Get all friends
router.get('/', authMiddleware, async (req, res) => {
  try {
    const friends = await store.getFriends(req.user.id);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get friend requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await store.getFriendRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Search users to add as friends
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await store.searchUsers(q, req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Target user ID is required' });
    const request = await store.sendFriendRequest(req.user.id, to);
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Accept friend request
router.post('/requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    await store.acceptFriendRequest(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Decline or cancel friend request
router.delete('/requests/:id', authMiddleware, async (req, res) => {
  try {
    await store.declineFriendRequest(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove friend
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await store.removeFriend(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

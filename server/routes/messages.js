const express = require('express');
const router = express.Router();
const store = require('../store');
const { authMiddleware } = require('../middleware/auth');

// Get messages for a channel with optional pagination ('before' timestamp)
router.get('/:channelId', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { before, limit } = req.query;
    
    // Check membership
    const chan = await store.getChannelById(channelId);
    if (!chan || !chan.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    const messages = await store.getMessages(channelId, {
      before,
      limit: parseInt(limit || '30', 10)
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get threaded replies for a specific message
router.get('/thread/:parentId', authMiddleware, async (req, res) => {
  try {
    const replies = await store.getThreadReplies(req.params.parentId);
    res.json(replies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch thread replies' });
  }
});

// Search messages
router.get('/search/all', authMiddleware, async (req, res) => {
  try {
    const { q, channelId } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const results = await store.searchMessages(q.trim(), channelId || null);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await store.deleteMessage(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Message not found' });
    res.json(result);
  } catch (err) {
    res.status(403).json({ error: err.message || 'Failed to delete message' });
  }
});

module.exports = router;

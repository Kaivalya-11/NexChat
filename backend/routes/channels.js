const express = require('express');
const router = express.Router();
const store = require('../store');
const { authMiddleware } = require('../middleware/auth');

// Get all channels for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const channels = await store.getChannelsForUser(req.user.id);
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Create new group channel
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const memberSet = new Set([req.user.id, ...members]);
    const newChan = await store.createChannel({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      isGroup: true,
      members: Array.from(memberSet),
      admins: [req.user.id],
      owner: req.user.id,
      avatar: ''
    });

    res.status(201).json(newChan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Get or Create DM channel with target user
router.post('/dm', authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }
    const dm = await store.getOrCreateDM(req.user.id, targetUserId);
    if (!dm) {
      return res.status(400).json({ error: 'Cannot create DM with yourself' });
    }
    res.json(dm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to open DM channel' });
  }
});

// Update Channel details (Admins only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const chan = await store.getChannelById(req.params.id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });
    if (!chan.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only channel admins can edit details' });
    }

    const { name, description, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await store.updateChannel(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Add member to group channel
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const chan = await store.getChannelById(req.params.id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });
    if (!chan.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only channel admins can add members' });
    }

    if (!chan.members.includes(userId)) {
      const updatedMembers = [...chan.members, userId];
      const updated = await store.updateChannel(req.params.id, { members: updatedMembers });
      return res.json(updated);
    }
    res.json(chan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove/Kick member from channel
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const chan = await store.getChannelById(id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });
    
    // User leaving or admin kicking
    const isSelfLeave = req.user.id === userId;
    const isAdmin = chan.admins.includes(req.user.id);
    if (!isSelfLeave && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied to remove member' });
    }

    const updatedMembers = chan.members.filter(m => m !== userId);
    const updatedAdmins = chan.admins.filter(a => a !== userId);
    const updated = await store.updateChannel(id, { members: updatedMembers, admins: updatedAdmins });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Add admin to channel
router.post('/:id/admins', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const chan = await store.getChannelById(req.params.id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });
    if (!chan.admins.includes(req.user.id) && chan.owner !== req.user.id) {
      return res.status(403).json({ error: 'Only channel admins/owner can manage admins' });
    }

    if (!chan.admins.includes(userId)) {
      const updatedAdmins = [...chan.admins, userId];
      const updated = await store.updateChannel(req.params.id, { admins: updatedAdmins });
      return res.json(updated);
    }
    res.json(chan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add admin' });
  }
});

// Remove admin from channel
router.delete('/:id/admins/:userId', authMiddleware, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const chan = await store.getChannelById(id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });
    if (!chan.admins.includes(req.user.id) && chan.owner !== req.user.id) {
      return res.status(403).json({ error: 'Only channel admins/owner can manage admins' });
    }
    
    if (chan.owner === userId) {
      return res.status(400).json({ error: 'Cannot remove owner as admin' });
    }

    const updatedAdmins = chan.admins.filter(a => a !== userId);
    const updated = await store.updateChannel(id, { admins: updatedAdmins });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

// Delete channel / DM conversation
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await store.deleteChannel(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Channel not found' });
    res.json(result);
  } catch (err) {
    res.status(403).json({ error: err.message || 'Failed to delete channel' });
  }
});

module.exports = router;

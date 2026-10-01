const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../store');
const { authMiddleware, generateToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar, statusText } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existing = await store.findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await store.createUser({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      avatar: avatar || store.PRESET_AVATARS[0],
      statusText: statusText || 'Available'
    });

    // Auto-add new user to 'general' channel
    const generalChan = await store.getChannelByName('general');
    if (generalChan) {
      await store.updateChannel(generalChan.id, {
        members: [...generalChan.members, user.id]
      });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await store.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error logging in' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await store.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile & Avatar
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { avatar, statusText, status } = req.body;
    const updates = {};
    if (avatar !== undefined) updates.avatar = avatar;
    if (statusText !== undefined) updates.statusText = statusText;
    if (status !== undefined) updates.status = status;

    const updatedUser = await store.updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get Preset Avatars list & Users list for direct message startup
router.get('/presets', (req, res) => {
  res.json({ avatars: store.PRESET_AVATARS });
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await store.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

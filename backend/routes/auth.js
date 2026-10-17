const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../store');
const { authMiddleware, generateToken } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, async (req, res) => {
  try {
    // Check if new user registration is permitted
    const registrationEnabled = await store.getPlatformSetting('allowRegistration', true);
    if (registrationEnabled === false) {
      return res.status(403).json({ error: 'New user registration is currently disabled by administrator.' });
    }

    const { username, email, password, avatar, statusText } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    // Prevent impersonating the admin account or using reserved system handles
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
    const reservedUsernames = [ADMIN_USERNAME.toLowerCase(), 'admin', 'administrator', 'root', 'system', 'moderator', 'mod', 'nexchat'];
    if (reservedUsernames.includes(username.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Username is already taken or reserved' });
    }

    const existing = await store.findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Never allow public registration to create admin or moderator accounts
    const user = await store.createUser({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      avatar: avatar || store.PRESET_AVATARS[0],
      statusText: statusText || 'Available',
      role: 'user',
      isAdmin: false
    });

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error registering user' });
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
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

    // Enforce platform maintenance mode (admins and moderators retain access)
    const maintenance = await store.getPlatformSetting('maintenanceMode', { enabled: false, message: '' });
    if (maintenance?.enabled) {
      const isAdminOrMod = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'moderator');
      if (!isAdminOrMod) {
        return res.status(503).json({
          error: maintenance.message || 'NexChat is currently undergoing maintenance. Please check back shortly.',
          maintenance: true
        });
      }
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: user.suspendedReason ? `Account suspended: ${user.suspendedReason}` : 'Account has been suspended by an administrator'
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error logging in' });
  }
});

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

router.get('/presets', (req, res) => {
  res.json({ avatars: store.PRESET_AVATARS });
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await store.getAllUsers(req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2026';

const store = require('../store');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    const user = await store.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User does not exist' });
    }

    // Check suspension with expiry
    const userDocId = user.id || (user._id ? user._id.toString() : userId);
    if (user.isSuspended) {
      if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
        user.isSuspended = false;
        await store.UserModel.findByIdAndUpdate(userDocId, {
          isSuspended: false,
          suspendedReason: '',
          suspendedUntil: null,
          suspendedBy: null
        });
      } else {
        const reason = user.suspendedReason ? `: ${user.suspendedReason}` : '';
        return res.status(403).json({ error: `Account suspended${reason}` });
      }
    }

    if (user.isDeactivated) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Check maintenance mode (admins and moderators bypass maintenance)
    try {
      const maintenance = await store.getPlatformSetting('maintenanceMode', { enabled: false, message: '' });
      if (maintenance?.enabled) {
        const isAdminOrMod = Boolean(user.isAdmin || user.role === 'admin' || user.role === 'moderator');
        if (!isAdminOrMod) {
          return res.status(503).json({ error: `Maintenance mode active: ${maintenance.message || 'Please try again later.'}` });
        }
      }
    } catch (mErr) {
      // Proceed if setting retrieval fails gracefully
    }

    req.user = {
      id: userDocId,
      _id: userDocId,
      username: user.username,
      email: user.email,
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
      isAdmin: Boolean(user.isAdmin || user.role === 'admin'),
      avatar: user.avatar
    };
    req.userDoc = user;
    next();
  } catch (err) {
    console.error('authMiddleware token error:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

function generateToken(user) {
  const role = user.role || (user.isAdmin ? 'admin' : 'user');
  const isAdmin = Boolean(role === 'admin' || user.isAdmin);
  return jwt.sign(
    {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      role,
      isAdmin
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };

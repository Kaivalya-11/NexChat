const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');
const store = require('../store');

/**
 * Middleware: Verify user is an Admin
 * Validates token signature AND verifies current permissions in the database.
 * Never trusts client-supplied role or user ID.
 */
async function adminAuth(req, res, next) {
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

    // Always verify permissions against the database to prevent trusting stale / forged claims
    const user = await store.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User does not exist' });
    }

    const isAdmin = Boolean(user.role === 'admin' || user.isAdmin);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/**
 * Middleware: Verify user has one of the allowed roles
 * e.g., requireRoles('admin', 'moderator')
 */
function requireRoles(...allowedRoles) {
  return async (req, res, next) => {
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

      const userRole = user.role || (user.isAdmin ? 'admin' : 'user');
      const isAdmin = Boolean(userRole === 'admin' || user.isAdmin);

      // Admin has access to all role-restricted routes
      const hasPermission = isAdmin || allowedRoles.includes(userRole);
      if (!hasPermission) {
        return res.status(403).json({ error: `Forbidden: Requires role [${allowedRoles.join(' or ')}]` });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  };
}

module.exports = { adminAuth, requireRoles };

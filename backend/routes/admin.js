const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const store = require('../store');
const cloudinary = require('cloudinary').v2;
const { adminAuth, requireRoles } = require('../middleware/adminAuth');
const {
  disconnectUserSockets,
  notifyUser,
  getSocketMetrics,
  broadcastAnnouncement,
  broadcastMaintenance
} = require('../socket');

const {
  UserModel,
  ChannelModel,
  MessageModel,
  AuditLogModel,
  ModerationReportModel,
  AnnouncementModel,
  PlatformSettingModel,
  MediaUploadModel,
  formatUser,
  formatChannel,
  formatReport,
  formatAnnouncement,
  formatMediaUpload
} = store;

/**
 * Helper to safely check MongoDB ObjectId
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id.toString();
}

/**
 * GET /api/admin/verify
 * Protected endpoint: Verifies if the requester has valid Admin privileges.
 */
router.get('/verify', adminAuth, async (req, res) => {
  try {
    res.json({
      ok: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role || (req.user.isAdmin ? 'admin' : 'user'),
        isAdmin: Boolean(req.user.role === 'admin' || req.user.isAdmin),
        avatar: req.user.avatar,
        statusText: req.user.statusText
      }
    });
  } catch (err) {
    console.error('Admin verify error:', err);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
});

/**
 * GET /api/admin/overview
 * Protected endpoint: Returns real database counts and metrics for the dashboard.
 * Does not expose private message content or sensitive credentials.
 */
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const stats = await store.getOverviewStats();
    const serverInfo = {
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      ok: true,
      stats,
      server: serverInfo
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve overview statistics' });
  }
});

/**
 * Helper to generate continuous daily series without date gaps
 */
function fillDateGaps(trendList, startDate, endDate, defaultValues = { count: 0 }) {
  const map = new Map();
  (trendList || []).forEach(item => {
    if (item && item._id) {
      map.set(item._id, item);
    }
  });

  const result = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Normalize to UTC calendar dates (YYYY-MM-DD)
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    if (map.has(dateStr)) {
      const item = map.get(dateStr);
      result.push({
        date: dateStr,
        ...defaultValues,
        ...item,
        _id: undefined
      });
    } else {
      result.push({
        date: dateStr,
        ...defaultValues
      });
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

/**
 * GET /api/admin/health
 * Protected endpoint: Returns real system health, memory usage, DB latency, socket metrics, and safe upload info.
 * Never exposes credentials, secret keys, or stack traces.
 */
router.get('/health', adminAuth, async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const readyStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const dbState = readyStateMap[mongoose.connection.readyState] || 'unknown';

    // Measure live MongoDB ping latency
    let pingLatencyMs = null;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const t0 = Date.now();
        await mongoose.connection.db.admin().ping();
        pingLatencyMs = Date.now() - t0;
      } catch (pingErr) {
        console.warn('MongoDB ping latency measurement warning:', pingErr.message);
      }
    }

    // Sanitize DB host string (never leak full connection string or credentials)
    const rawHost = mongoose.connection.host || 'MongoDB Cluster';
    const maskedHost = rawHost.includes('@')
      ? rawHost.split('@')[1]
      : (rawHost.length > 24 ? `${rawHost.slice(0, 12)}...${rawHost.slice(-8)}` : rawHost);

    // Socket.IO Telemetry
    const socketMetrics = typeof getSocketMetrics === 'function'
      ? getSocketMetrics()
      : { status: 'unknown', connectedSockets: 0, activeUsers: 0, roomsCount: 0 };

    // Upload Provider Status (Verification without leaking API secret)
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const maskedCloud = cloudName
      ? (cloudName.length > 3 ? `${cloudName.slice(0, 3)}***` : '***')
      : null;

    const uploadProvider = {
      provider: hasCloudinary ? 'Cloudinary' : 'Local Storage',
      configured: hasCloudinary,
      cloudNameMasked: maskedCloud,
      maxUploadSizeBytes: 25 * 1024 * 1024, // 25 MB ceiling
      status: hasCloudinary ? 'operational' : 'local_storage_fallback'
    };

    // Deployment & Runtime Metadata
    const deployment = {
      provider: process.env.RENDER ? 'Render' : (process.env.VERCEL ? 'Vercel' : 'Node.js Standalone'),
      serviceId: process.env.RENDER_SERVICE_ID ? `${process.env.RENDER_SERVICE_ID.slice(0, 8)}...` : null,
      gitCommit: process.env.RENDER_GIT_COMMIT ? process.env.RENDER_GIT_COMMIT.slice(0, 7) : null,
      environment: process.env.NODE_ENV || 'development'
    };

    // Recent Operational Failure Logs (without sensitive parameters)
    const recentFailures = await AuditLogModel.find({ result: 'failure' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('actorUsername action targetType targetLabel reason createdAt')
      .lean();

    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100;
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100;
    const rssMb = Math.round(mem.rss / 1024 / 1024 * 100) / 100;
    const externalMb = Math.round(mem.external / 1024 / 1024 * 100) / 100;
    const heapPercent = heapTotalMb > 0 ? Math.round((heapUsedMb / heapTotalMb) * 100) : 0;

    const isHealthy = dbState === 'connected' && (pingLatencyMs === null || pingLatencyMs < 3000);

    res.json({
      ok: true,
      status: isHealthy ? 'healthy' : 'degraded',
      database: {
        status: dbState,
        name: mongoose.connection.name || 'default',
        host: maskedHost,
        pingLatencyMs: pingLatencyMs !== null ? pingLatencyMs : 'N/A'
      },
      socket: socketMetrics,
      uploads: uploadProvider,
      deployment,
      memory: {
        rssMb,
        heapTotalMb,
        heapUsedMb,
        externalMb,
        heapPercent
      },
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      },
      operationalErrors: {
        count: recentFailures.length,
        recent: recentFailures.map(f => ({
          id: f._id.toString(),
          actor: f.actorUsername,
          action: f.action,
          targetType: f.targetType || '',
          targetLabel: f.targetLabel || '',
          reason: f.reason || '',
          timestamp: f.createdAt
        }))
      },
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Admin health check error:', err);
    res.status(500).json({ error: 'Failed to retrieve system health metrics' });
  }
});

/**
 * GET /api/admin/analytics
 * Protected endpoint: Returns aggregated platform growth and activity trends.
 * Supports date range filtering: '7d', '30d', '90d', or 'custom'.
 * Never exposes message contents or private conversations.
 */
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const range = req.query.range || '7d';
    let startDateTime;
    let endDateTime = new Date();

    if (range === 'custom') {
      if (!req.query.startDate || !req.query.endDate) {
        return res.status(400).json({ error: 'startDate and endDate query parameters are required for custom range' });
      }
      startDateTime = new Date(req.query.startDate);
      endDateTime = new Date(req.query.endDate);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate or endDate format. Please use YYYY-MM-DD format.' });
      }
      if (startDateTime > endDateTime) {
        return res.status(400).json({ error: 'startDate must be less than or equal to endDate' });
      }

      // Maximum allowable custom span: 365 days
      const spanDays = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
      if (spanDays > 365) {
        return res.status(400).json({ error: 'Date range cannot exceed 365 days' });
      }

      startDateTime.setUTCHours(0, 0, 0, 0);
      endDateTime.setUTCHours(23, 59, 59, 999);
    } else {
      let daysBack = 7;
      if (range === '30d') daysBack = 30;
      else if (range === '90d') daysBack = 90;

      startDateTime = new Date();
      startDateTime.setUTCDate(startDateTime.getUTCDate() - (daysBack - 1));
      startDateTime.setUTCHours(0, 0, 0, 0);
    }

    // Run parallel MongoDB aggregations for performance
    const [
      userTrendsRaw,
      messageTrendsRaw,
      channelTrendsRaw,
      reportTrendsRaw,
      totalUsersCount,
      activeUsersCount
    ] = await Promise.all([
      // 1. Daily User Registrations
      UserModel.aggregate([
        { $match: { createdAt: { $gte: startDateTime, $lte: endDateTime } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2. Daily Message Volume (never querying or returning message text)
      MessageModel.aggregate([
        { $match: { createdAt: { $gte: startDateTime, $lte: endDateTime } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            withAttachments: {
              $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$attachments", []] } }, 0] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 3. Daily Channel Creations (with group vs DM breakdown)
      ChannelModel.aggregate([
        { $match: { createdAt: { $gte: startDateTime, $lte: endDateTime } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            groups: { $sum: { $cond: ["$isGroup", 1, 0] } },
            dms: { $sum: { $cond: ["$isGroup", 0, 1] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 4. Daily Moderation Reports Filed
      ModerationReportModel.aggregate([
        { $match: { createdAt: { $gte: startDateTime, $lte: endDateTime } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      UserModel.countDocuments(),
      UserModel.countDocuments({ isSuspended: false, isDeactivated: false })
    ]);

    // Backfill zero-event dates so graphs are continuous
    const usersTrend = fillDateGaps(userTrendsRaw, startDateTime, endDateTime, { count: 0 });
    const messagesTrend = fillDateGaps(messageTrendsRaw, startDateTime, endDateTime, { count: 0, withAttachments: 0 });
    const channelsTrend = fillDateGaps(channelTrendsRaw, startDateTime, endDateTime, { count: 0, groups: 0, dms: 0 });
    const reportsTrend = fillDateGaps(reportTrendsRaw, startDateTime, endDateTime, { count: 0 });

    // Calculate aggregated metrics
    const totalNewUsers = usersTrend.reduce((sum, d) => sum + d.count, 0);
    const totalMessagesSent = messagesTrend.reduce((sum, d) => sum + d.count, 0);
    const totalMessagesWithAttachments = messagesTrend.reduce((sum, d) => sum + (d.withAttachments || 0), 0);
    const totalChannelsCreated = channelsTrend.reduce((sum, d) => sum + d.count, 0);
    const totalGroupChannelsCreated = channelsTrend.reduce((sum, d) => sum + (d.groups || 0), 0);
    const totalDmChannelsCreated = channelsTrend.reduce((sum, d) => sum + (d.dms || 0), 0);
    const totalReportsSubmitted = reportsTrend.reduce((sum, d) => sum + d.count, 0);

    const daysCount = usersTrend.length || 1;
    const avgMessagesPerDay = Math.round((totalMessagesSent / daysCount) * 10) / 10;
    const avgNewUsersPerDay = Math.round((totalNewUsers / daysCount) * 10) / 10;

    let peakMessageDay = { date: 'N/A', count: 0 };
    messagesTrend.forEach(d => {
      if (d.count > peakMessageDay.count) {
        peakMessageDay = { date: d.date, count: d.count };
      }
    });

    res.json({
      ok: true,
      range,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      daysCount,
      summary: {
        totalNewUsers,
        avgNewUsersPerDay,
        totalMessagesSent,
        totalMessagesWithAttachments,
        avgMessagesPerDay,
        peakMessageDay,
        totalChannelsCreated,
        totalGroupChannelsCreated,
        totalDmChannelsCreated,
        totalReportsSubmitted,
        platformTotalUsers: totalUsersCount,
        platformActiveUsers: activeUsersCount
      },
      trends: {
        users: usersTrend,
        messages: messagesTrend,
        channels: channelsTrend,
        reports: reportsTrend
      }
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Paginated user list with search, role, and status filtering.
 * Never exposes passwords or password hashes.
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const role = req.query.role || 'all';
    const status = req.query.status || 'all';
    const sortBy = ['createdAt', 'username', 'lastSeen'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = {};

    // Search query
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filtering
    if (role !== 'all') {
      if (role === 'admin') {
        const adminCondition = [{ role: 'admin' }, { isAdmin: true }];
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: adminCondition }];
          delete filter.$or;
        } else {
          filter.$or = adminCondition;
        }
      } else {
        filter.role = role;
        filter.isAdmin = { $ne: true };
      }
    }

    // Account status filtering
    if (status !== 'all') {
      if (status === 'suspended') {
        filter.isSuspended = true;
      } else if (status === 'deactivated') {
        filter.isDeactivated = true;
      } else if (status === 'active') {
        filter.isSuspended = { $ne: true };
        filter.isDeactivated = { $ne: true };
      } else if (['online', 'offline', 'away', 'dnd'].includes(status)) {
        filter.status = status;
        filter.isSuspended = { $ne: true };
        filter.isDeactivated = { $ne: true };
      }
    }

    const [total, userDocs] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter, { password: 0 })
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      ok: true,
      users: userDocs.map(u => ({
        ...formatUser(u),
        friendsCount: Array.isArray(u.friends) ? u.friends.length : 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user profile details along with activity metadata (channel and message counts).
 */
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user identifier format' });
    }

    const userDoc = await UserModel.findById(id, { password: 0 });
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [channelCount, messageCount] = await Promise.all([
      ChannelModel.countDocuments({ members: userDoc._id }),
      MessageModel.countDocuments({ sender: userDoc._id })
    ]);

    res.json({
      ok: true,
      user: {
        ...formatUser(userDoc),
        channelCount,
        messageCount,
        friendsCount: Array.isArray(userDoc.friends) ? userDoc.friends.length : 0
      }
    });
  } catch (err) {
    console.error('Admin get user details error:', err);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role (user, moderator, admin).
 * Protected against self-demotion / self-lockout.
 */
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user identifier format' });
    }

    // Prevent accidental self-demotion / self-lockout
    if (req.user.id.toString() === id.toString()) {
      return res.status(400).json({ error: 'Self-lockout protection: You cannot modify your own administrative role' });
    }

    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Permitted values: user, moderator, admin' });
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Primary system admin account cannot be demoted
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
    if (targetUser.username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && role !== 'admin') {
      return res.status(403).json({ error: 'The primary system admin account cannot be demoted' });
    }

    const oldRole = targetUser.role || (targetUser.isAdmin ? 'admin' : 'user');
    targetUser.role = role;
    targetUser.isAdmin = (role === 'admin');
    await targetUser.save();

    // Create Audit Log entry
    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'ROLE_CHANGED',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      targetLabel: targetUser.username,
      reason: reason || 'Role updated by administrator',
      meta: { oldRole, newRole: role }
    });

    res.json({
      ok: true,
      message: `User @${targetUser.username} role changed from ${oldRole} to ${role}`,
      user: formatUser(targetUser)
    });
  } catch (err) {
    console.error('Admin change role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Suspend, restore, deactivate, or reactivate a user account.
 * Protected against self-suspension.
 */
router.patch('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user identifier format' });
    }

    // Prevent self-suspension / self-lockout
    if (req.user.id.toString() === id.toString()) {
      return res.status(400).json({ error: 'Self-lockout protection: You cannot suspend or deactivate your own account' });
    }

    const validActions = ['suspend', 'restore', 'deactivate', 'reactivate'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Permitted: ${validActions.join(', ')}` });
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent suspending or deactivating primary admin account
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
    if (targetUser.username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && (action === 'suspend' || action === 'deactivate')) {
      return res.status(403).json({ error: 'The primary system admin account cannot be suspended or deactivated' });
    }

    if (action === 'suspend') {
      targetUser.isSuspended = true;
      targetUser.suspendedAt = new Date();
      targetUser.suspendedReason = reason ? reason.trim() : 'Suspended by administrator';
    } else if (action === 'restore') {
      targetUser.isSuspended = false;
      targetUser.suspendedAt = null;
      targetUser.suspendedReason = '';
    } else if (action === 'deactivate') {
      targetUser.isDeactivated = true;
      targetUser.deactivatedAt = new Date();
    } else if (action === 'reactivate') {
      targetUser.isDeactivated = false;
      targetUser.deactivatedAt = null;
    }

    await targetUser.save();

    // Immediately terminate active Socket.IO connections if suspended or deactivated
    if (action === 'suspend' || action === 'deactivate') {
      try {
        disconnectUserSockets(id, targetUser.suspendedReason || 'Account suspended by administrator');
      } catch (sErr) {
        console.error('Error disconnecting suspended user sockets:', sErr);
      }
    }

    // Create Audit Log entry
    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: `USER_${action.toUpperCase()}`,
      targetType: 'user',
      targetId: targetUser._id.toString(),
      targetLabel: targetUser.username,
      reason: reason || `Account ${action} performed by admin`,
      meta: { action }
    });

    res.json({
      ok: true,
      message: `Account @${targetUser.username} successfully updated (${action})`,
      user: formatUser(targetUser)
    });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ error: 'Failed to update user account status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/channels
 * Paginated channel list with search, group/dm type filter, and archived status.
 * Does not expose private message content.
 */
router.get('/channels', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const type = req.query.type || 'all'; // all, group, dm
    const status = req.query.status || 'all'; // all, active, archived
    const sortBy = ['createdAt', 'updatedAt', 'name'].includes(req.query.sortBy) ? req.query.sortBy : 'updatedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type === 'group') {
      filter.isGroup = true;
    } else if (type === 'dm') {
      filter.isGroup = false;
    }

    if (status === 'archived') {
      filter.isArchived = true;
    } else if (status === 'active') {
      filter.isArchived = { $ne: true };
    }

    const [total, channelDocs] = await Promise.all([
      ChannelModel.countDocuments(filter),
      ChannelModel.find(filter)
        .populate('owner', 'username avatar role')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);

    // Fetch message counts for these channels in parallel without exposing message contents
    const channelIds = channelDocs.map(c => c._id);
    const messageCounts = await MessageModel.aggregate([
      { $match: { conversation: { $in: channelIds } } },
      { $group: { _id: '$conversation', count: { $sum: 1 } } }
    ]);

    const countMap = new Map();
    messageCounts.forEach(mc => {
      countMap.set(mc._id.toString(), mc.count);
    });

    const channels = channelDocs.map(c => {
      const formatted = formatChannel(c);
      return {
        ...formatted,
        memberCount: Array.isArray(c.members) ? c.members.length : 0,
        adminCount: Array.isArray(c.admins) ? c.admins.length : 0,
        owner: c.owner ? {
          id: c.owner._id ? c.owner._id.toString() : c.owner.toString(),
          username: c.owner.username || 'Unknown',
          avatar: c.owner.avatar || ''
        } : null,
        messageCount: countMap.get(c._id.toString()) || 0
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      ok: true,
      channels,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Admin get channels error:', err);
    res.status(500).json({ error: 'Failed to retrieve channels' });
  }
});

/**
 * GET /api/admin/channels/:id
 * Detailed channel metadata and populated member listing.
 * Does not expose private message content.
 */
router.get('/channels/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid channel identifier format' });
    }

    const channelDoc = await ChannelModel.findById(id)
      .populate('owner', 'username avatar role email createdAt')
      .populate('admins', 'username avatar role')
      .populate('members', 'username avatar role status statusText isSuspended isDeactivated createdAt');

    if (!channelDoc) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const messageCount = await MessageModel.countDocuments({ conversation: channelDoc._id });

    const formatted = formatChannel(channelDoc);
    res.json({
      ok: true,
      channel: {
        ...formatted,
        memberCount: Array.isArray(channelDoc.members) ? channelDoc.members.length : 0,
        adminCount: Array.isArray(channelDoc.admins) ? channelDoc.admins.length : 0,
        messageCount,
        owner: channelDoc.owner ? {
          id: channelDoc.owner._id ? channelDoc.owner._id.toString() : channelDoc.owner.toString(),
          username: channelDoc.owner.username,
          avatar: channelDoc.owner.avatar,
          role: channelDoc.owner.role
        } : null,
        admins: Array.isArray(channelDoc.admins) ? channelDoc.admins.map(a => ({
          id: a._id ? a._id.toString() : a.toString(),
          username: a.username,
          avatar: a.avatar,
          role: a.role
        })) : [],
        members: Array.isArray(channelDoc.members) ? channelDoc.members.map(m => ({
          id: m._id ? m._id.toString() : m.toString(),
          username: m.username,
          avatar: m.avatar,
          role: m.role || 'user',
          status: m.status || 'offline',
          statusText: m.statusText || '',
          isSuspended: Boolean(m.isSuspended),
          isDeactivated: Boolean(m.isDeactivated),
          createdAt: m.createdAt
        })) : []
      }
    });
  } catch (err) {
    console.error('Admin get channel details error:', err);
    res.status(500).json({ error: 'Failed to retrieve channel details' });
  }
});

/**
 * PATCH /api/admin/channels/:id/archive
 * Archive or restore a channel.
 */
router.patch('/channels/:id/archive', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { archive, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid channel identifier format' });
    }

    const channel = await ChannelModel.findById(id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const isArchiving = Boolean(archive);
    channel.isArchived = isArchiving;
    channel.archivedAt = isArchiving ? new Date() : null;
    channel.archivedBy = isArchiving ? req.user.id : null;
    await channel.save();

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: isArchiving ? 'CHANNEL_ARCHIVED' : 'CHANNEL_RESTORED',
      targetType: 'channel',
      targetId: channel._id.toString(),
      targetLabel: channel.name,
      reason: reason || `Channel ${isArchiving ? 'archived' : 'restored'} by admin`,
      meta: { isArchived: isArchiving }
    });

    res.json({
      ok: true,
      message: `Channel #${channel.name} has been ${isArchiving ? 'archived' : 'restored'}`,
      channel: formatChannel(channel)
    });
  } catch (err) {
    console.error('Admin archive channel error:', err);
    res.status(500).json({ error: 'Failed to update channel archive state' });
  }
});

/**
 * DELETE /api/admin/channels/:id
 * Safely delete a channel with explicit confirmation of the exact channel name.
 */
router.delete('/channels/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationName, reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid channel identifier format' });
    }

    const channel = await ChannelModel.findById(id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Explicit confirmation validation
    const expectedName = channel.name.trim().toLowerCase();
    const providedName = confirmationName ? confirmationName.trim().toLowerCase() : '';

    if (expectedName !== providedName) {
      return res.status(400).json({
        error: `Deletion requires typing the exact channel name "${channel.name}" to confirm`
      });
    }

    const channelName = channel.name;
    const channelIdStr = channel._id.toString();

    // Safely delete channel and associated messages
    await ChannelModel.findByIdAndDelete(channel._id);
    await MessageModel.deleteMany({ conversation: channel._id });

    // Create Audit Log entry
    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'CHANNEL_DELETED',
      targetType: 'channel',
      targetId: channelIdStr,
      targetLabel: channelName,
      reason: reason || 'Channel deleted by administrator',
      meta: { channelName }
    });

    res.json({
      ok: true,
      message: `Channel #${channelName} and associated messages have been permanently deleted`,
      deletedChannelId: channelIdStr
    });
  } catch (err) {
    console.error('Admin delete channel error:', err);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// ─── Moderation & Reports Endpoints (Part 3) ────────────────────────────────

/**
 * GET /api/admin/reports
 * Paginated reports list with status, category, targetType, and search filters
 */
router.get('/reports', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { status, category, targetType, priority, search, startDate, endDate, sortBy, sortOrder } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.status = { $in: ['pending', 'open'] };
      } else {
        query.status = status;
      }
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by targetType
    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Text search filter
    if (search && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: rx },
        { assignedUsername: rx },
        { 'snapshot.senderUsername': rx },
        { 'snapshot.targetUsername': rx },
        { 'snapshot.channelName': rx }
      ];
    }

    // Sort order
    const sort = {};
    const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [total, reports] = await Promise.all([
      ModerationReportModel.countDocuments(query),
      ModerationReportModel.find(query)
        .populate('reportedBy', 'username avatar')
        .populate('reportedUser', 'username avatar role isSuspended warningCount')
        .populate('reportedChannel', 'name isGroup isArchived isRestricted')
        .populate('reportedMessage', 'content isRestricted createdAt')
        .populate('assignedTo', 'username avatar')
        .populate('resolvedBy', 'username')
        .sort(sort)
        .skip(skip)
        .limit(limit)
    ]);

    const formattedReports = reports.map(r => formatReport(r, true));

    res.json({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('Admin get reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /api/admin/reports/:id
 * Detailed report view with target history and previous moderation actions
 */
router.get('/reports/:id', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid report ID format' });
    }

    const report = await ModerationReportModel.findById(id)
      .populate('reportedBy', 'username avatar email createdAt')
      .populate('reportedUser', 'username avatar role isSuspended suspendedReason suspendedUntil warningCount warnings appeals createdAt')
      .populate('reportedChannel', 'name isGroup isArchived isRestricted memberCount createdAt')
      .populate('reportedMessage', 'content isRestricted restrictedReason conversation sender createdAt')
      .populate('assignedTo', 'username avatar')
      .populate('resolvedBy', 'username');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Explicitly audit access to flagged message context
    if (report.targetType === 'message') {
      try {
        await AuditLogModel.create({
          actor: req.user.id,
          actorUsername: req.user.username,
          action: 'REPORT_MESSAGE_INSPECTED',
          targetType: 'message',
          targetId: (report.reportedMessage?._id || report.reportedMessage || report.snapshot?.messageId || 'unknown').toString(),
          targetLabel: `Report #${report._id.toString().slice(-6)}`,
          reason: `Flagged message context inspected during moderation review`,
          meta: { reportId: report._id.toString() }
        });
      } catch (aErr) {
        console.error('Audit log report message error:', aErr);
      }
    }

    // Determine target ID for history lookup
    let targetUserId = null;
    if (report.reportedUser) {
      targetUserId = report.reportedUser._id || report.reportedUser;
    } else if (report.snapshot?.senderId) {
      targetUserId = report.snapshot.senderId;
    }

    let targetHistory = {
      previousReports: [],
      auditLogs: []
    };

    if (targetUserId) {
      const targetIdStr = targetUserId.toString();
      const [prevReports, logs] = await Promise.all([
        ModerationReportModel.find({
          _id: { $ne: report._id },
          $or: [
            { reportedUser: targetUserId },
            { 'snapshot.senderId': targetIdStr }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(5),
        AuditLogModel.find({
          targetId: targetIdStr
        })
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      targetHistory.previousReports = prevReports.map(r => formatReport(r, false));
      targetHistory.auditLogs = logs.map(l => ({
        id: l._id.toString(),
        action: l.action,
        actorUsername: l.actorUsername,
        reason: l.reason,
        createdAt: l.createdAt
      }));
    }

    res.json({
      report: formatReport(report, true),
      targetHistory
    });
  } catch (err) {
    console.error('Admin get report details error:', err);
    res.status(500).json({ error: 'Failed to fetch report details' });
  }
});

/**
 * PATCH /api/admin/reports/:id/assign
 * Assign or claim a report for review
 */
router.patch('/reports/:id/assign', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid report ID format' });
    }

    const { assignToMe, assigneeId } = req.body;
    let targetAssignee = null;

    if (assignToMe || !assigneeId) {
      targetAssignee = req.user;
    } else {
      if (!isValidObjectId(assigneeId)) {
        return res.status(400).json({ error: 'Invalid assigneeId format' });
      }
      targetAssignee = await UserModel.findById(assigneeId);
      if (!targetAssignee) {
        return res.status(404).json({ error: 'Assignee user not found' });
      }
    }

    const report = await ModerationReportModel.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.assignedTo = targetAssignee._id;
    report.assignedUsername = targetAssignee.username;
    if (report.status === 'pending' || report.status === 'open') {
      report.status = 'under_review';
    }
    report.updatedAt = new Date();
    await report.save();

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'REPORT_ASSIGNED',
      targetType: 'report',
      targetId: report._id.toString(),
      targetLabel: `Report #${report._id.toString().slice(-6)}`,
      reason: `Assigned to @${targetAssignee.username}`,
      meta: { assignee: targetAssignee.username }
    });

    res.json({
      ok: true,
      message: `Report assigned to @${targetAssignee.username}`,
      report: formatReport(report, true)
    });
  } catch (err) {
    console.error('Admin assign report error:', err);
    res.status(500).json({ error: 'Failed to assign report' });
  }
});

/**
 * PATCH /api/admin/reports/:id/status
 * Update report status (under_review, resolved, dismissed, appealed) with notes & outcome
 */
router.patch('/reports/:id/status', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid report ID format' });
    }

    const { status, resolution, outcome, notes } = req.body;
    const validStatuses = ['pending', 'open', 'under_review', 'resolved', 'dismissed', 'appealed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Permitted: ${validStatuses.join(', ')}` });
    }

    const report = await ModerationReportModel.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    report.updatedAt = new Date();

    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user.id;
      if (resolution) report.resolution = resolution.trim();
      if (outcome) report.actionTaken = outcome;
    }

    if (notes !== undefined) {
      report.notes = notes ? notes.trim() : '';
    }

    await report.save();

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: `REPORT_${status.toUpperCase()}`,
      targetType: 'report',
      targetId: report._id.toString(),
      targetLabel: `Report #${report._id.toString().slice(-6)}`,
      reason: resolution || notes || `Report status updated to ${status}`,
      meta: { status, outcome: report.actionTaken }
    });

    res.json({
      ok: true,
      message: `Report status updated to ${status}`,
      report: formatReport(report, true)
    });
  } catch (err) {
    console.error('Admin update report status error:', err);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

/**
 * POST /api/admin/moderation/warn
 * Issue an official warning to a user
 */
router.post('/moderation/warn', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { userId, reason, reportId } = req.body;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Warning reason is required' });
    }

    if (req.user.id.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot issue a warning to yourself' });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Role safeguard: Moderators cannot warn Admins
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
    if (targetUser.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return res.status(403).json({ error: 'The primary system admin account cannot be warned' });
    }
    if (targetUser.role === 'admin' && req.user.role === 'moderator') {
      return res.status(403).json({ error: 'Moderators cannot issue warnings to administrators' });
    }

    const warningItem = {
      reason: reason.trim(),
      warnedBy: req.user.id,
      warnedByUsername: req.user.username,
      warnedAt: new Date(),
      reportId: reportId && isValidObjectId(reportId) ? reportId : null
    };

    targetUser.warnings.push(warningItem);
    targetUser.warningCount = (targetUser.warningCount || 0) + 1;
    await targetUser.save();

    // Notify user via real-time socket event
    notifyUser(userId, 'user-warning', {
      reason: warningItem.reason,
      warnedAt: warningItem.warnedAt
    });

    // If reportId provided, resolve report
    if (reportId && isValidObjectId(reportId)) {
      await ModerationReportModel.findByIdAndUpdate(reportId, {
        status: 'resolved',
        actionTaken: 'warning_issued',
        resolution: `Warning issued to @${targetUser.username}: ${warningItem.reason}`,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'USER_WARNED',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      targetLabel: targetUser.username,
      reason: warningItem.reason,
      meta: { warningCount: targetUser.warningCount, reportId }
    });

    res.json({
      ok: true,
      message: `Official warning issued to @${targetUser.username}`,
      warningCount: targetUser.warningCount
    });
  } catch (err) {
    console.error('Admin warn user error:', err);
    res.status(500).json({ error: 'Failed to issue warning' });
  }
});

/**
 * POST /api/admin/moderation/suspend
 * Temporarily or indefinitely suspend a user account with optional expiry
 */
router.post('/moderation/suspend', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { userId, reason, durationHours, reportId } = req.body;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    if (req.user.id.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Self-lockout protection: You cannot suspend your own account' });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
    if (targetUser.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return res.status(403).json({ error: 'The primary system admin account cannot be suspended' });
    }
    if (targetUser.role === 'admin' && req.user.role === 'moderator') {
      return res.status(403).json({ error: 'Moderators cannot suspend administrators' });
    }

    const hours = parseInt(durationHours, 10);
    const suspendedUntil = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000) : null;

    targetUser.isSuspended = true;
    targetUser.suspendedAt = new Date();
    targetUser.suspendedUntil = suspendedUntil;
    targetUser.suspendedReason = reason.trim();
    targetUser.suspendedBy = req.user.id;
    await targetUser.save();

    // Immediately terminate active Socket.IO connections for the suspended user
    disconnectUserSockets(userId, targetUser.suspendedReason);

    // If reportId provided, resolve report
    if (reportId && isValidObjectId(reportId)) {
      await ModerationReportModel.findByIdAndUpdate(reportId, {
        status: 'resolved',
        actionTaken: 'account_suspended',
        resolution: `Account suspended (${hours > 0 ? `${hours}h` : 'indefinite'}): ${targetUser.suspendedReason}`,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'USER_SUSPENDED',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      targetLabel: targetUser.username,
      reason: targetUser.suspendedReason,
      meta: { durationHours: hours || null, suspendedUntil, reportId }
    });

    res.json({
      ok: true,
      message: `User @${targetUser.username} has been suspended${hours > 0 ? ` for ${hours} hours` : ' indefinitely'}`,
      isSuspended: true,
      suspendedUntil
    });
  } catch (err) {
    console.error('Admin suspend user error:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

/**
 * POST /api/admin/moderation/restore
 * Restore a suspended account
 */
router.post('/moderation/restore', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { userId, reason, reportId } = req.body;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.isSuspended = false;
    targetUser.suspendedAt = null;
    targetUser.suspendedUntil = null;
    targetUser.suspendedReason = '';
    targetUser.suspendedBy = null;
    await targetUser.save();

    if (reportId && isValidObjectId(reportId)) {
      await ModerationReportModel.findByIdAndUpdate(reportId, {
        status: 'resolved',
        resolution: `Suspension lifted: ${reason || 'Restored by moderator'}`,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'USER_RESTORED',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      targetLabel: targetUser.username,
      reason: reason || 'Account suspension lifted by moderator',
      meta: { reportId }
    });

    res.json({
      ok: true,
      message: `Account suspension lifted for @${targetUser.username}`,
      isSuspended: false
    });
  } catch (err) {
    console.error('Admin restore user error:', err);
    res.status(500).json({ error: 'Failed to restore user' });
  }
});

/**
 * POST /api/admin/moderation/restrict-message
 * Restrict or hide a message violating guidelines under defined rules
 */
router.post('/moderation/restrict-message', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { messageId, reason, reportId } = req.body;
    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({ error: 'Invalid or missing messageId' });
    }

    const msg = await MessageModel.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    msg.isRestricted = true;
    msg.restrictedReason = reason ? reason.trim() : 'Content violated community rules';
    msg.restrictedAt = new Date();
    msg.restrictedBy = req.user.id;
    await msg.save();

    if (reportId && isValidObjectId(reportId)) {
      await ModerationReportModel.findByIdAndUpdate(reportId, {
        status: 'resolved',
        actionTaken: 'content_restricted',
        resolution: `Message restricted: ${msg.restrictedReason}`,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'MESSAGE_RESTRICTED',
      targetType: 'message',
      targetId: msg._id.toString(),
      targetLabel: `Message in #${msg.conversation}`,
      reason: msg.restrictedReason,
      meta: { reportId }
    });

    res.json({
      ok: true,
      message: 'Message restricted successfully',
      messageId: msg._id.toString()
    });
  } catch (err) {
    console.error('Admin restrict message error:', err);
    res.status(500).json({ error: 'Failed to restrict message' });
  }
});

/**
 * POST /api/admin/moderation/restrict-channel
 * Restrict channel access / archive channel under moderation rules
 */
router.post('/moderation/restrict-channel', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { channelId, reason, reportId } = req.body;
    if (!channelId || !isValidObjectId(channelId)) {
      return res.status(400).json({ error: 'Invalid or missing channelId' });
    }

    const chan = await ChannelModel.findById(channelId);
    if (!chan) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    chan.isRestricted = true;
    chan.isArchived = true;
    chan.restrictedReason = reason ? reason.trim() : 'Channel restricted by moderation team';
    chan.restrictedAt = new Date();
    chan.restrictedBy = req.user.id;
    await chan.save();

    if (reportId && isValidObjectId(reportId)) {
      await ModerationReportModel.findByIdAndUpdate(reportId, {
        status: 'resolved',
        actionTaken: 'channel_restricted',
        resolution: `Channel restricted: ${chan.restrictedReason}`,
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'CHANNEL_RESTRICTED',
      targetType: 'channel',
      targetId: chan._id.toString(),
      targetLabel: `#${chan.name}`,
      reason: chan.restrictedReason,
      meta: { reportId }
    });

    res.json({
      ok: true,
      message: `Channel #${chan.name} restricted`,
      channelId: chan._id.toString()
    });
  } catch (err) {
    console.error('Admin restrict channel error:', err);
    res.status(500).json({ error: 'Failed to restrict channel' });
  }
});

/**
 * GET /api/admin/moderation/appeals
 * Review user appeals against suspensions
 */
router.get('/moderation/appeals', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { status } = req.query;
    const usersWithAppeals = await UserModel.find(
      { 'appeals.0': { $exists: true } },
      'username email isSuspended suspendedReason suspendedUntil appeals'
    ).sort({ updatedAt: -1 });

    const appealsList = [];
    usersWithAppeals.forEach(u => {
      if (u.appeals && u.appeals.length > 0) {
        u.appeals.forEach(a => {
          if (!status || status === 'all' || a.status === status) {
            appealsList.push({
              appealId: a._id.toString(),
              userId: u._id.toString(),
              username: u.username,
              email: u.email,
              isSuspended: Boolean(u.isSuspended),
              suspendedReason: u.suspendedReason,
              suspendedUntil: u.suspendedUntil,
              statement: a.statement,
              status: a.status,
              submittedAt: a.submittedAt,
              reviewedBy: a.reviewedBy,
              reviewedAt: a.reviewedAt,
              decisionNotes: a.decisionNotes
            });
          }
        });
      }
    });

    appealsList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({ appeals: appealsList });
  } catch (err) {
    console.error('Admin get appeals error:', err);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

/**
 * PATCH /api/admin/moderation/appeals/:userId/:appealId
 * Review and decide on a user appeal (approve or reject)
 */
router.patch('/moderation/appeals/:userId/:appealId', requireRoles('admin', 'moderator'), async (req, res) => {
  try {
    const { userId, appealId } = req.params;
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: "Invalid decision. Permitted: 'approved', 'rejected'" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const appeal = user.appeals.id(appealId);
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    appeal.status = decision;
    appeal.reviewedBy = req.user.id;
    appeal.reviewedAt = new Date();
    appeal.decisionNotes = notes ? notes.trim() : '';

    // If appeal is approved, automatically lift suspension
    if (decision === 'approved') {
      user.isSuspended = false;
      user.suspendedReason = '';
      user.suspendedUntil = null;
      user.suspendedBy = null;
    }

    await user.save();

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: `APPEAL_${decision.toUpperCase()}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetLabel: user.username,
      reason: notes || `Appeal ${decision} by moderator`,
      meta: { appealId, decision }
    });

    res.json({
      ok: true,
      message: `Appeal marked as ${decision}${decision === 'approved' ? ' (user un-suspended)' : ''}`,
      decision,
      isSuspended: user.isSuspended
    });
  } catch (err) {
    console.error('Admin decide appeal error:', err);
    res.status(500).json({ error: 'Failed to process appeal' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/announcements
 * Paginated list of platform announcements with search and filters.
 */
router.get('/announcements', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status || 'all';
    const category = req.query.category || 'all';

    const filter = {};

    if (status !== 'all') {
      filter.status = status;
    }

    if (category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const [docs, total] = await Promise.all([
      AnnouncementModel.find(filter)
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AnnouncementModel.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      announcements: docs.map(formatAnnouncement),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Admin get announcements error:', err);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

/**
 * POST /api/admin/announcements
 * Author and publish a new announcement.
 */
router.post('/announcements', adminAuth, async (req, res) => {
  try {
    const {
      title,
      content,
      category = 'general',
      status = 'draft',
      priority = 'normal',
      isDismissible = true,
      expiresAt = null
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Announcement title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Announcement content is required' });
    }

    const validCategories = ['general', 'maintenance', 'security', 'feature', 'incident'];
    const validStatuses = ['draft', 'published', 'archived'];
    const validPriorities = ['low', 'normal', 'high', 'urgent'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid announcement category' });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid announcement status' });
    }
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid announcement priority' });
    }

    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      category,
      status,
      priority,
      isDismissible: Boolean(isDismissible),
      author: req.user.id,
      authorUsername: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (!isNaN(expDate.getTime())) {
        announcementData.expiresAt = expDate;
      }
    }

    if (status === 'published') {
      announcementData.publishedAt = new Date();
    }

    const doc = await AnnouncementModel.create(announcementData);
    const populated = await AnnouncementModel.findById(doc._id).populate('author', 'username avatar');
    const formatted = formatAnnouncement(populated);

    // Audit log
    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: status === 'published' ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_CREATED',
      targetType: 'announcement',
      targetId: doc._id.toString(),
      targetLabel: doc.title,
      meta: { category, status, priority }
    });

    // Real-time broadcast if published immediately
    if (status === 'published' && typeof broadcastAnnouncement === 'function') {
      broadcastAnnouncement(formatted);
    }

    res.status(201).json({
      ok: true,
      announcement: formatted
    });
  } catch (err) {
    console.error('Admin create announcement error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

/**
 * GET /api/admin/announcements/:id
 */
router.get('/announcements/:id', adminAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }

    const doc = await AnnouncementModel.findById(req.params.id).populate('author', 'username avatar');
    if (!doc) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      ok: true,
      announcement: formatAnnouncement(doc)
    });
  } catch (err) {
    console.error('Admin get announcement details error:', err);
    res.status(500).json({ error: 'Failed to retrieve announcement details' });
  }
});

/**
 * PUT /api/admin/announcements/:id
 * Edit existing announcement.
 */
router.put('/announcements/:id', adminAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }

    const doc = await AnnouncementModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const {
      title,
      content,
      category,
      status,
      priority,
      isDismissible,
      expiresAt
    } = req.body;

    if (title && !title.trim()) {
      return res.status(400).json({ error: 'Announcement title cannot be empty' });
    }
    if (content && !content.trim()) {
      return res.status(400).json({ error: 'Announcement content cannot be empty' });
    }

    if (title) doc.title = title.trim();
    if (content) doc.content = content.trim();
    if (category) doc.category = category;
    if (priority) doc.priority = priority;
    if (typeof isDismissible === 'boolean') doc.isDismissible = isDismissible;

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        doc.expiresAt = null;
      } else {
        const expDate = new Date(expiresAt);
        if (!isNaN(expDate.getTime())) doc.expiresAt = expDate;
      }
    }

    const wasDraft = doc.status === 'draft';
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      doc.status = status;
      if (status === 'published' && (wasDraft || !doc.publishedAt)) {
        doc.publishedAt = new Date();
      }
    }

    doc.updatedAt = new Date();
    await doc.save();

    const populated = await AnnouncementModel.findById(doc._id).populate('author', 'username avatar');
    const formatted = formatAnnouncement(populated);

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'ANNOUNCEMENT_UPDATED',
      targetType: 'announcement',
      targetId: doc._id.toString(),
      targetLabel: doc.title,
      meta: { status: doc.status, category: doc.category }
    });

    if (doc.status === 'published' && typeof broadcastAnnouncement === 'function') {
      broadcastAnnouncement(formatted);
    }

    res.json({
      ok: true,
      announcement: formatted
    });
  } catch (err) {
    console.error('Admin update announcement error:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

/**
 * PATCH /api/admin/announcements/:id/status
 * Quick status transition (draft -> published -> archived).
 */
router.patch('/announcements/:id/status', adminAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }

    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Allowed: draft, published, archived' });
    }

    const doc = await AnnouncementModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const prevStatus = doc.status;
    doc.status = status;
    if (status === 'published' && (!doc.publishedAt || prevStatus === 'draft')) {
      doc.publishedAt = new Date();
    }
    doc.updatedAt = new Date();
    await doc.save();

    const populated = await AnnouncementModel.findById(doc._id).populate('author', 'username avatar');
    const formatted = formatAnnouncement(populated);

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: `ANNOUNCEMENT_${status.toUpperCase()}`,
      targetType: 'announcement',
      targetId: doc._id.toString(),
      targetLabel: doc.title,
      meta: { prevStatus, status }
    });

    if (status === 'published' && typeof broadcastAnnouncement === 'function') {
      broadcastAnnouncement(formatted);
    }

    res.json({
      ok: true,
      announcement: formatted
    });
  } catch (err) {
    console.error('Admin change announcement status error:', err);
    res.status(500).json({ error: 'Failed to update announcement status' });
  }
});

/**
 * DELETE /api/admin/announcements/:id
 */
router.delete('/announcements/:id', adminAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }

    const doc = await AnnouncementModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const title = doc.title;
    await AnnouncementModel.findByIdAndDelete(req.params.id);

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'ANNOUNCEMENT_DELETED',
      targetType: 'announcement',
      targetId: req.params.id,
      targetLabel: title
    });

    res.json({
      ok: true,
      message: 'Announcement deleted successfully',
      id: req.params.id
    });
  } catch (err) {
    console.error('Admin delete announcement error:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SETTINGS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/settings
 * Returns all configured platform settings and metadata.
 */
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const data = await store.getAllPlatformSettings();
    res.json({
      ok: true,
      ...data
    });
  } catch (err) {
    console.error('Admin get settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve platform settings' });
  }
});

/**
 * PATCH /api/admin/settings
 * Update platform configuration (Strictly restricted to Admin role).
 */
router.patch('/settings', adminAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Request body must be an object of settings' });
    }

    const updatedKeys = [];

    // 1. Maintenance Mode
    if (updates.maintenanceMode !== undefined) {
      let val = updates.maintenanceMode;
      if (typeof val === 'boolean') {
        val = { enabled: val, message: 'NexChat is undergoing maintenance. Please check back shortly.' };
      }
      if (typeof val !== 'object' || typeof val.enabled !== 'boolean') {
        return res.status(400).json({ error: 'maintenanceMode must be a boolean or object with boolean enabled' });
      }
      await store.setPlatformSetting('maintenanceMode', val, req.user.id, 'Controls platform maintenance mode');
      updatedKeys.push('maintenanceMode');

      if (typeof broadcastMaintenance === 'function') {
        broadcastMaintenance(val);
      }

      await AuditLogModel.create({
        actor: req.user.id,
        actorUsername: req.user.username,
        action: val.enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
        targetType: 'setting',
        targetId: 'maintenanceMode',
        targetLabel: val.enabled ? 'Enabled' : 'Disabled',
        meta: val
      });
    }

    // 2. Allow Registration
    if (updates.allowRegistration !== undefined) {
      if (typeof updates.allowRegistration !== 'boolean') {
        return res.status(400).json({ error: 'allowRegistration must be a boolean' });
      }
      await store.setPlatformSetting('allowRegistration', updates.allowRegistration, req.user.id, 'Controls new user registration');
      updatedKeys.push('allowRegistration');

      await AuditLogModel.create({
        actor: req.user.id,
        actorUsername: req.user.username,
        action: 'REGISTRATION_SETTING_UPDATED',
        targetType: 'setting',
        targetId: 'allowRegistration',
        targetLabel: updates.allowRegistration ? 'Allowed' : 'Disabled',
        meta: { allowRegistration: updates.allowRegistration }
      });
    }

    // 3. Announcements Enabled
    if (updates.announcementsEnabled !== undefined) {
      if (typeof updates.announcementsEnabled !== 'boolean') {
        return res.status(400).json({ error: 'announcementsEnabled must be a boolean' });
      }
      await store.setPlatformSetting('announcementsEnabled', updates.announcementsEnabled, req.user.id, 'Controls display of announcements');
      updatedKeys.push('announcementsEnabled');

      await AuditLogModel.create({
        actor: req.user.id,
        actorUsername: req.user.username,
        action: 'ANNOUNCEMENTS_VISIBILITY_UPDATED',
        targetType: 'setting',
        targetId: 'announcementsEnabled',
        targetLabel: updates.announcementsEnabled ? 'Enabled' : 'Disabled',
        meta: { announcementsEnabled: updates.announcementsEnabled }
      });
    }

    // 4. File Upload Ceiling (in MB)
    if (updates.fileUploadCeilingMb !== undefined) {
      const mb = parseInt(updates.fileUploadCeilingMb, 10);
      if (isNaN(mb) || mb < 1 || mb > 50) {
        return res.status(400).json({ error: 'fileUploadCeilingMb must be an integer between 1 and 50 MB' });
      }
      await store.setPlatformSetting('fileUploadCeilingMb', mb, req.user.id, 'Maximum upload file size ceiling in MB');
      updatedKeys.push('fileUploadCeilingMb');

      await AuditLogModel.create({
        actor: req.user.id,
        actorUsername: req.user.username,
        action: 'UPLOAD_CEILING_UPDATED',
        targetType: 'setting',
        targetId: 'fileUploadCeilingMb',
        targetLabel: `${mb} MB`,
        meta: { fileUploadCeilingMb: mb }
      });
    }

    // 5. Feature Flags
    if (updates.featureFlags !== undefined) {
      if (typeof updates.featureFlags !== 'object' || updates.featureFlags === null) {
        return res.status(400).json({ error: 'featureFlags must be an object of boolean flags' });
      }
      const existingFlags = (await store.getPlatformSetting('featureFlags', {})) || {};
      const mergedFlags = { ...existingFlags, ...updates.featureFlags };
      await store.setPlatformSetting('featureFlags', mergedFlags, req.user.id, 'Platform feature toggles');
      updatedKeys.push('featureFlags');

      await AuditLogModel.create({
        actor: req.user.id,
        actorUsername: req.user.username,
        action: 'FEATURE_FLAGS_UPDATED',
        targetType: 'setting',
        targetId: 'featureFlags',
        targetLabel: Object.keys(updates.featureFlags).join(', '),
        meta: mergedFlags
      });
    }

    const refreshed = await store.getAllPlatformSettings();

    res.json({
      ok: true,
      message: `Updated ${updatedKeys.length} settings successfully`,
      updatedKeys,
      ...refreshed
    });
  } catch (err) {
    console.error('Admin update settings error:', err);
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE & UPLOADS MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/storage/metrics
 * Comprehensive storage usage, media type breakdowns, and Cloudinary telemetry.
 */
router.get('/storage/metrics', adminAuth, async (req, res) => {
  try {
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    // Parallel MongoDB queries for real media telemetry
    const [
      totalCount,
      sizeAggregation,
      typeAggregation,
      usageAggregation,
      orphanCount
    ] = await Promise.all([
      MediaUploadModel.countDocuments(),
      MediaUploadModel.aggregate([
        { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
      ]),
      MediaUploadModel.aggregate([
        { $group: { _id: '$fileType', count: { $sum: 1 }, bytes: { $sum: '$fileSize' } } }
      ]),
      MediaUploadModel.aggregate([
        { $group: { _id: '$usageType', count: { $sum: 1 }, bytes: { $sum: '$fileSize' } } }
      ]),
      MediaUploadModel.countDocuments({ isOrphan: true })
    ]);

    const totalBytes = sizeAggregation[0]?.totalBytes || 0;
    const totalMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    const fileTypes = {
      image: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      document: { count: 0, bytes: 0 },
      raw: { count: 0, bytes: 0 }
    };
    (typeAggregation || []).forEach(t => {
      if (t._id && fileTypes[t._id]) {
        fileTypes[t._id] = { count: t.count, bytes: t.bytes };
      }
    });

    const usageTypes = {
      message_attachment: 0,
      user_avatar: 0,
      channel_avatar: 0,
      unlinked: 0,
      orphan: orphanCount
    };
    (usageAggregation || []).forEach(u => {
      if (u._id && usageTypes[u._id] !== undefined) {
        usageTypes[u._id] = u.count;
      }
    });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const maskedCloud = cloudName
      ? (cloudName.length > 3 ? `${cloudName.slice(0, 3)}***` : '***')
      : null;

    res.json({
      ok: true,
      storage: {
        totalFiles: totalCount,
        totalBytes,
        totalMb,
        orphanedFilesCount: orphanCount,
        fileTypes,
        usageTypes
      },
      provider: {
        name: hasCloudinary ? 'Cloudinary' : 'Local Storage',
        configured: hasCloudinary,
        cloudNameMasked: maskedCloud,
        status: hasCloudinary ? 'operational' : 'local_storage_fallback'
      }
    });
  } catch (err) {
    console.error('Admin storage metrics error:', err);
    res.status(500).json({ error: 'Failed to retrieve storage metrics' });
  }
});

/**
 * GET /api/admin/storage/files
 * Paginated media browser with search and type filters.
 */
router.get('/storage/files', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const search = req.query.search ? req.query.search.trim() : '';
    const fileType = req.query.fileType || 'all';
    const usageType = req.query.usageType || 'all';
    const isOrphan = req.query.isOrphan;

    const filter = {};

    if (fileType !== 'all') {
      filter.fileType = fileType;
    }
    if (usageType !== 'all') {
      filter.usageType = usageType;
    }
    if (isOrphan === 'true') {
      filter.isOrphan = true;
    } else if (isOrphan === 'false') {
      filter.isOrphan = false;
    }

    if (search) {
      filter.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { uploaderUsername: { $regex: search, $options: 'i' } }
      ];
    }

    const [docs, total] = await Promise.all([
      MediaUploadModel.find(filter)
        .populate('uploader', 'username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MediaUploadModel.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      files: docs.map(formatMediaUpload),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Admin get storage files error:', err);
    res.status(500).json({ error: 'Failed to retrieve storage files' });
  }
});

/**
 * POST /api/admin/storage/scan-orphans
 * Analyzes stored uploads against all messages, user avatars, and channel avatars.
 * Identifies unreferenced files and marks them as eligible for cleanup.
 */
router.post('/storage/scan-orphans', adminAuth, async (req, res) => {
  try {
    // 1. Gather all referenced URLs
    const [messagesWithMedia, userAvatars, channelAvatars, allUploads] = await Promise.all([
      MessageModel.find({ 'attachments.0': { $exists: true } }).select('attachments').lean(),
      UserModel.find({ avatar: { $ne: '' } }).select('avatar').lean(),
      ChannelModel.find({ avatar: { $ne: '' } }).select('avatar').lean(),
      MediaUploadModel.find().lean()
    ]);

    const referencedUrls = new Set();

    messagesWithMedia.forEach(m => {
      (m.attachments || []).forEach(att => {
        if (att.url) referencedUrls.add(att.url);
      });
    });

    userAvatars.forEach(u => {
      if (u.avatar) referencedUrls.add(u.avatar);
    });

    channelAvatars.forEach(c => {
      if (c.avatar) referencedUrls.add(c.avatar);
    });

    let orphanedCount = 0;
    let orphanedBytes = 0;
    const orphanIds = [];
    const activeIds = [];

    allUploads.forEach(file => {
      if (!referencedUrls.has(file.url)) {
        orphanedCount++;
        orphanedBytes += (file.fileSize || 0);
        orphanIds.push(file._id);
      } else {
        activeIds.push(file._id);
      }
    });

    // Update statuses
    if (orphanIds.length > 0) {
      await MediaUploadModel.updateMany(
        { _id: { $in: orphanIds } },
        { $set: { isOrphan: true, usageType: 'orphan', updatedAt: new Date() } }
      );
    }

    if (activeIds.length > 0) {
      await MediaUploadModel.updateMany(
        { _id: { $in: activeIds } },
        { $set: { isOrphan: false, updatedAt: new Date() } }
      );
    }

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'STORAGE_ORPHAN_SCAN_COMPLETED',
      targetType: 'storage',
      targetLabel: `${orphanedCount} orphans detected`,
      meta: { totalScanned: allUploads.length, orphanedCount, orphanedBytes }
    });

    res.json({
      ok: true,
      totalScanned: allUploads.length,
      orphanedCount,
      orphanedBytes,
      orphanedMb: Math.round((orphanedBytes / (1024 * 1024)) * 100) / 100
    });
  } catch (err) {
    console.error('Admin scan orphans error:', err);
    res.status(500).json({ error: 'Failed to scan for orphaned media' });
  }
});

/**
 * POST /api/admin/storage/cleanup-orphan
 * Carefully confirmed deletion of a single verified orphaned file.
 * Strictly verifies the file is not in use before deletion.
 */
router.post('/storage/cleanup-orphan', adminAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const { fileId, confirm } = req.body;
    if (!fileId || !isValidObjectId(fileId)) {
      return res.status(400).json({ error: 'A valid fileId is required' });
    }
    if (confirm !== true) {
      return res.status(400).json({ error: 'Explicit confirmation (confirm: true) is required for file deletion' });
    }

    const file = await MediaUploadModel.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    // Safety verification: Ensure the file is not referenced anywhere in chat
    const inMessages = await MessageModel.findOne({ 'attachments.url': file.url });
    const inUsers = await UserModel.findOne({ avatar: file.url });
    const inChannels = await ChannelModel.findOne({ avatar: file.url });

    if (inMessages || inUsers || inChannels) {
      // Revert orphan status
      file.isOrphan = false;
      file.usageType = inMessages ? 'message_attachment' : 'user_avatar';
      await file.save();
      return res.status(400).json({
        error: 'Safety check prevented deletion: file is actively referenced in application messages or avatars'
      });
    }

    // Cloudinary deletion if publicId is known
    if (file.publicId) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
      } catch (cloudErr) {
        console.warn('Cloudinary destroy warning (proceeding with DB cleanup):', cloudErr.message);
      }
    }

    const fileName = file.fileName;
    const freedBytes = file.fileSize;
    await MediaUploadModel.findByIdAndDelete(fileId);

    await AuditLogModel.create({
      actor: req.user.id,
      actorUsername: req.user.username,
      action: 'MEDIA_FILE_CLEANUP',
      targetType: 'media_file',
      targetId: fileId,
      targetLabel: fileName,
      reason: 'Confirmed orphaned media file cleanup',
      meta: { freedBytes, publicId: file.publicId }
    });

    res.json({
      ok: true,
      message: `File '${fileName}' successfully cleaned up`,
      fileId,
      freedBytes
    });
  } catch (err) {
    console.error('Admin cleanup orphan error:', err);
    res.status(500).json({ error: 'Failed to clean up orphaned media file' });
  }
});

function escapeRegex(string) {
  return typeof string === 'string' ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
}

/**
 * GET /api/admin/audit-logs
 * Admin-only paginated audit log viewer with comprehensive filtering.
 * Strictly read-only; entries are immutable and cannot be created, modified, or deleted by any client.
 */
router.get('/audit-logs', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const skip = (page - 1) * limit;

    const {
      action,
      targetType,
      targetId,
      actor,
      result,
      startDate,
      endDate,
      search
    } = req.query;

    const filter = {};

    if (action && action.trim() && action !== 'all') {
      filter.action = action.trim();
    }

    if (targetType && targetType.trim() && targetType !== 'all') {
      filter.targetType = targetType.trim();
    }

    if (targetId && targetId.trim()) {
      filter.targetId = targetId.trim();
    }

    if (result && ['success', 'failure'].includes(result.trim())) {
      filter.result = result.trim();
    }

    if (actor && actor.trim()) {
      const actorTrim = actor.trim();
      if (isValidObjectId(actorTrim)) {
        filter.$or = [
          { actor: actorTrim },
          { actorUsername: { $regex: escapeRegex(actorTrim), $options: 'i' } }
        ];
      } else {
        filter.actorUsername = { $regex: escapeRegex(actorTrim), $options: 'i' };
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchOr = [
        { action: { $regex: safeSearch, $options: 'i' } },
        { targetLabel: { $regex: safeSearch, $options: 'i' } },
        { reason: { $regex: safeSearch, $options: 'i' } },
        { actorUsername: { $regex: safeSearch, $options: 'i' } },
        { targetId: { $regex: safeSearch, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const [total, docs] = await Promise.all([
      AuditLogModel.countDocuments(filter),
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'username avatar role')
        .lean()
    ]);

    const logs = docs.map(doc => ({
      id: doc._id.toString(),
      actor: {
        id: doc.actor ? (doc.actor._id || doc.actor).toString() : null,
        username: doc.actorUsername || (doc.actor && doc.actor.username) || 'System',
        avatar: doc.actor?.avatar || null,
        role: doc.actor?.role || 'admin'
      },
      action: doc.action,
      targetType: doc.targetType || 'unknown',
      targetId: doc.targetId || null,
      targetLabel: doc.targetLabel || null,
      reason: doc.reason || '',
      result: doc.result || 'success',
      meta: doc.meta || {},
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
    }));

    res.json({
      ok: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (err) {
    console.error('Admin get audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve administrative audit logs' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const store = require('../store');
const { authMiddleware } = require('../middleware/auth');
const { reportRateLimiter } = require('../middleware/rateLimiter');
const { UserModel, ChannelModel, MessageModel, ModerationReportModel, AuditLogModel } = store;

const VALID_CATEGORIES = [
  'spam',
  'harassment',
  'impersonation',
  'threats',
  'inappropriate',
  'malicious_links',
  'suspicious',
  'other'
];

/**
 * POST /api/reports
 * Submit a moderation report against a user, message, or channel
 */
router.post('/', authMiddleware, reportRateLimiter, async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { targetType, targetId, category, description } = req.body;

    if (!targetType || !['user', 'message', 'channel'].includes(targetType)) {
      return res.status(400).json({ error: "Invalid targetType. Must be 'user', 'message', or 'channel'" });
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid targetId format' });
    }

    const reportCategory = category && VALID_CATEGORIES.includes(category) ? category : 'other';
    const reportDesc = typeof description === 'string' ? description.trim().slice(0, 1000) : '';

    let reportedUser = null;
    let reportedChannel = null;
    let reportedMessage = null;
    let snapshot = null;

    if (targetType === 'user') {
      if (targetId.toString() === reporterId.toString()) {
        return res.status(400).json({ error: 'You cannot report your own account' });
      }
      const targetUser = await UserModel.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      reportedUser = targetUser._id;
      snapshot = {
        targetUsername: targetUser.username,
        role: targetUser.role
      };
    } else if (targetType === 'message') {
      const targetMsg = await MessageModel.findById(targetId).populate('sender', 'username');
      if (!targetMsg) {
        return res.status(404).json({ error: 'Target message not found' });
      }
      const senderId = targetMsg.sender?._id || targetMsg.sender;
      if (senderId && senderId.toString() === reporterId.toString()) {
        return res.status(400).json({ error: 'You cannot report your own message' });
      }
      reportedMessage = targetMsg._id;
      reportedUser = senderId;
      reportedChannel = targetMsg.conversation;
      snapshot = {
        messageContent: targetMsg.content,
        senderUsername: targetMsg.sender?.username || 'Unknown',
        channelId: targetMsg.conversation?.toString(),
        sentAt: targetMsg.createdAt
      };
    } else if (targetType === 'channel') {
      const targetChan = await ChannelModel.findById(targetId);
      if (!targetChan) {
        return res.status(404).json({ error: 'Target channel not found' });
      }
      reportedChannel = targetChan._id;
      reportedUser = targetChan.owner || null;
      snapshot = {
        channelName: targetChan.name,
        isGroup: targetChan.isGroup
      };
    }

    // Duplicate check: check if same reporter has an open/pending report for this target in last 24h
    const existing = await ModerationReportModel.findOne({
      reportedBy: reporterId,
      targetType,
      ...(targetType === 'user' ? { reportedUser } : {}),
      ...(targetType === 'message' ? { reportedMessage } : {}),
      ...(targetType === 'channel' ? { reportedChannel } : {}),
      status: { $in: ['pending', 'open', 'under_review'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existing) {
      return res.status(409).json({
        error: 'You have already submitted a pending report for this item within the last 24 hours'
      });
    }

    const report = await ModerationReportModel.create({
      reportedBy: reporterId,
      targetType,
      reportedUser,
      reportedChannel,
      reportedMessage,
      category: reportCategory,
      description: reportDesc,
      status: 'pending',
      priority: ['threats', 'harassment'].includes(reportCategory) ? 'high' : 'medium',
      snapshot
    });

    res.status(201).json({
      ok: true,
      reportId: report._id.toString(),
      message: 'Report submitted successfully. It will be reviewed by our moderation team.'
    });
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

/**
 * POST /api/reports/appeal
 * Submit an appeal for a suspended account
 */
router.post('/appeal', async (req, res) => {
  try {
    const { username, email, statement } = req.body;
    if (!username || !statement || statement.trim().length < 10) {
      return res.status(400).json({
        error: 'Username and statement (minimum 10 characters) are required to submit an appeal'
      });
    }

    const query = { username: new RegExp(`^${username.trim()}$`, 'i') };
    if (email) {
      query.email = new RegExp(`^${email.trim()}$`, 'i');
    }

    const user = await UserModel.findOne(query);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (!user.isSuspended) {
      return res.status(400).json({ error: 'This account is not currently suspended' });
    }

    // Check if user has an existing pending appeal
    const hasPending = user.appeals && user.appeals.some(a => a.status === 'pending');
    if (hasPending) {
      return res.status(409).json({ error: 'You already have a pending appeal under review' });
    }

    const appealItem = {
      statement: statement.trim().slice(0, 1500),
      submittedAt: new Date(),
      status: 'pending'
    };

    user.appeals.push(appealItem);
    await user.save();

    // If there is an open or resolved report for this user, flag report as appealed
    await ModerationReportModel.updateMany(
      { reportedUser: user._id, status: { $in: ['pending', 'open', 'under_review', 'resolved'] } },
      { $set: { status: 'appealed', updatedAt: new Date() } }
    );

    await AuditLogModel.create({
      actor: user._id,
      actorUsername: user.username,
      action: 'APPEAL_SUBMITTED',
      targetType: 'user',
      targetId: user._id.toString(),
      targetLabel: user.username,
      reason: 'User submitted suspension appeal',
      meta: { appealLength: statement.length }
    });

    res.json({
      ok: true,
      message: 'Your appeal has been submitted successfully and is awaiting administrator review.'
    });
  } catch (err) {
    console.error('Error submitting appeal:', err);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  statusText: { type: String, default: 'Available' },
  status: { type: String, enum: ['online', 'offline', 'away', 'dnd'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendedAt: { type: Date },
  suspendedUntil: { type: Date, default: null },
  suspendedReason: { type: String, default: '' },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  warnings: [{
    reason: { type: String, required: true },
    warnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    warnedByUsername: { type: String },
    warnedAt: { type: Date, default: Date.now },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'ModerationReport' }
  }],
  warningCount: { type: Number, default: 0 },
  appeals: [{
    statement: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    decisionNotes: { type: String, default: '' }
  }],
  isDeactivated: { type: Boolean, default: false },
  deactivatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const FriendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isGroup: { type: Boolean, default: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  avatar: { type: String, default: '' },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRestricted: { type: Boolean, default: false },
  restrictedReason: { type: String, default: '' },
  restrictedAt: { type: Date },
  restrictedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: { type: String, default: 'text' },
  attachments: [{
    url: String,
    fileType: String,
    fileName: String,
    fileSize: Number
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  replyCount: { type: Number, default: 0 },
  quote: { type: Object, default: null },
  reactions: { type: Object, default: {} },
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date
  }],
  isRestricted: { type: Boolean, default: false },
  restrictedReason: { type: String, default: '' },
  restrictedAt: { type: Date },
  restrictedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ content: 'text' });
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
ChannelSchema.index({ members: 1, updatedAt: -1 });
ChannelSchema.index({ createdAt: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastSeen: -1 });

// ─── Admin Models ────────────────────────────────────────────────────────────

const AuditLogSchema = new mongoose.Schema({
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorUsername: { type: String, required: true },
  action:      { type: String, required: true },   // e.g. 'USER_SUSPENDED', 'ROLE_CHANGED'
  targetType:  { type: String },                   // 'user', 'channel', 'message', 'report', 'setting'
  targetId:    { type: String },
  targetLabel: { type: String },
  reason:      { type: String, default: '' },
  result:      { type: String, enum: ['success', 'failure'], default: 'success' },
  meta:        { type: Object, default: {} },       // extra safe metadata, no secrets
  createdAt:   { type: Date, default: Date.now }
});
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

const ModerationReportSchema = new mongoose.Schema({
  reportedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType:      { type: String, enum: ['user', 'message', 'channel'], default: 'user' },
  reportedUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedChannel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  reportedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  category:        { type: String, enum: ['spam','harassment','impersonation','threats','inappropriate','malicious_links','suspicious','other'], default: 'other' },
  description:     { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'open', 'under_review', 'resolved', 'dismissed', 'appealed'], default: 'pending' },
  priority:        { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  actionTaken:     { type: String, enum: ['none', 'warning_issued', 'account_suspended', 'content_restricted', 'channel_restricted', 'dismissed_no_violation', 'other'], default: 'none' },
  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedUsername:{ type: String, default: '' },
  resolution:      { type: String, default: '' },
  resolvedAt:      { type: Date },
  resolvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:           { type: String, default: '' },
  snapshot:        { type: Object, default: null }, // safe context captured at report creation
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now }
});
ModerationReportSchema.index({ status: 1, createdAt: -1 });
ModerationReportSchema.index({ targetType: 1, createdAt: -1 });
ModerationReportSchema.index({ reportedBy: 1 });
ModerationReportSchema.index({ reportedUser: 1 });

const AnnouncementSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  content:        { type: String, required: true },
  category:       { type: String, enum: ['general','maintenance','security','feature','incident'], default: 'general' },
  status:         { type: String, enum: ['draft','published','archived'], default: 'draft' },
  priority:       { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  isDismissible:  { type: Boolean, default: true },
  author:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorUsername: { type: String },
  publishedAt:    { type: Date },
  expiresAt:      { type: Date },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now }
});
AnnouncementSchema.index({ status: 1, publishedAt: -1 });

const PlatformSettingSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: mongoose.Schema.Types.Mixed },
  description: { type: String, default: '' },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt:   { type: Date, default: Date.now }
});

const MediaUploadSchema = new mongoose.Schema({
  publicId:         { type: String },
  url:              { type: String, required: true },
  fileName:         { type: String, default: 'file' },
  fileSize:         { type: Number, default: 0 },
  fileType:         { type: String, enum: ['image', 'video', 'audio', 'document', 'raw'], default: 'document' },
  mimeType:         { type: String, default: '' },
  uploader:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderUsername: { type: String, default: 'unknown' },
  messageId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  channelId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  usageType:        { type: String, enum: ['message_attachment', 'user_avatar', 'channel_avatar', 'unlinked', 'orphan'], default: 'unlinked' },
  isOrphan:         { type: Boolean, default: false },
  createdAt:        { type: Date, default: Date.now },
  updatedAt:        { type: Date, default: Date.now }
});
MediaUploadSchema.index({ uploader: 1, createdAt: -1 });
MediaUploadSchema.index({ usageType: 1 });
MediaUploadSchema.index({ url: 1 });
MediaUploadSchema.index({ isOrphan: 1 });

const UserModel = mongoose.model('User', UserSchema);
const ChannelModel = mongoose.model('Channel', ChannelSchema);
const MessageModel = mongoose.model('Message', MessageSchema);
const FriendRequestModel = mongoose.model('FriendRequest', FriendRequestSchema);
const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
const ModerationReportModel = mongoose.model('ModerationReport', ModerationReportSchema);
const AnnouncementModel = mongoose.model('Announcement', AnnouncementSchema);
const PlatformSettingModel = mongoose.model('PlatformSetting', PlatformSettingSchema);
const MediaUploadModel = mongoose.model('MediaUpload', MediaUploadSchema);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'
];

// ─── Admin credentials (change password hash via seedAdminUser below) ─────────
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Kaivalya';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@nexchat.local';

async function seedAdminUser() {
  try {
    let adminUser = await UserModel.findOne({ username: new RegExp(`^${ADMIN_USERNAME}$`, 'i') });
    if (!adminUser) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser = await UserModel.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashed,
        role: 'admin',
        isAdmin: true,
        statusText: 'Admin',
        avatar: `https://ui-avatars.com/api/?name=${ADMIN_USERNAME}&background=10b981&color=fff`
      });
      console.log(`👑 Admin user '${ADMIN_USERNAME}' created.`);
    } else {
      const updates = {};
      if (!adminUser.isAdmin || adminUser.role !== 'admin') {
        updates.isAdmin = true;
        updates.role = 'admin';
      }
      const isMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
      if (!isMatch) {
        updates.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
        console.log(`👑 Admin password updated for '${ADMIN_USERNAME}'.`);
      }
      if (Object.keys(updates).length > 0) {
        await UserModel.findByIdAndUpdate(adminUser._id, updates);
      }
    }
  } catch (err) {
    console.error('⚠️  Failed to seed admin user:', err.message);
  }
}

async function initDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime_chat';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/realtime_chat';

  try {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });

    console.log('✅ Connected to Primary MongoDB via Mongoose!');
  } catch (err) {
    console.warn('⚠️ Primary MongoDB connection failed:', err.message);
    
    if (mongoUri !== localFallbackUri) {
      console.log('🔄 Attempting fallback to local MongoDB (127.0.0.1:27017)...');
      try {
        await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to Local MongoDB fallback!');
      } catch (fallbackErr) {
        console.error('❌ Local MongoDB fallback also failed.');
        console.error('\n📌 Action Required:');
        console.error(' 1. Whitelist your current IP in MongoDB Atlas (https://cloud.mongodb.com)');
        console.error(' 2. OR start local MongoDB instance on localhost:27017\n');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  // Seed the admin user after DB is connected
  await seedAdminUser();
}
const store = {
  PRESET_AVATARS,
  initDB,

  async findUserByUsername(username) {
    const user = await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') });
    return user ? formatUser(user) : null;
  },

  async findUserById(id) {
    const user = await UserModel.findById(id);
    return user ? formatUser(user) : null;
  },

  async createUser(userData) {
    const created = await UserModel.create(userData);
    return formatUser(created);
  },

  async updateUser(id, updates) {
    const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' });
    return updated ? formatUser(updated) : null;
  },

  async getAllUsers(requestingUserId) {
    // Non-admin users should not see the admin account
    const requestingUser = await UserModel.findById(requestingUserId);
    const filter = { _id: { $ne: requestingUserId } };
    const isAdminUser = requestingUser && (requestingUser.isAdmin || requestingUser.role === 'admin');
    if (!isAdminUser) {
      filter.isAdmin = { $ne: true };
      filter.role = { $ne: 'admin' };
    }
    const users = await UserModel.find(filter, { password: 0 });
    return users.map(formatPublicUser);
  },

  async searchUsers(query, currentUserId) {
    const requestingUser = await UserModel.findById(currentUserId);
    const filter = {
      _id: { $ne: currentUserId },
      username: { $regex: new RegExp(query, 'i') }
    };
    // Regular users cannot find/DM the admin account
    const isAdminUser = requestingUser && (requestingUser.isAdmin || requestingUser.role === 'admin');
    if (!isAdminUser) {
      filter.isAdmin = { $ne: true };
      filter.role = { $ne: 'admin' };
    }
    const users = await UserModel.find(filter, { password: 0 }).limit(20);
    return users.map(formatPublicUser);
  },

  async getFriends(userId) {
    const user = await UserModel.findById(userId).populate('friends', 'username avatar status statusText');
    if (!user) return [];
    return user.friends.map(f => ({
      id: f._id.toString(),
      username: f.username,
      avatar: f.avatar,
      status: f.status,
      statusText: f.statusText
    }));
  },

  async getFriendRequests(userId) {
    const incoming = await FriendRequestModel.find({ to: userId }).populate('from', 'username avatar');
    const outgoing = await FriendRequestModel.find({ from: userId }).populate('to', 'username avatar');
    return {
      incoming: incoming.map(r => ({ id: r._id.toString(), user: { id: r.from._id.toString(), username: r.from.username, avatar: r.from.avatar } })),
      outgoing: outgoing.map(r => ({ id: r._id.toString(), user: { id: r.to._id.toString(), username: r.to.username, avatar: r.to.avatar } }))
    };
  },

  async sendFriendRequest(fromId, toId) {
    if (fromId.toString() === toId.toString()) throw new Error("Cannot send request to yourself");
    const user = await UserModel.findById(fromId);
    if (user.friends.includes(toId)) throw new Error("Already friends");
    
    const existing = await FriendRequestModel.findOne({
      $or: [
        { from: fromId, to: toId },
        { from: toId, to: fromId }
      ]
    });
    if (existing) throw new Error("Friend request already exists");
    
    const req = await FriendRequestModel.create({ from: fromId, to: toId });
    return req;
  },

  async acceptFriendRequest(requestId, userId) {
    const req = await FriendRequestModel.findById(requestId);
    if (!req) throw new Error("Request not found");
    if (req.to.toString() !== userId.toString()) throw new Error("Unauthorized");
    
    await UserModel.findByIdAndUpdate(req.from, { $addToSet: { friends: req.to } });
    await UserModel.findByIdAndUpdate(req.to, { $addToSet: { friends: req.from } });
    
    await FriendRequestModel.findByIdAndDelete(requestId);
    return true;
  },

  async declineFriendRequest(requestId, userId) {
    const req = await FriendRequestModel.findById(requestId);
    if (!req) throw new Error("Request not found");
    if (req.to.toString() !== userId.toString() && req.from.toString() !== userId.toString()) throw new Error("Unauthorized");
    
    await FriendRequestModel.findByIdAndDelete(requestId);
    return true;
  },
  
  async removeFriend(userId, friendId) {
    await UserModel.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await UserModel.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    return true;
  },

  async getChannelsForUser(userId) {
    const requestingUser = await UserModel.findById(userId);
    const channels = await ChannelModel.find({ members: userId }).sort({ updatedAt: -1 });

    if (requestingUser && (requestingUser.isAdmin || requestingUser.role === 'admin')) {
      // Admin sees everything
      return channels.map(formatChannel);
    }

    // For regular users: find all admin user IDs to filter out admin-exclusive channels
    const adminUsers = await UserModel.find({ $or: [{ isAdmin: true }, { role: 'admin' }] }, { _id: 1 });
    const adminIds = adminUsers.map(a => a._id.toString());

    // Exclude channels where ALL other members are admins (i.e. admin-only chats)
    const filtered = channels.filter(ch => {
      const otherMembers = ch.members
        .map(m => m.toString())
        .filter(m => m !== userId.toString());
      // If every other member is an admin, this is an admin-only channel — hide it
      if (otherMembers.length > 0 && otherMembers.every(m => adminIds.includes(m))) {
        return false;
      }
      return true;
    });

    return filtered.map(formatChannel);
  },

  async getChannelByName(name) {
    const c = await ChannelModel.findOne({ name });
    return c ? formatChannel(c) : null;
  },

  async getChannelById(id) {
    const c = await ChannelModel.findById(id);
    return c ? formatChannel(c) : null;
  },

  async createChannel(channelData) {
    const created = await ChannelModel.create(channelData);
    return formatChannel(created);
  },

  async getOrCreateDM(userAId, userBId) {
    if (userAId === userBId) return null;
    let dm = await ChannelModel.findOne({
      isGroup: false,
      members: { $all: [userAId, userBId], $size: 2 }
    });
    if (!dm) {
      const userA = await UserModel.findById(userAId);
      const userB = await UserModel.findById(userBId);
      const dmName = `DM: ${userA?.username} & ${userB?.username}`;
      dm = await ChannelModel.create({
        name: dmName,
        description: 'Direct Message',
        isGroup: false,
        members: [userAId, userBId],
        admins: [userAId, userBId],
        owner: userAId
      });
    }
    return formatChannel(dm);
  },

  async updateChannel(id, updates) {
    const updated = await ChannelModel.findByIdAndUpdate(id, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: 'after' });
    return updated ? formatChannel(updated) : null;
  },

  async getMessages(channelId, { before, limit = 30 } = {}) {
    const query = { conversation: channelId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    const msgs = await MessageModel.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    return msgs.map(formatMessage).reverse();
  },

  async createMessage(msgData) {
    const doc = await MessageModel.create({
      conversation: msgData.channelId,
      sender: msgData.sender,
      content: msgData.content || '',
      type: msgData.type || 'text',
      attachments: msgData.media || [],
      replyTo: msgData.parentId || null,
      replyCount: 0,
      quote: msgData.quote || null,
      reactions: {},
      deliveredTo: [msgData.sender],
      readBy: [{ userId: msgData.sender, readAt: new Date() }]
    });

    if (msgData.parentId) {
      await MessageModel.findByIdAndUpdate(msgData.parentId, { $inc: { replyCount: 1 } });
    }
    await ChannelModel.findByIdAndUpdate(msgData.channelId, { updatedAt: new Date() });

    // Link uploaded media attachments to message and channel
    if (Array.isArray(msgData.media) && msgData.media.length > 0) {
      const urls = msgData.media.map(m => m.url).filter(Boolean);
      if (urls.length > 0) {
        MediaUploadModel.updateMany(
          { url: { $in: urls } },
          { $set: { messageId: doc._id, channelId: msgData.channelId, usageType: 'message_attachment', isOrphan: false } }
        ).catch(e => console.warn('MediaUploadModel link error:', e.message));
      }
    }

    const populated = await MessageModel.findById(doc._id).populate('sender', 'username avatar');
    return formatMessage(populated);
  },

  async getThreadReplies(replyToId) {
    const replies = await MessageModel.find({ replyTo: replyToId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });
    return replies.map(formatMessage);
  },

  async toggleReaction(messageId, userId, emoji) {
    const msg = await MessageModel.findById(messageId).populate('sender', 'username avatar');
    if (!msg) return null;
    let rx = { ...msg.reactions };
    if (!rx[emoji]) rx[emoji] = [];
    const idx = rx[emoji].indexOf(userId);
    if (idx !== -1) {
      rx[emoji] = rx[emoji].filter(id => id !== userId);
      if (rx[emoji].length === 0) delete rx[emoji];
    } else {
      rx[emoji] = [...rx[emoji], userId];
    }
    msg.reactions = rx;
    msg.markModified('reactions');
    await msg.save();
    return formatMessage(msg);
  },

  async markMessageRead(channelId, userId) {
    await MessageModel.updateMany(
      { conversation: channelId, 'readBy.userId': { $ne: userId } },
      { 
        $push: { readBy: { userId, readAt: new Date() } },
        $addToSet: { deliveredTo: userId }
      }
    );
    return true;
  },

  async markMessageDelivered(messageId, userId) {
    const msg = await MessageModel.findById(messageId);
    if (!msg) return false;
    const strUserId = userId.toString();
    const delivered = msg.deliveredTo.map(id => id.toString());
    if (!delivered.includes(strUserId)) {
      msg.deliveredTo.push(userId);
      await msg.save();
      return true;
    }
    return false;
  },

  async markChannelMessagesDelivered(channelId, userId) {
    await MessageModel.updateMany(
      { conversation: channelId, deliveredTo: { $ne: userId } },
      { $addToSet: { deliveredTo: userId } }
    );
    return true;
  },

  async searchMessages(query, channelId = null, userId) {
    const userChannels = await ChannelModel.find({ members: userId }).select('_id');
    const allowedChannelIds = userChannels.map(c => c._id);

    const filter = { $text: { $search: query } };
    if (channelId) {
      if (!allowedChannelIds.some(id => id.toString() === channelId.toString())) {
        return [];
      }
      filter.conversation = channelId;
    } else {
      filter.conversation = { $in: allowedChannelIds };
    }

    const msgs = await MessageModel.find(filter, { score: { $meta: 'textScore' } })
      .populate('sender', 'username avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(50);
    
    // Fallback to regex if no results (for substring matches)
    if (msgs.length === 0) {
      const fallbackFilter = { content: { $regex: query, $options: 'i' } };
      if (channelId) {
         fallbackFilter.conversation = channelId;
      } else {
         fallbackFilter.conversation = { $in: allowedChannelIds };
      }
      const regexMsgs = await MessageModel.find(fallbackFilter)
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);
      return regexMsgs.map(formatMessage);
    }
    
    return msgs.map(formatMessage);
  },

  async getMessageById(id) {
    const msg = await MessageModel.findById(id).populate('sender', 'username avatar');
    return msg ? formatMessage(msg) : null;
  },

  async updateMessageContent(id, content) {
    const updated = await MessageModel.findByIdAndUpdate(id, { $set: { content } }, { returnDocument: 'after' }).populate('sender', 'username avatar');
    return updated ? formatMessage(updated) : null;
  },

  async deleteMessage(messageId, userId) {
    const msg = await MessageModel.findById(messageId);
    if (!msg) return null;

    const channel = await ChannelModel.findById(msg.conversation);
    const senderId = (msg.sender && msg.sender._id) ? msg.sender._id.toString() : msg.sender.toString();
    const currentUserId = userId ? userId.toString() : '';
    const isSender = senderId === currentUserId;

    const adminIds = channel && channel.admins ? channel.admins.map(a => (a && a._id) ? a._id.toString() : a.toString()) : [];
    const isAdmin = adminIds.includes(currentUserId);

    if (!isSender && !isAdmin) {
      throw new Error('Permission denied to delete message');
    }

    await MessageModel.findByIdAndDelete(messageId);
    await MessageModel.deleteMany({ replyTo: messageId });

    if (msg.replyTo) {
      await MessageModel.findByIdAndUpdate(msg.replyTo, { $inc: { replyCount: -1 } });
    }

    return { messageId: messageId.toString(), channelId: msg.conversation.toString() };
  },

  async getOrCreateDM(user1Id, user2Id) {
    if (user1Id === user2Id) return null;
    let channel = await ChannelModel.findOne({
      isGroup: false,
      members: { $all: [user1Id, user2Id], $size: 2 }
    });
    
    if (!channel) {
      const u1 = await UserModel.findById(user1Id);
      const u2 = await UserModel.findById(user2Id);
      if (!u1 || !u2) return null;
      
      channel = new ChannelModel({
        name: `DM: ${u1.username} & ${u2.username}`,
        isGroup: false,
        members: [user1Id, user2Id],
        admins: [user1Id, user2Id]
      });
      await channel.save();
    }
    
    const formatted = formatChannel(channel);
    const populated = await ChannelModel.findById(channel._id).populate('members');
    formatted.membersData = populated.members.map(m => formatPublicUser(m));
    return formatted;
  },

  async deleteChannel(channelId, userId) {
    const channel = await ChannelModel.findById(channelId);
    if (!channel) return null;

    const currentUserId = userId ? userId.toString() : '';
    const memberIds = channel.members ? channel.members.map(m => (m && m._id) ? m._id.toString() : m.toString()) : [];
    const isMember = memberIds.includes(currentUserId);

    if (!isMember) {
      throw new Error('Access denied to this channel');
    }

    const adminIds = channel.admins ? channel.admins.map(a => (a && a._id) ? a._id.toString() : a.toString()) : [];
    const isAdmin = adminIds.includes(currentUserId);
    const ownerId = channel.owner ? ((channel.owner && channel.owner._id) ? channel.owner._id.toString() : channel.owner.toString()) : null;
    const isOwner = ownerId ? ownerId === currentUserId : isAdmin;

    if (channel.isGroup && !isAdmin && !isOwner) {
      const updatedMembers = channel.members.filter(m => {
        const mId = (m && m._id) ? m._id.toString() : m.toString();
        return mId !== currentUserId;
      });
      const updatedAdmins = channel.admins.filter(a => {
        const aId = (a && a._id) ? a._id.toString() : a.toString();
        return aId !== currentUserId;
      });
      await ChannelModel.findByIdAndUpdate(channelId, { members: updatedMembers, admins: updatedAdmins });
      return { channelId: channelId.toString(), action: 'left' };
    }

    await ChannelModel.findByIdAndDelete(channelId);
    await MessageModel.deleteMany({ conversation: channelId });

    return { channelId: channelId.toString(), action: 'deleted' };
  },

  async getOverviewStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalChannels,
      totalMessages,
      groupChannels,
      adminCount,
      moderatorCount,
      suspendedCount,
      deactivatedCount,
      newUsersPast7Days,
      newMessagesPast7Days,
      newChannelsPast7Days,
      pendingReportsCount,
      pendingAppealsCount,
      resolvedReportsCount,
      recentUsersRaw,
      recentChannelsRaw,
      recentAuditLogsRaw
    ] = await Promise.all([
      UserModel.countDocuments(),
      ChannelModel.countDocuments(),
      MessageModel.countDocuments(),
      ChannelModel.countDocuments({ isGroup: true }),
      UserModel.countDocuments({ $or: [{ isAdmin: true }, { role: 'admin' }] }),
      UserModel.countDocuments({ role: 'moderator' }),
      UserModel.countDocuments({ isSuspended: true }),
      UserModel.countDocuments({ isDeactivated: true }),
      UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      MessageModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ChannelModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ModerationReportModel.countDocuments({ status: { $in: ['pending', 'open'] } }),
      UserModel.countDocuments({ 'appeals.status': 'pending' }),
      ModerationReportModel.countDocuments({ status: 'resolved' }),
      UserModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username avatar role isAdmin isSuspended isDeactivated createdAt')
        .lean(),
      ChannelModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name isGroup members isArchived isRestricted createdAt')
        .lean(),
      AuditLogModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('actorUsername action targetType targetLabel result createdAt')
        .lean()
    ]);

    const dmChannels = Math.max(0, totalChannels - groupChannels);
    const activeUsers = Math.max(0, totalUsers - suspendedCount - deactivatedCount);

    const recentUsers = (recentUsersRaw || []).map(u => ({
      id: u._id.toString(),
      username: u.username,
      avatar: u.avatar || '',
      role: u.role || (u.isAdmin ? 'admin' : 'user'),
      isSuspended: Boolean(u.isSuspended),
      isDeactivated: Boolean(u.isDeactivated),
      createdAt: u.createdAt
    }));

    const recentChannels = (recentChannelsRaw || []).map(c => ({
      id: c._id.toString(),
      name: c.name,
      isGroup: Boolean(c.isGroup),
      memberCount: Array.isArray(c.members) ? c.members.length : 0,
      isArchived: Boolean(c.isArchived),
      isRestricted: Boolean(c.isRestricted),
      createdAt: c.createdAt
    }));

    const recentAuditLogs = (recentAuditLogsRaw || []).map(a => ({
      id: a._id.toString(),
      actorUsername: a.actorUsername,
      action: a.action,
      targetType: a.targetType || '',
      targetLabel: a.targetLabel || '',
      result: a.result,
      createdAt: a.createdAt
    }));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedCount,
        deactivated: deactivatedCount,
        admins: adminCount,
        moderators: moderatorCount,
        regular: Math.max(0, totalUsers - adminCount - moderatorCount)
      },
      channels: {
        total: totalChannels,
        groups: groupChannels,
        dms: dmChannels
      },
      messages: {
        total: totalMessages
      },
      velocity: {
        windowDays: 7,
        newUsers: newUsersPast7Days,
        newMessages: newMessagesPast7Days,
        newChannels: newChannelsPast7Days
      },
      moderation: {
        pendingReports: pendingReportsCount,
        pendingAppeals: pendingAppealsCount,
        resolvedReports: resolvedReportsCount
      },
      recentActivity: {
        users: recentUsers,
        channels: recentChannels,
        auditLogs: recentAuditLogs
      }
    };
  },

  async getPlatformSetting(key, defaultValue = null) {
    try {
      const doc = await PlatformSettingModel.findOne({ key });
      return doc ? doc.value : defaultValue;
    } catch (err) {
      console.warn(`Error getting setting ${key}:`, err.message);
      return defaultValue;
    }
  },

  async setPlatformSetting(key, value, userId = null, description = '') {
    const update = {
      value,
      updatedAt: new Date()
    };
    if (userId) update.updatedBy = userId;
    if (description) update.description = description;

    const doc = await PlatformSettingModel.findOneAndUpdate(
      { key },
      { $set: update },
      { upsert: true, returnDocument: 'after' }
    );
    return doc;
  },

  async getAllPlatformSettings() {
    const defaultSettings = {
      maintenanceMode: {
        enabled: false,
        message: 'NexChat is currently undergoing scheduled maintenance. Please check back shortly.'
      },
      allowRegistration: true,
      announcementsEnabled: true,
      fileUploadCeilingMb: 25,
      featureFlags: {
        enableVoiceAudioNotes: true,
        enableMessageReactions: true,
        enableRichMediaUploads: true,
        requireEmailForAppeals: false
      }
    };

    const docs = await PlatformSettingModel.find().lean();
    const settingsMap = { ...defaultSettings };
    const meta = {};

    docs.forEach(doc => {
      settingsMap[doc.key] = doc.value;
      meta[doc.key] = {
        updatedBy: doc.updatedBy,
        updatedAt: doc.updatedAt,
        description: doc.description
      };
    });

    return { settings: settingsMap, meta };
  }
};

function formatUser(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const role = obj.role || (obj.isAdmin ? 'admin' : 'user');
  const isAdmin = Boolean(obj.role === 'admin' || obj.isAdmin);
  return {
    id: obj._id.toString(),
    username: obj.username,
    email: obj.email,
    password: obj.password,
    avatar: obj.avatar,
    statusText: obj.statusText,
    status: obj.status,
    lastSeen: obj.lastSeen,
    role,
    isAdmin,
    isSuspended: Boolean(obj.isSuspended),
    suspendedAt: obj.suspendedAt || null,
    suspendedUntil: obj.suspendedUntil || null,
    suspendedReason: obj.suspendedReason || '',
    suspendedBy: obj.suspendedBy ? obj.suspendedBy.toString() : null,
    warningCount: obj.warningCount || 0,
    warnings: obj.warnings || [],
    appeals: obj.appeals || [],
    isDeactivated: Boolean(obj.isDeactivated),
    deactivatedAt: obj.deactivatedAt || null,
    friends: obj.friends ? obj.friends.map(f => typeof f === 'object' && f._id ? f._id.toString() : f.toString()) : [],
    createdAt: obj.createdAt
  };
}

function formatPublicUser(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const role = obj.role || (obj.isAdmin ? 'admin' : 'user');
  const isAdmin = Boolean(obj.role === 'admin' || obj.isAdmin);
  return {
    id: obj._id.toString(),
    username: obj.username,
    avatar: obj.avatar,
    statusText: obj.statusText,
    status: obj.status,
    role,
    isAdmin,
    warningCount: obj.warningCount || 0,
    isSuspended: Boolean(obj.isSuspended),
    suspendedUntil: obj.suspendedUntil || null,
    isDeactivated: Boolean(obj.isDeactivated),
    lastSeen: obj.lastSeen,
    createdAt: obj.createdAt
  };
}

function formatChannel(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    description: obj.description,
    isGroup: obj.isGroup,
    members: obj.members.map(m => m.toString()),
    admins: obj.admins.map(a => a.toString()),
    owner: obj.owner ? obj.owner.toString() : null,
    avatar: obj.avatar,
    isArchived: Boolean(obj.isArchived),
    archivedAt: obj.archivedAt || null,
    archivedBy: obj.archivedBy ? obj.archivedBy.toString() : null,
    isRestricted: Boolean(obj.isRestricted),
    restrictedReason: obj.restrictedReason || '',
    restrictedAt: obj.restrictedAt || null,
    restrictedBy: obj.restrictedBy ? obj.restrictedBy.toString() : null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

function formatMessage(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id ? obj._id.toString() : '',
    channelId: obj.conversation ? obj.conversation.toString() : null,
    sender: obj.sender && obj.sender._id ? {
      id: obj.sender._id.toString(),
      username: obj.sender.username,
      avatar: obj.sender.avatar
    } : { id: obj.sender ? obj.sender.toString() : null },
    content: obj.isRestricted ? '[Message removed by moderator]' : obj.content,
    isRestricted: Boolean(obj.isRestricted),
    restrictedReason: obj.isRestricted ? (obj.restrictedReason || 'Violated community guidelines') : null,
    type: obj.type,
    media: obj.isRestricted ? [] : (obj.attachments || []),
    parentId: obj.replyTo ? obj.replyTo.toString() : null,
    replyCount: obj.replyCount || 0,
    quote: obj.quote || null,
    reactions: obj.reactions || {},
    deliveredTo: obj.deliveredTo ? obj.deliveredTo.map(d => d.toString()) : [],
    readBy: obj.readBy ? obj.readBy.map(r => ({
      userId: r.userId ? r.userId.toString() : null,
      readAt: r.readAt
    })) : [],
    createdAt: obj.createdAt
  };
}

function formatReport(doc, includeReporter = true) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    targetType: obj.targetType || 'user',
    reportedUser: obj.reportedUser ? (obj.reportedUser._id ? {
      id: obj.reportedUser._id.toString(),
      username: obj.reportedUser.username,
      avatar: obj.reportedUser.avatar,
      role: obj.reportedUser.role,
      isSuspended: Boolean(obj.reportedUser.isSuspended),
      warningCount: obj.reportedUser.warningCount || 0
    } : { id: obj.reportedUser.toString() }) : null,
    reportedChannel: obj.reportedChannel ? (obj.reportedChannel._id ? {
      id: obj.reportedChannel._id.toString(),
      name: obj.reportedChannel.name,
      isGroup: obj.reportedChannel.isGroup,
      isArchived: Boolean(obj.reportedChannel.isArchived),
      isRestricted: Boolean(obj.reportedChannel.isRestricted)
    } : { id: obj.reportedChannel.toString() }) : null,
    reportedMessage: obj.reportedMessage ? (obj.reportedMessage._id ? {
      id: obj.reportedMessage._id.toString(),
      content: obj.reportedMessage.content,
      isRestricted: Boolean(obj.reportedMessage.isRestricted),
      createdAt: obj.reportedMessage.createdAt
    } : { id: obj.reportedMessage.toString() }) : null,
    category: obj.category,
    description: obj.description,
    status: obj.status,
    priority: obj.priority || 'medium',
    actionTaken: obj.actionTaken || 'none',
    assignedTo: obj.assignedTo ? (obj.assignedTo._id ? {
      id: obj.assignedTo._id.toString(),
      username: obj.assignedTo.username
    } : { id: obj.assignedTo.toString() }) : null,
    assignedUsername: obj.assignedUsername || '',
    resolution: obj.resolution || '',
    resolvedAt: obj.resolvedAt || null,
    resolvedBy: obj.resolvedBy ? (obj.resolvedBy._id ? {
      id: obj.resolvedBy._id.toString(),
      username: obj.resolvedBy.username
    } : { id: obj.resolvedBy.toString() }) : null,
    notes: obj.notes || '',
    snapshot: obj.snapshot || null,
    reportedBy: includeReporter && obj.reportedBy ? (obj.reportedBy._id ? {
      id: obj.reportedBy._id.toString(),
      username: obj.reportedBy.username,
      avatar: obj.reportedBy.avatar
    } : { id: obj.reportedBy.toString() }) : undefined,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

function formatAnnouncement(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id ? obj._id.toString() : '',
    title: obj.title,
    content: obj.content,
    category: obj.category || 'general',
    status: obj.status || 'draft',
    priority: obj.priority || 'normal',
    isDismissible: obj.isDismissible !== false,
    author: obj.author ? (obj.author._id ? {
      id: obj.author._id.toString(),
      username: obj.author.username,
      avatar: obj.author.avatar
    } : { id: obj.author.toString(), username: obj.authorUsername || 'Admin' }) : null,
    authorUsername: obj.authorUsername || '',
    publishedAt: obj.publishedAt || null,
    expiresAt: obj.expiresAt || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

function formatMediaUpload(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id ? obj._id.toString() : '',
    publicId: obj.publicId || '',
    url: obj.url,
    fileName: obj.fileName || 'file',
    fileSize: obj.fileSize || 0,
    fileType: obj.fileType || 'document',
    mimeType: obj.mimeType || '',
    uploader: obj.uploader ? (obj.uploader._id ? {
      id: obj.uploader._id.toString(),
      username: obj.uploader.username
    } : { id: obj.uploader.toString() }) : null,
    uploaderUsername: obj.uploaderUsername || 'unknown',
    messageId: obj.messageId ? obj.messageId.toString() : null,
    channelId: obj.channelId ? obj.channelId.toString() : null,
    usageType: obj.usageType || 'unlinked',
    isOrphan: Boolean(obj.isOrphan),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

module.exports = store;
module.exports.formatUser = formatUser;
module.exports.formatPublicUser = formatPublicUser;
module.exports.formatChannel = formatChannel;
module.exports.formatMessage = formatMessage;
module.exports.formatReport = formatReport;
module.exports.formatAnnouncement = formatAnnouncement;
module.exports.formatMediaUpload = formatMediaUpload;
module.exports.AuditLogModel = AuditLogModel;
module.exports.ModerationReportModel = ModerationReportModel;
module.exports.AnnouncementModel = AnnouncementModel;
module.exports.PlatformSettingModel = PlatformSettingModel;
module.exports.MediaUploadModel = MediaUploadModel;
module.exports.UserModel = UserModel;
module.exports.ChannelModel = ChannelModel;
module.exports.MessageModel = MessageModel;
module.exports.FriendRequestModel = FriendRequestModel;

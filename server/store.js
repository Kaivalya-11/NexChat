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
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', UserSchema);
const ChannelModel = mongoose.model('Channel', ChannelSchema);
const MessageModel = mongoose.model('Message', MessageSchema);

// Preset Avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'
];

async function initDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime_chat';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/realtime_chat';

  // 1. Connect to MongoDB (Primary)
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('MongoDB URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });

    console.log('✅ Connected to Primary MongoDB via Mongoose!');
  } catch (err) {
    console.warn('⚠️ Primary MongoDB connection failed:', err.message);
    
    // Attempt fallback to local MongoDB if primary is Atlas and failed
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

  // 2. Clean up seed demo accounts if present
  try {
    const demoUsernames = [/alice/i, /bob/i, /charlie/i, /sarah/i];
    const demoUsers = await UserModel.find({ username: { $in: demoUsernames } });
    if (demoUsers.length > 0) {
      const demoUserIds = demoUsers.map(u => u._id);
      await UserModel.deleteMany({ _id: { $in: demoUserIds } });
      await ChannelModel.updateMany({}, { $pull: { members: { $in: demoUserIds }, admins: { $in: demoUserIds } } });
      await MessageModel.deleteMany({ sender: { $in: demoUserIds } });
      console.log('🧹 Cleaned up demo accounts (alice, bob, charlie, sarah) from MongoDB');
    }
  } catch (err) {
    console.warn('Demo cleanup note:', err.message);
  }
}
// Data Storage Methods Abstraction
const store = {
  PRESET_AVATARS,
  initDB,

  // User methods
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

  async getAllUsers() {
    const demoUsernames = [/alice/i, /bob/i, /charlie/i, /sarah/i];
    const users = await UserModel.find({ username: { $nin: demoUsernames } }, { password: 0 });
    return users.map(formatUser);
  },

  // Channels & DMs
  async getChannelsForUser(userId) {
    const channels = await ChannelModel.find({ members: userId }).sort({ updatedAt: -1 });
    return channels.map(formatChannel);
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

  // Messages
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

  async searchMessages(query, channelId = null) {
    const filter = { content: { $regex: query, $options: 'i' } };
    if (channelId) filter.conversation = channelId;
    const msgs = await MessageModel.find(filter)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
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
      // Non-admin group member leaving
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
  }
};

function formatUser(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    username: obj.username,
    email: obj.email,
    password: obj.password,
    avatar: obj.avatar,
    statusText: obj.statusText,
    status: obj.status,
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
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

function formatMessage(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    channelId: obj.conversation.toString(),
    sender: obj.sender && obj.sender._id ? {
      id: obj.sender._id.toString(),
      username: obj.sender.username,
      avatar: obj.sender.avatar
    } : { id: obj.sender.toString() }, // fallback if not populated
    content: obj.content,
    type: obj.type,
    media: obj.attachments || [],
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

module.exports = store;

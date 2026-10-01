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

  // 1. Connect to MongoDB
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('MongoDB URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('✅ Connected to MongoDB via Mongoose!');
  } catch (err) {
    console.error('❌ MongoDB connection failed!');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }

  // 2. Seed database separately
  try {
    const userCount = await UserModel.countDocuments();

    console.log(`👥 Existing users: ${userCount}`);

    if (userCount === 0) {
      console.log('🌱 Seeding initial MongoDB data...');

      const hashedPassword = bcrypt.hashSync('password123', 10);

      const alice = await UserModel.create({
        username: 'alice',
        email: 'alice@example.com',
        password: hashedPassword,
        avatar: PRESET_AVATARS[0],
        statusText: 'Building cool web apps 🚀',
        status: 'online'
      });

      const bob = await UserModel.create({
        username: 'bob',
        email: 'bob@example.com',
        password: hashedPassword,
        avatar: PRESET_AVATARS[1],
        statusText: 'In a meeting ☕',
        status: 'online'
      });

      const charlie = await UserModel.create({
        username: 'charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
        avatar: PRESET_AVATARS[2],
        statusText: 'Designing UI/UX 🎨',
        status: 'away'
      });

      const sarah = await UserModel.create({
        username: 'sarah',
        email: 'sarah@example.com',
        password: hashedPassword,
        avatar: PRESET_AVATARS[3],
        statusText: 'Debugging backend node.js 🛠️',
        status: 'dnd'
      });

      const general = await ChannelModel.create({
        name: 'general',
        description: 'Global announcements and team chat 💬',
        isGroup: true,
        members: [
          alice._id,
          bob._id,
          charlie._id,
          sarah._id
        ],
        admins: [alice._id],
        owner: alice._id
      });

      const tech = await ChannelModel.create({
        name: 'tech-stack',
        description: 'Next.js, Socket.IO, WebSockets & Architecture ⚡',
        isGroup: true,
        members: [
          alice._id,
          bob._id,
          sarah._id
        ],
        admins: [bob._id],
        owner: bob._id
      });

      const msg1 = await MessageModel.create({
        conversation: general._id,
        sender: alice._id,
        content: 'Welcome to Real-Time Chat! 🚀 Socket.IO, WebSockets and JWT Authentication are live.',
        type: 'text',
        attachments: [],
        deliveredTo: [
          alice._id,
          bob._id,
          charlie._id,
          sarah._id
        ],
        readBy: [
          {
            userId: alice._id,
            readAt: new Date()
          },
          {
            userId: bob._id,
            readAt: new Date()
          }
        ]
      });

      await MessageModel.create({
        conversation: general._id,
        sender: bob._id,
        content: 'Awesome! Test typing indicators, emoji reactions, voice uploads and read receipts.',
        type: 'text',
        attachments: [],
        replyTo: msg1._id,
        deliveredTo: [
          alice._id,
          bob._id,
          charlie._id,
          sarah._id
        ],
        readBy: [
          {
            userId: alice._id,
            readAt: new Date()
          }
        ]
      });

      await MessageModel.findByIdAndUpdate(
        msg1._id,
        { $inc: { replyCount: 1 } }
      );

      console.log('🌱 Seeded initial MongoDB data');
    } else {
      console.log('ℹ️ Database already contains users. Skipping seed.');
    }

  } catch (err) {
    console.error('❌ MongoDB connected, but database initialization/seed failed!');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', err);

    process.exit(1);
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
    const updated = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return updated ? formatUser(updated) : null;
  },

  async getAllUsers() {
    const users = await UserModel.find({}, { password: 0 });
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
    const updated = await ChannelModel.findByIdAndUpdate(id, { $set: { ...updates, updatedAt: new Date() } }, { new: true });
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

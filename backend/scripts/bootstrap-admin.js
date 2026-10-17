/**
 * NexChat Admin Bootstrap Script
 * Secure CLI script to bootstrap or promote an admin account.
 * 
 * Usage:
 *   node scripts/bootstrap-admin.js --username <username> --email <email> --password <password>
 *   OR
 *   npm run bootstrap:admin
 *   (reads ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Parse CLI args
const args = process.argv.slice(2);
let cliUsername = null;
let cliEmail = null;
let cliPassword = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--username' && args[i + 1]) {
    cliUsername = args[++i];
  } else if (args[i] === '--email' && args[i + 1]) {
    cliEmail = args[++i];
  } else if (args[i] === '--password' && args[i + 1]) {
    cliPassword = args[++i];
  } else if (!args[i].startsWith('--')) {
    if (!cliUsername) cliUsername = args[i];
    else if (!cliEmail) cliEmail = args[i];
    else if (!cliPassword) cliPassword = args[i];
  }
}

const username = (cliUsername || process.env.ADMIN_USERNAME || 'Kaivalya').trim();
const email = (cliEmail || process.env.ADMIN_EMAIL || 'admin@nexchat.local').trim();
const password = cliPassword || process.env.ADMIN_PASSWORD || 'test';

if (!username || !email || !password) {
  console.error('❌ Error: username, email, and password must be provided via CLI args or environment variables.');
  console.error('Usage: node scripts/bootstrap-admin.js --username <username> --email <email> --password <password>');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime_chat';

async function bootstrap() {
  console.log('👑 NexChat Admin Bootstrap');
  console.log('----------------------------------------');
  console.log(`Connecting to MongoDB...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB.');

    const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true },
      password: { type: String, required: true },
      avatar: { type: String, default: '' },
      statusText: { type: String, default: 'Available' },
      status: { type: String, default: 'offline' },
      lastSeen: { type: Date, default: Date.now },
      friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
      isAdmin: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }));

    let existing = await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') });

    if (existing) {
      console.log(`ℹ️  User '${username}' found. Promoting to Admin role...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      existing.isAdmin = true;
      existing.role = 'admin';
      existing.email = email;
      existing.password = hashedPassword;
      existing.statusText = existing.statusText || 'Admin';
      await existing.save();

      console.log(`🎉 SUCCESS: User '${username}' promoted to Admin (role: 'admin', isAdmin: true).`);
    } else {
      console.log(`ℹ️  User '${username}' does not exist. Creating new Admin user...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await UserModel.create({
        username,
        email,
        password: hashedPassword,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=10b981&color=fff`,
        statusText: 'Admin',
        status: 'offline',
        role: 'admin',
        isAdmin: true
      });

      console.log(`🎉 SUCCESS: Admin account '${username}' created (role: 'admin', isAdmin: true).`);
    }

    console.log('----------------------------------------');
    console.log('Admin bootstrap completed successfully.');
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

bootstrap();


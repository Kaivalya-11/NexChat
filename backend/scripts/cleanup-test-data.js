const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const store = require('../store');
const { UserModel, ChannelModel, MessageModel, ModerationReportModel, AuditLogModel, MediaUploadModel } = store;

const REAL_USERNAMES = [
  'kaivalya',
  'sameer',
  'vaibhav',
  'ashish sansare',
  'kaivalya gavaskar',
  'bhoomi_10'
];

const REAL_CHANNEL_NAMES = [
  'general',
  'tech-stack',
  'workspace-1',
  'test',
  'timepass'
];

async function cleanupTestData() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  // 1. Identify Test Users
  const allUsers = await UserModel.find({});
  const testUsers = allUsers.filter(u => {
    const lower = u.username.toLowerCase();
    return !REAL_USERNAMES.includes(lower);
  });

  const testUserIds = testUsers.map(u => u._id);
  console.log(`Found ${testUsers.length} test user profiles to remove:`);
  testUsers.forEach(u => console.log(`  - @${u.username} (${u._id})`));

  // 2. Identify Test Channels
  const allChannels = await ChannelModel.find({});
  const testChannels = allChannels.filter(c => {
    if (!c.isGroup) {
      // Check if it's a DM between test users
      const hasRealUser = c.members.some(m => !testUserIds.some(tId => tId.equals(m)));
      return !hasRealUser;
    }
    const lower = c.name.toLowerCase();
    return !REAL_CHANNEL_NAMES.includes(lower);
  });

  const testChannelIds = testChannels.map(c => c._id);
  console.log(`\nFound ${testChannels.length} test channels to remove:`);
  testChannels.forEach(c => console.log(`  - #${c.name} (${c._id})`));

  // 3. Delete Test Channels and their messages
  if (testChannelIds.length > 0) {
    const deletedMessagesFromChan = await MessageModel.deleteMany({ conversation: { $in: testChannelIds } });
    console.log(`Deleted ${deletedMessagesFromChan.deletedCount} messages from test channels.`);

    const deletedChannels = await ChannelModel.deleteMany({ _id: { $in: testChannelIds } });
    console.log(`Deleted ${deletedChannels.deletedCount} test channels.`);
  }

  // 4. Delete messages authored by test users
  if (testUserIds.length > 0) {
    const deletedUserMsgs = await MessageModel.deleteMany({ sender: { $in: testUserIds } });
    console.log(`Deleted ${deletedUserMsgs.deletedCount} messages sent by test users.`);

    // Remove test user IDs from real channel member arrays
    await ChannelModel.updateMany(
      {},
      {
        $pull: {
          members: { $in: testUserIds },
          admins: { $in: testUserIds }
        }
      }
    );
    console.log('Removed test users from remaining channel membership rosters.');

    // Delete test reports and test audit logs
    const deletedReports = await ModerationReportModel.deleteMany({
      $or: [
        { reportedBy: { $in: testUserIds } },
        { reportedUser: { $in: testUserIds } }
      ]
    });
    console.log(`Deleted ${deletedReports.deletedCount} test moderation reports.`);

    const deletedAudit = await AuditLogModel.deleteMany({
      $or: [
        { actor: { $in: testUserIds } },
        { targetId: { $in: testUserIds.map(id => id.toString()) } }
      ]
    });
    console.log(`Deleted ${deletedAudit.deletedCount} test audit logs.`);

    // Delete test user profiles
    const deletedUsers = await UserModel.deleteMany({ _id: { $in: testUserIds } });
    console.log(`Deleted ${deletedUsers.deletedCount} test users.`);
  }

  // 5. Final State Summary
  const remainingUsers = await UserModel.find({}, 'username role isAdmin');
  console.log(`\nRemaining Clean Users (${remainingUsers.length}):`);
  remainingUsers.forEach(u => console.log(`  - @${u.username} (${u.role}${u.isAdmin ? ', admin' : ''})`));

  const remainingChannels = await ChannelModel.find({}, 'name isGroup memberCount');
  console.log(`\nRemaining Clean Channels (${remainingChannels.length}):`);
  remainingChannels.forEach(c => console.log(`  - ${c.isGroup ? '#' : 'DM: '}${c.name}`));

  await mongoose.disconnect();
  console.log('\n✅ Test data cleanup finished successfully.');
}

cleanupTestData().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});


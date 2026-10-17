const http = require('http');

const API_URL = 'http://localhost:3001/api';

function request(method, path, data = null, token = null) {
  const dataString = data ? JSON.stringify(data) : '';
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString)
    }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = http.request(`${API_URL}${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('🧪 Running Part 2: User and Channel Management API Tests...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // Login as Admin
    const adminLoginRes = await request('POST', '/auth/login', {
      username: 'Kaivalya',
      password: 'test'
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded');
    const adminToken = adminLoginRes.data.token;
    const adminId = adminLoginRes.data.user.id;

    // Register a test user for manipulation
    const testUsername = 'test_target_' + Date.now();
    const testEmail = `${testUsername}@example.com`;
    const regRes = await request('POST', '/auth/register', {
      username: testUsername,
      email: testEmail,
      password: 'password123'
    });
    assert(regRes.status === 201, `Target test user @${testUsername} created`);
    const targetUserId = regRes.data.user.id;

    // ─────────────────────────────────────────────────────────────
    // 1. User Pagination, Search & Filters
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Testing User Listing, Pagination & Filters ---');
    const listRes = await request('GET', '/admin/users?page=1&limit=5', null, adminToken);
    assert(listRes.status === 200, 'GET /api/admin/users returns 200');
    assert(Array.isArray(listRes.data.users), 'Response contains users array');
    assert(listRes.data.pagination && listRes.data.pagination.page === 1, 'Pagination page is 1');
    assert(listRes.data.pagination.limit === 5, 'Pagination limit is 5');
    assert(typeof listRes.data.pagination.total === 'number', 'Pagination total is a valid count');
    assert(listRes.data.users.every(u => !u.password), 'Passwords/hashes are strictly excluded');

    // Search by username
    const searchRes = await request('GET', `/admin/users?search=${testUsername}`, null, adminToken);
    assert(searchRes.status === 200, 'Search by username returns 200');
    assert(searchRes.data.users.some(u => u.username === testUsername), 'Search finds newly created user');

    // Filter by role
    const adminRoleRes = await request('GET', '/admin/users?role=admin', null, adminToken);
    assert(adminRoleRes.status === 200, 'Filter by role=admin returns 200');
    assert(adminRoleRes.data.users.every(u => u.role === 'admin' || u.isAdmin), 'All returned users have admin role');

    // ─────────────────────────────────────────────────────────────
    // 2. User Details
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing User Details Endpoint ---');
    const detailsRes = await request('GET', `/admin/users/${targetUserId}`, null, adminToken);
    assert(detailsRes.status === 200, 'GET /api/admin/users/:id returns 200');
    assert(detailsRes.data.user.id === targetUserId, 'User details match target ID');
    assert(typeof detailsRes.data.user.channelCount === 'number', 'Includes channelCount metadata');
    assert(typeof detailsRes.data.user.messageCount === 'number', 'Includes messageCount metadata');

    const badIdRes = await request('GET', '/admin/users/invalid-id-xyz', null, adminToken);
    assert(badIdRes.status === 400, 'Invalid user ID format returns 400 Bad Request');

    // ─────────────────────────────────────────────────────────────
    // 3. Role Change & Safeguards
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Role Modifications & Safeguards ---');
    // Self-demotion attempt
    const selfRoleRes = await request('PATCH', `/admin/users/${adminId}/role`, { role: 'user' }, adminToken);
    assert(selfRoleRes.status === 400, 'Self-role modification is rejected with 400 (Self-lockout protection)');

    // Invalid role
    const invalidRoleRes = await request('PATCH', `/admin/users/${targetUserId}/role`, { role: 'supergod' }, adminToken);
    assert(invalidRoleRes.status === 400, 'Invalid role value is rejected with 400');

    // Promote target user to moderator
    const promoteModRes = await request('PATCH', `/admin/users/${targetUserId}/role`, { role: 'moderator', reason: 'Promotion test' }, adminToken);
    assert(promoteModRes.status === 200, 'Promote user to moderator returns 200');
    assert(promoteModRes.data.user.role === 'moderator', 'Target user role is now moderator');

    // Demote target user back to user
    const demoteRes = await request('PATCH', `/admin/users/${targetUserId}/role`, { role: 'user', reason: 'Demotion test' }, adminToken);
    assert(demoteRes.status === 200, 'Demote user back to user returns 200');
    assert(demoteRes.data.user.role === 'user', 'Target user role is now user');

    // ─────────────────────────────────────────────────────────────
    // 4. Account Suspension & Restoration
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing Account Suspension & Restoration ---');
    // Self-suspension attempt
    const selfSuspendRes = await request('PATCH', `/admin/users/${adminId}/status`, { action: 'suspend' }, adminToken);
    assert(selfSuspendRes.status === 400, 'Self-suspension attempt is rejected with 400');

    // Suspend target user
    const suspendRes = await request('PATCH', `/admin/users/${targetUserId}/status`, {
      action: 'suspend',
      reason: 'Violation of Terms of Service'
    }, adminToken);
    assert(suspendRes.status === 200, 'Suspend target user returns 200');
    assert(suspendRes.data.user.isSuspended === true, 'Target user isSuspended flag is true');
    assert(suspendRes.data.user.suspendedReason === 'Violation of Terms of Service', 'Suspension reason is preserved');

    // Suspended user tries to login -> rejected
    const blockedLoginRes = await request('POST', '/auth/login', {
      username: testUsername,
      password: 'password123'
    });
    assert(blockedLoginRes.status === 403, 'Suspended user login attempt is blocked with 403 Forbidden');

    // Restore target user
    const restoreRes = await request('PATCH', `/admin/users/${targetUserId}/status`, { action: 'restore' }, adminToken);
    assert(restoreRes.status === 200, 'Restore target user returns 200');
    assert(restoreRes.data.user.isSuspended === false, 'Target user isSuspended flag is now false');

    // Restored user tries to login -> succeeds
    const allowedLoginRes = await request('POST', '/auth/login', {
      username: testUsername,
      password: 'password123'
    });
    assert(allowedLoginRes.status === 200, 'Restored user login succeeds with 200 OK');

    // ─────────────────────────────────────────────────────────────
    // 5. Channel Pagination, Search & Filters
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing Channel Listing & Metadata ---');
    // Create a test channel
    const testChanName = 'adm-test-' + Date.now();
    const chanCreateRes = await request('POST', '/channels', {
      name: testChanName,
      description: 'Channel for admin test'
    }, adminToken);
    assert(chanCreateRes.status === 201, `Test channel #${testChanName} created`);
    const testChannelId = chanCreateRes.data.id;

    // List channels with pagination
    const chanListRes = await request('GET', '/admin/channels?page=1&limit=5', null, adminToken);
    assert(chanListRes.status === 200, 'GET /api/admin/channels returns 200');
    assert(Array.isArray(chanListRes.data.channels), 'Response contains channels array');
    assert(chanListRes.data.pagination && chanListRes.data.pagination.page === 1, 'Channel pagination page is 1');
    assert(typeof chanListRes.data.pagination.total === 'number', 'Channel total count is present');

    // Verify channel metadata fields
    const foundChan = chanListRes.data.channels.find(c => c.id === testChannelId);
    assert(foundChan !== undefined, 'Newly created channel found in listing');
    assert(typeof foundChan.memberCount === 'number', 'Channel item has memberCount');
    assert(typeof foundChan.adminCount === 'number', 'Channel item has adminCount');
    assert(typeof foundChan.messageCount === 'number', 'Channel item has messageCount');

    // Channel search
    const chanSearchRes = await request('GET', `/admin/channels?search=${testChanName}`, null, adminToken);
    assert(chanSearchRes.status === 200, 'Search channel by name returns 200');
    assert(chanSearchRes.data.channels.some(c => c.name === testChanName), 'Search found target channel');

    // ─────────────────────────────────────────────────────────────
    // 6. Channel Details Endpoint
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing Channel Details ---');
    const chanDetailsRes = await request('GET', `/admin/channels/${testChannelId}`, null, adminToken);
    assert(chanDetailsRes.status === 200, 'GET /api/admin/channels/:id returns 200');
    assert(chanDetailsRes.data.channel.id === testChannelId, 'Channel details match target ID');
    assert(Array.isArray(chanDetailsRes.data.channel.members), 'Channel details include populated members list');
    assert(Array.isArray(chanDetailsRes.data.channel.admins), 'Channel details include populated admins list');

    // ─────────────────────────────────────────────────────────────
    // 7. Channel Archive & Restore
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Testing Channel Archive and Restore ---');
    const archiveRes = await request('PATCH', `/admin/channels/${testChannelId}/archive`, {
      archive: true,
      reason: 'Inactivity test'
    }, adminToken);
    assert(archiveRes.status === 200, 'Archive channel returns 200');
    assert(archiveRes.data.channel.isArchived === true, 'Channel isArchived flag is true');

    const unarchiveRes = await request('PATCH', `/admin/channels/${testChannelId}/archive`, {
      archive: false
    }, adminToken);
    assert(unarchiveRes.status === 200, 'Unarchive channel returns 200');
    assert(unarchiveRes.data.channel.isArchived === false, 'Channel isArchived flag is now false');

    // ─────────────────────────────────────────────────────────────
    // 8. Safe Channel Deletion with Confirmation
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Testing Safe Channel Deletion with Explicit Confirmation ---');
    // Wrong confirmation name
    const badDeleteRes = await request('DELETE', `/admin/channels/${testChannelId}`, {
      confirmationName: 'wrong-name'
    }, adminToken);
    assert(badDeleteRes.status === 400, 'Mismatched confirmation name rejects deletion with 400');

    // Correct confirmation name
    const goodDeleteRes = await request('DELETE', `/admin/channels/${testChannelId}`, {
      confirmationName: testChanName
    }, adminToken);
    assert(goodDeleteRes.status === 200, 'Matching confirmation name deletes channel with 200');
    assert(goodDeleteRes.data.deletedChannelId === testChannelId, 'Deleted channel ID matches');

    // Verify it is gone
    const checkDeletedRes = await request('GET', `/admin/channels/${testChannelId}`, null, adminToken);
    assert(checkDeletedRes.status === 404, 'Deleted channel returns 404 Not Found');

    console.log('\n========================================');
    console.log(`PART 2 API TESTS COMPLETED: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('========================================\n');
    if (testsFailed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

run();


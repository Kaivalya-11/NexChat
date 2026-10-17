require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://127.0.0.1:3001';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Part 3: Moderation and Reports API Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    const store = require('./store');
    await store.initDB();

    // 1. Setup Accounts
    const adminRes = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'Kaivalya', password: 'test' });
    assert(adminRes.status === 200 && adminRes.data.token, 'Admin login succeeded');
    const adminToken = adminRes.data.token;
    const adminUser = adminRes.data.user;

    const userA_Name = `mod_userA_${Date.now()}`;
    const userA_Res = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userA_Name, email: `${userA_Name}@test.com`, password: 'password123' });
    assert(userA_Res.status === 201, `User A (@${userA_Name}) registered`);
    const userAToken = userA_Res.data.token;
    const userA = userA_Res.data.user;

    const userB_Name = `mod_userB_${Date.now()}`;
    const userB_Res = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userB_Name, email: `${userB_Name}@test.com`, password: 'password123' });
    assert(userB_Res.status === 201, `User B (@${userB_Name}) registered`);
    const userBToken = userB_Res.data.token;
    const userB = userB_Res.data.user;

    // Create a channel and message for testing
    const chanRes = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/channels',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { name: `mod-chan-${Date.now()}`, isGroup: true, members: [userB.id] });
    assert(chanRes.status === 200 || chanRes.status === 201, 'Test channel created');
    const testChannel = chanRes.data;

    // Send a message as user B
    const testMsg = await store.createMessage({
      channelId: testChannel.id,
      sender: userB.id,
      content: 'This is an offensive test message that should be reported.'
    });
    assert(Boolean(testMsg.id), 'Test message created by User B');

    // --- 2. Authorization Checks ---
    console.log('\n--- 2. Testing Non-Admin/Non-Mod Access to Admin Endpoints ---');
    const unauthReports = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/reports',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    assert(unauthReports.status === 403, 'Normal user accessing /api/admin/reports is rejected with 403');

    const unauthWarn = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/warn',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { userId: userB.id, reason: 'test' });
    assert(unauthWarn.status === 403, 'Normal user issuing warning is rejected with 403');

    // --- 3. Reporting System (User Facing) ---
    console.log('\n--- 3. Testing User-Facing Reporting System ---');
    // Self report
    const selfReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'user', targetId: userA.id, category: 'spam', description: 'Testing self report' });
    assert(selfReport.status === 400, 'User reporting self is rejected with 400');

    // Self message report
    const selfMsg = await store.createMessage({
      channelId: testChannel.id,
      sender: userA.id,
      content: 'My own message'
    });
    const selfMsgReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'message', targetId: selfMsg.id, category: 'spam' });
    if (selfMsgReport.status !== 400) {
      console.log('DEBUG selfMsgReport:', selfMsgReport.status, selfMsgReport.data);
    }
    assert(selfMsgReport.status === 400, 'User reporting their own message is rejected with 400');

    // Valid User Report (User A reports User B)
    const validUserReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'user', targetId: userB.id, category: 'harassment', description: 'User B is harassing others in chat' });
    assert(validUserReport.status === 201, 'Valid user report submitted successfully (201)');
    assert(Boolean(validUserReport.data.reportId), 'Returns reportId');
    const createdReportId = validUserReport.data.reportId;

    // Deduplication check
    const dupReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'user', targetId: userB.id, category: 'harassment', description: 'Duplicate report' });
    assert(dupReport.status === 409, 'Duplicate pending report rejected with 409 Conflict');

    // Valid Message Report (User A reports User B message)
    const validMsgReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'message', targetId: testMsg.id, category: 'inappropriate', description: 'Offensive language' });
    if (validMsgReport.status !== 201) {
      console.log('DEBUG validMsgReport:', validMsgReport.status, validMsgReport.data);
    }
    assert(validMsgReport.status === 201, 'Valid message report submitted successfully (201)');
    const createdMsgReportId = validMsgReport.data.reportId;

    // Valid Channel Report
    const validChanReport = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { targetType: 'channel', targetId: testChannel.id, category: 'spam', description: 'Spam channel' });
    assert(validChanReport.status === 201, 'Valid channel report submitted successfully (201)');

    // --- 4. Moderation Dashboard (Admin/Mod) ---
    console.log('\n--- 4. Testing Moderation Dashboard Endpoints ---');
    const reportsList = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/reports?limit=10&status=pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(reportsList.status === 200, 'GET /api/admin/reports returns 200');
    assert(Array.isArray(reportsList.data.reports), 'Returns reports array');
    assert(reportsList.data.pagination.total >= 3, 'Pagination total count reflects submitted reports');
    const foundReport = reportsList.data.reports.find(r => r.id === createdReportId);
    assert(Boolean(foundReport), 'Newly created report found in admin reports listing');
    assert(foundReport.reportedUser && foundReport.reportedUser.username === userB_Name, 'Reported user metadata populated');
    assert(foundReport.reportedBy && foundReport.reportedBy.username === userA_Name, 'Reporter info visible to admin');

    // Filter by targetType=message
    const msgReports = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/reports?targetType=message',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(msgReports.status === 200, 'Filter by targetType=message returns 200');
    assert(msgReports.data.reports.every(r => r.targetType === 'message'), 'All returned reports have targetType=message');

    // Report Details
    const reportDetails = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/admin/reports/${createdReportId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(reportDetails.status === 200, 'GET /api/admin/reports/:id returns 200');
    assert(reportDetails.data.report.id === createdReportId, 'Details report ID matches');
    assert(reportDetails.data.targetHistory !== undefined, 'Includes targetHistory');

    // Assign / Claim report
    const assignRes = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/admin/reports/${createdReportId}/assign`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { assignToMe: true });
    assert(assignRes.status === 200, 'PATCH /api/admin/reports/:id/assign returns 200');
    assert(assignRes.data.report.assignedUsername === adminUser.username, 'Report assigned to admin');
    assert(assignRes.data.report.status === 'under_review', 'Report status transitioned to under_review');

    // --- 5. Enforcement Actions ---
    console.log('\n--- 5. Testing Enforcement Actions ---');
    // Warning
    const warnSelf = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/warn',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { userId: adminUser.id, reason: 'test' });
    assert(warnSelf.status === 400, 'Self-warning is rejected with 400');

    const warnUserB = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/warn',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { userId: userB.id, reason: 'First formal warning for language', reportId: createdReportId });
    assert(warnUserB.status === 200, 'Official warning issued to User B returns 200');
    assert(warnUserB.data.warningCount === 1, 'User B warningCount incremented to 1');

    // Check report resolved after warning
    const reportAfterWarn = await store.ModerationReportModel.findById(createdReportId);
    assert(reportAfterWarn.status === 'resolved', 'Report status updated to resolved after warning');
    assert(reportAfterWarn.actionTaken === 'warning_issued', 'Report actionTaken set to warning_issued');

    // Restrict message
    const restrictMsg = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/restrict-message',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { messageId: testMsg.id, reason: 'Violated community guidelines', reportId: createdMsgReportId });
    assert(restrictMsg.status === 200, 'POST /api/admin/moderation/restrict-message returns 200');

    const formattedMsg = await store.getMessageById(testMsg.id);
    assert(formattedMsg.isRestricted === true, 'Message isRestricted flag is true');
    assert(formattedMsg.content === '[Message removed by moderator]', 'Message content is masked from chat');

    // Temporary Suspension
    const suspendSelf = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/suspend',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { userId: adminUser.id, reason: 'Self suspend' });
    assert(suspendSelf.status === 400, 'Self-suspension rejected with 400');

    const suspendUserB = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/suspend',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { userId: userB.id, reason: 'Temporary suspension for repeated violations', durationHours: 24 });
    assert(suspendUserB.status === 200, 'Temporary suspension (24h) returns 200');
    assert(suspendUserB.data.isSuspended === true, 'User B isSuspended is true');
    assert(Boolean(suspendUserB.data.suspendedUntil), 'User B has suspendedUntil timestamp');

    // Verify User B login is blocked
    const userBLoginBlocked = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userB_Name, password: 'password123' });
    assert(userBLoginBlocked.status === 403, 'Suspended User B login is blocked with 403 Forbidden');

    // --- 6. Appeals System ---
    console.log('\n--- 6. Testing Appeals Workflow ---');
    // Non-suspended user appeal attempt
    const userAAppeal = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports/appeal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userA_Name, statement: 'I am not suspended but appealing anyway' });
    assert(userAAppeal.status === 400, 'Appeal from non-suspended account rejected with 400');

    const userBAppeal = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports/appeal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userB_Name, email: `${userB_Name}@test.com`, statement: 'I apologize for the inappropriate remarks, it will not happen again.' });
    if (userBAppeal.status !== 200) {
      console.log('DEBUG userBAppeal:', userBAppeal.status, userBAppeal.data);
    }
    assert(userBAppeal.status === 200, 'Suspended User B submits appeal with 200 OK');

    // Duplicate appeal check
    const userBDupAppeal = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/reports/appeal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userB_Name, statement: 'Another appeal attempt right away' });
    assert(userBDupAppeal.status === 409, 'Duplicate pending appeal rejected with 409 Conflict');

    // Admin lists appeals
    const appealsList = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/admin/moderation/appeals?status=pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(appealsList.status === 200, 'GET /api/admin/moderation/appeals returns 200');
    assert(Array.isArray(appealsList.data.appeals), 'Returns appeals array');
    const bAppeal = appealsList.data.appeals.find(a => a.username === userB_Name);
    assert(Boolean(bAppeal), 'User B appeal found in appeals listing');
    const appealId = bAppeal.appealId;

    // Admin approves appeal
    const approveAppeal = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: `/api/admin/moderation/appeals/${userB.id}/${appealId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    }, { decision: 'approved', notes: 'First offense apology accepted' });
    assert(approveAppeal.status === 200, 'Approve appeal returns 200');
    assert(approveAppeal.data.isSuspended === false, 'User B is automatically un-suspended on appeal approval');

    // Verify User B can log in again
    const userBLoginAfterAppeal = await request({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: userB_Name, password: 'password123' });
    assert(userBLoginAfterAppeal.status === 200, 'User B login succeeds (200) after appeal approval');

    console.log(`\n========================================`);
    console.log(`PART 3 API TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Part 4 (Analytics & System Health) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Public /api/health
    console.log('--- Step 1: Public Health Endpoint ---');
    const pubHealth = await request(`${API_BASE}/health`);
    assert(pubHealth.status === 200, 'GET /api/health returns HTTP 200');
    assert(pubHealth.data?.status === 'ok', 'GET /api/health status is "ok"');
    assert(Boolean(pubHealth.data?.timestamp), 'GET /api/health includes timestamp');
    assert(!pubHealth.data?.database, 'GET /api/health does NOT leak database info');
    assert(!pubHealth.data?.memory, 'GET /api/health does NOT leak process memory');
    assert(!pubHealth.data?.uploads, 'GET /api/health does NOT leak upload configuration');

    // 2. Test Login Admin and Non-Admin
    console.log('\n--- Step 2: Authentication & Authorization Setup ---');
    const adminLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'Kaivalya', password: 'test' }
    });
    assert(adminLogin.status === 200 && adminLogin.data?.token, 'Logged in as Kaivalya (admin)');
    const adminToken = adminLogin.data?.token;

    // Login or register a regular user
    let userToken = null;
    const regUser = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'regular_user_test', password: 'Password123!' }
    });

    if (regUser.status === 200 && regUser.data?.token) {
      userToken = regUser.data.token;
    } else {
      const regRes = await request(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          username: `reg_${Date.now().toString().slice(-4)}`,
          email: `reg_${Date.now()}@example.com`,
          password: 'Password123!'
        }
      });
      userToken = regRes.data?.token;
    }
    assert(Boolean(userToken), 'Regular user token obtained');

    // 3. Test Security Restrictions on /api/admin/health and /api/admin/analytics
    console.log('\n--- Step 3: Unauthenticated & Unauthorized Protection ---');
    const noTokenHealth = await request(`${API_BASE}/admin/health`);
    assert(noTokenHealth.status === 401, 'GET /api/admin/health without token returns 401');

    const noTokenAnalytics = await request(`${API_BASE}/admin/analytics`);
    assert(noTokenAnalytics.status === 401, 'GET /api/admin/analytics without token returns 401');

    const regTokenHealth = await request(`${API_BASE}/admin/health`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(regTokenHealth.status === 403, 'GET /api/admin/health as non-admin returns 403 Forbidden');

    const regTokenAnalytics = await request(`${API_BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(regTokenAnalytics.status === 403, 'GET /api/admin/analytics as non-admin returns 403 Forbidden');

    // 4. Test Enhanced GET /api/admin/overview
    console.log('\n--- Step 4: Enhanced Admin Overview Metrics ---');
    const overviewRes = await request(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(overviewRes.status === 200, 'GET /api/admin/overview returns HTTP 200');
    const stats = overviewRes.data?.stats;
    assert(stats && typeof stats.users?.total === 'number', 'Overview returns total users');
    assert(typeof stats.users?.active === 'number', 'Overview returns active users count');
    assert(typeof stats.users?.suspended === 'number', 'Overview returns suspended users count');
    assert(typeof stats.users?.deactivated === 'number', 'Overview returns deactivated users count');
    assert(stats.velocity && stats.velocity.windowDays === 7, 'Overview velocity window is 7 days');
    assert(typeof stats.velocity.newUsers === 'number', 'Overview returns velocity.newUsers');
    assert(typeof stats.velocity.newMessages === 'number', 'Overview returns velocity.newMessages');
    assert(typeof stats.velocity.newChannels === 'number', 'Overview returns velocity.newChannels');
    assert(stats.moderation && typeof stats.moderation.pendingReports === 'number', 'Overview returns pending reports count');
    assert(typeof stats.moderation.pendingAppeals === 'number', 'Overview returns pending appeals count');
    assert(stats.recentActivity && Array.isArray(stats.recentActivity.users), 'Overview returns recent users list');
    assert(Array.isArray(stats.recentActivity.channels), 'Overview returns recent channels list');
    assert(Array.isArray(stats.recentActivity.auditLogs), 'Overview returns recent audit logs list');

    // 5. Test GET /api/admin/health Diagnostics
    console.log('\n--- Step 5: System Health Diagnostics Telemetry ---');
    const healthRes = await request(`${API_BASE}/admin/health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(healthRes.status === 200, 'GET /api/admin/health returns HTTP 200');
    assert(healthRes.data?.ok === true, 'Health check status ok is true');
    assert(['healthy', 'degraded'].includes(healthRes.data?.status), `Health status is "${healthRes.data?.status}"`);
    assert(healthRes.data?.database?.status === 'connected', 'Database status is connected');
    assert(typeof healthRes.data?.database?.pingLatencyMs === 'number', `DB ping latency measured: ${healthRes.data?.database?.pingLatencyMs}ms`);
    assert(healthRes.data?.socket && typeof healthRes.data?.socket?.connectedSockets === 'number', 'Socket metrics include connectedSockets count');
    assert(typeof healthRes.data?.socket?.activeUsers === 'number', 'Socket metrics include activeUsers count');
    assert(healthRes.data?.uploads && healthRes.data?.uploads?.provider, `Upload provider identified: ${healthRes.data?.uploads?.provider}`);
    assert(typeof healthRes.data?.uploads?.configured === 'boolean', 'Upload configuration status is boolean');
    assert(!healthRes.data?.uploads?.api_secret, 'Cloudinary API secret is NEVER exposed');
    assert(typeof healthRes.data?.memory?.heapUsedMb === 'number', `Process heap used: ${healthRes.data?.memory?.heapUsedMb} MB`);
    assert(typeof healthRes.data?.memory?.heapPercent === 'number', `Heap percent: ${healthRes.data?.memory?.heapPercent}%`);
    assert(typeof healthRes.data?.process?.uptimeSeconds === 'number', `Server uptime: ${healthRes.data?.process?.uptimeSeconds}s`);
    assert(Boolean(healthRes.data?.deployment?.provider), `Deployment provider: ${healthRes.data?.deployment?.provider}`);
    assert(typeof healthRes.data?.operationalErrors?.count === 'number', 'Operational errors count is numeric');

    // 6. Test GET /api/admin/analytics
    console.log('\n--- Step 6: Analytics Trends & Aggregation ---');
    // 6a. Default 7-day range
    const analytics7d = await request(`${API_BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analytics7d.status === 200, 'GET /api/admin/analytics (7d) returns HTTP 200');
    assert(analytics7d.data?.range === '7d', 'Range is 7d');
    assert(analytics7d.data?.daysCount === 7, '7d returns exactly 7 continuous days');
    assert(Array.isArray(analytics7d.data?.trends?.users) && analytics7d.data.trends.users.length === 7, 'Users trend array has 7 items');
    assert(Array.isArray(analytics7d.data?.trends?.messages) && analytics7d.data.trends.messages.length === 7, 'Messages trend array has 7 items');
    assert(Array.isArray(analytics7d.data?.trends?.channels) && analytics7d.data.trends.channels.length === 7, 'Channels trend array has 7 items');
    assert(Array.isArray(analytics7d.data?.trends?.reports) && analytics7d.data.trends.reports.length === 7, 'Reports trend array has 7 items');
    assert(typeof analytics7d.data?.summary?.totalNewUsers === 'number', 'Summary contains totalNewUsers');
    assert(typeof analytics7d.data?.summary?.totalMessagesSent === 'number', 'Summary contains totalMessagesSent');
    assert(typeof analytics7d.data?.summary?.avgMessagesPerDay === 'number', 'Summary contains avgMessagesPerDay');
    assert(Boolean(analytics7d.data?.summary?.peakMessageDay), 'Summary contains peakMessageDay');

    // 6b. Verify privacy: No message contents or sender IDs in trends
    const msgSample = analytics7d.data?.trends?.messages[0];
    assert(msgSample && typeof msgSample.count === 'number', 'Message trend item has count');
    assert(msgSample?.content === undefined, 'Privacy check: message content is NOT exposed in analytics');
    assert(msgSample?.sender === undefined, 'Privacy check: sender is NOT exposed in analytics');

    // 6c. 30-day range
    const analytics30d = await request(`${API_BASE}/admin/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analytics30d.status === 200, 'GET /api/admin/analytics?range=30d returns HTTP 200');
    assert(analytics30d.data?.daysCount === 30, '30d returns exactly 30 continuous days');

    // 6d. Custom range
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 2);
    const startDateStr = threeDaysAgo.toISOString().slice(0, 10);
    const endDateStr = now.toISOString().slice(0, 10);

    const analyticsCustom = await request(`${API_BASE}/admin/analytics?range=custom&startDate=${startDateStr}&endDate=${endDateStr}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analyticsCustom.status === 200, 'GET /api/admin/analytics (custom) returns HTTP 200');
    assert(analyticsCustom.data?.daysCount === 3, 'Custom range returns exactly 3 continuous days');

    // 6e. Custom range invalid dates error handling
    const invalidCustom = await request(`${API_BASE}/admin/analytics?range=custom&startDate=not-a-date&endDate=also-invalid`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invalidCustom.status === 400, 'Invalid custom date strings return 400 Bad Request');

    const reversedCustom = await request(`${API_BASE}/admin/analytics?range=custom&startDate=2026-10-15&endDate=2026-10-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reversedCustom.status === 400, 'startDate > endDate returns 400 Bad Request');

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Part 4 Results: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

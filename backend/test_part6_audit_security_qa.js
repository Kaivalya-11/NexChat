const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Part 6 (Audit Logs, Security & Final QA) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(fn, name) {
    return async () => {
      try {
        await fn();
        passed++;
      } catch (e) {
        failed++;
        console.error(`Test failed: ${name}`, e.message);
      }
    };
  }

  let adminToken = '';
  let adminUserId = '';
  let regularToken = '';
  let regularUserId = '';
  const testUserHandle = `testqa_${Date.now()}`;

  // Step 1: Authentication & Setup
  console.log('--- Step 1: Authentication & Setup ---');
  await (test(async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { username: 'Kaivalya', password: 'test' }
    });
    assert(res.status === 200, 'Logged in as admin (Kaivalya)');
    adminToken = res.body.token;
    adminUserId = res.body.user.id || res.body.user._id;
    assert(Boolean(adminToken), 'Admin token received');
  }, 'Admin login'))();

  await (test(async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        username: testUserHandle,
        email: `${testUserHandle}@example.com`,
        password: 'User@12345'
      }
    });
    assert(res.status === 201, 'Created regular test user');
    regularToken = res.body.token;
    regularUserId = res.body.user.id || res.body.user._id;
    assert(Boolean(regularToken), 'Regular user token received');
    assert(res.body.user.role === 'user', 'Regular user created with role="user"');
    assert(res.body.user.isAdmin === false, 'Regular user created with isAdmin=false');
  }, 'Regular user registration'))();

  // Step 2: Section A - Audit Logs Authorization & Verification
  console.log('\n--- Step 2: Audit Logs Authorization & Immutability ---');
  await (test(async () => {
    const res = await request('/admin/audit-logs');
    assert(res.status === 401, 'Unauthenticated request to /api/admin/audit-logs returns 401');
  }, 'Unauthenticated audit logs access'))();

  await (test(async () => {
    const res = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert(res.status === 403, 'Regular user request to /api/admin/audit-logs returns 403 Forbidden');
  }, 'Non-admin audit logs access'))();

  await (test(async () => {
    const res = await request('/admin/audit-logs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'FAKE_LOG', reason: 'Attempt tampering' }
    });
    assert(res.status === 404, 'POST to /api/admin/audit-logs rejected (Immutable logs)');
  }, 'Audit log immutability POST'))();

  await (test(async () => {
    const res = await request('/admin/audit-logs/some-id', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 404, 'DELETE to /api/admin/audit-logs rejected (Immutable logs)');
  }, 'Audit log immutability DELETE'))();

  // Step 3: Section A - Audit Logs Querying, Filtering & Pagination
  console.log('\n--- Step 3: Audit Logs Querying, Filtering & Pagination ---');
  let auditLogs = [];
  await (test(async () => {
    const res = await request('/admin/audit-logs?page=1&limit=10', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin can fetch audit logs (HTTP 200)');
    assert(res.body.ok === true, 'Response body has ok: true');
    assert(Array.isArray(res.body.logs), 'Logs is an array');
    assert(Boolean(res.body.pagination), 'Pagination metadata is returned');
    assert(typeof res.body.pagination.total === 'number', 'Total count is numeric');
    auditLogs = res.body.logs;
    assert(auditLogs.length > 0, `Returned ${auditLogs.length} audit logs`);
  }, 'Fetch audit logs'))();

  await (test(async () => {
    const sample = auditLogs[0];
    assert(Boolean(sample.id), 'Audit log has id');
    assert(Boolean(sample.actor), 'Audit log has actor');
    assert(Boolean(sample.actor.username), 'Audit log actor has username');
    assert(Boolean(sample.action), 'Audit log has action');
    assert(Boolean(sample.result), 'Audit log has result (outcome)');
    assert(Boolean(sample.createdAt), 'Audit log has timestamp');

    // Secrets check: Ensure no sensitive keys are leaked
    const jsonStr = JSON.stringify(sample);
    assert(!jsonStr.includes('password'), 'Audit log does NOT contain password');
    assert(!jsonStr.includes('api_secret'), 'Audit log does NOT contain Cloudinary secret');
    assert(!jsonStr.includes('JWT_SECRET'), 'Audit log does NOT contain JWT secret');
  }, 'Audit log schema and secret protection'))();

  await (test(async () => {
    const res = await request('/admin/audit-logs?action=ROLE_CHANGED', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Filter by action returns 200');
    assert(Array.isArray(res.body.logs), 'Filtered logs returned');
    res.body.logs.forEach(l => {
      assert(l.action === 'ROLE_CHANGED', 'All returned logs have action=ROLE_CHANGED');
    });
  }, 'Filter by action'))();

  await (test(async () => {
    const res = await request('/admin/audit-logs?result=success', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Filter by result returns 200');
    res.body.logs.forEach(l => {
      assert(l.result === 'success', 'All returned logs have result=success');
    });
  }, 'Filter by result'))();

  // Step 4: Section B - Security & Privilege Escalation Protection
  console.log('\n--- Step 4: Security & Privilege Escalation Protection ---');
  await (test(async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'admin',
        email: 'attacker@evil.com',
        password: 'Password@123'
      }
    });
    assert(res.status === 400, 'Registering reserved handle "admin" rejected with 400');
  }, 'Reserved handle protection'))();

  await (test(async () => {
    const res = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${regularToken}` },
      body: {
        role: 'admin',
        isAdmin: true,
        statusText: 'Hacking attempt'
      }
    });
    assert(res.status === 200, 'Profile update executed');
    assert(res.body.role === 'user', 'User role NOT escalated via profile update');
    assert(res.body.isAdmin === false || res.body.isAdmin === undefined, 'isAdmin flag NOT escalated');
  }, 'Role escalation attempt blocked'))();

  await (test(async () => {
    // Attempt to demote primary admin
    const res = await request(`/admin/users/${adminUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'user' }
    });
    assert(res.status === 400 || res.status === 403, 'Demoting primary system admin rejected with 400/403');
  }, 'Primary admin demotion protection'))();

  await (test(async () => {
    // Attempt self-suspension
    const res = await request(`/admin/users/${adminUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'suspend', reason: 'Self-harm' }
    });
    assert(res.status === 400, 'Admin self-suspension blocked with 400 Bad Request');
  }, 'Admin self-lockout protection'))();

  // Step 5: Section B - Account Suspension Enforcement on API
  console.log('\n--- Step 5: Account Suspension Real-Time Enforcement ---');
  await (test(async () => {
    // Admin suspends test user
    const res = await request(`/admin/users/${regularUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'suspend', reason: 'Terms of service violation' }
    });
    assert(res.status === 200, 'User suspended by admin');
    assert(res.body.user.isSuspended === true, 'User isSuspended is true');
  }, 'Admin suspend user'))();

  await (test(async () => {
    // Suspended user attempts to access /api/auth/me with existing JWT
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert(res.status === 403, 'Suspended user token immediately rejected with 403 Forbidden');
    assert(res.body.error.includes('Account suspended'), 'Error specifies account suspended');
  }, 'Suspension enforced on authMiddleware'))();

  await (test(async () => {
    // Admin restores test user
    const res = await request(`/admin/users/${regularUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'restore', reason: 'Appeal accepted' }
    });
    assert(res.status === 200, 'User restored by admin');
    assert(res.body.user.isSuspended === false, 'User isSuspended is false');
  }, 'Admin restore user'))();

  await (test(async () => {
    // Restored user attempts to access /api/auth/me again
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert(res.status === 200, 'Restored user access restored immediately (200 OK)');
  }, 'Restored user access verified'))();

  // Step 6: Section B - Rate Limiting Headers
  console.log('\n--- Step 6: Rate Limiting Verification ---');
  await (test(async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { username: 'Kaivalya', password: 'test' }
    });
    assert(res.headers['x-ratelimit-limit'] !== undefined, 'Rate limit header X-RateLimit-Limit returned');
    assert(res.headers['x-ratelimit-remaining'] !== undefined, 'Rate limit header X-RateLimit-Remaining returned');
    assert(res.headers['x-ratelimit-reset'] !== undefined, 'Rate limit header X-RateLimit-Reset returned');
  }, 'Rate limiting headers check'))();

  // Step 7: Section C - Regression Testing Across Entire Application
  console.log('\n--- Step 7: Regression Testing Across Application ---');
  await (test(async () => {
    const res = await request('/health');
    assert(res.status === 200, 'GET /api/health returns 200 OK');
    assert(res.body.status === 'ok', 'Health status is ok');
    assert(res.body.db === undefined, 'Public health does not leak database info');
  }, 'Public health check'))();

  await (test(async () => {
    const res = await request('/settings/public');
    assert(res.status === 200, 'GET /api/settings/public returns 200');
    assert(res.body.allowRegistration !== undefined, 'allowRegistration present');
  }, 'Public settings endpoint'))();

  await (test(async () => {
    const res = await request('/announcements');
    assert(res.status === 200, 'GET /api/announcements returns 200');
    assert(Array.isArray(res.body.announcements), 'Announcements list returned');
  }, 'Public announcements endpoint'))();

  await (test(async () => {
    const res = await request('/auth/presets');
    assert(res.status === 200, 'GET /api/auth/presets returns 200');
    assert(Array.isArray(res.body.avatars), 'Preset avatars returned');
  }, 'Presets endpoint'))();

  await (test(async () => {
    const res = await request('/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'GET /api/admin/overview returns 200');
    assert(res.body.stats !== undefined, 'Stats present');
  }, 'Admin overview endpoint'))();

  await (test(async () => {
    const res = await request('/admin/health', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'GET /api/admin/health returns 200');
    assert(res.body.database?.status === 'connected', 'Database is connected');
  }, 'Admin system health endpoint'))();

  await (test(async () => {
    const res = await request('/admin/storage/metrics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'GET /api/admin/storage/metrics returns 200');
  }, 'Admin storage metrics endpoint'))();

  console.log(`\n========================================`);
  console.log(`Part 6 Results: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

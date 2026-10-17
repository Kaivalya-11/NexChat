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
  console.log('🧪 Running Admin Authorization & Foundation Tests...');
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
    // 1. Unauthenticated checks
    console.log('\n--- 1. Testing Unauthenticated Access ---');
    const noTokenRes = await request('GET', '/admin/verify');
    assert(noTokenRes.status === 401, 'Accessing /api/admin/verify without token returns 401');

    const badTokenRes = await request('GET', '/admin/verify', null, 'invalid-token-12345');
    assert(badTokenRes.status === 401, 'Accessing /api/admin/verify with invalid token returns 401');

    // 2. Public registration security
    console.log('\n--- 2. Testing Public Registration Security ---');
    const reservedAttempt = await request('POST', '/auth/register', {
      username: 'admin',
      email: 'fakeadmin@test.com',
      password: 'password123'
    });
    assert(reservedAttempt.status === 400, 'Registering reserved username "admin" returns 400 Bad Request');

    const normalUsername = 'test_reg_user_' + Date.now();
    const exploitRegisterAttempt = await request('POST', '/auth/register', {
      username: normalUsername,
      email: `${normalUsername}@test.com`,
      password: 'password123',
      role: 'admin',      // Attempt privilege escalation in body
      isAdmin: true       // Attempt privilege escalation in body
    });
    assert(exploitRegisterAttempt.status === 201, 'Regular user registration succeeds');
    assert(exploitRegisterAttempt.data.user.role === 'user', 'Registered user role is strictly "user"');
    assert(exploitRegisterAttempt.data.user.isAdmin === false, 'Registered user isAdmin is strictly false');
    const normalUserToken = exploitRegisterAttempt.data.token;

    // 3. Non-admin access to admin endpoints
    console.log('\n--- 3. Testing Non-Admin Authorization ---');
    const normalVerify = await request('GET', '/admin/verify', null, normalUserToken);
    assert(normalVerify.status === 403, 'Normal user accessing /api/admin/verify is rejected with 403 Forbidden');

    const normalOverview = await request('GET', '/admin/overview', null, normalUserToken);
    assert(normalOverview.status === 403, 'Normal user accessing /api/admin/overview is rejected with 403 Forbidden');

    const normalHealth = await request('GET', '/admin/health', null, normalUserToken);
    assert(normalHealth.status === 403, 'Normal user accessing /api/admin/health is rejected with 403 Forbidden');

    // 4. Admin access to admin endpoints
    console.log('\n--- 4. Testing Admin Authorization ---');
    const adminLoginRes = await request('POST', '/auth/login', {
      username: 'Kaivalya',
      password: 'test'
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds');
    assert(adminLoginRes.data.user.isAdmin === true, 'Admin user object has isAdmin === true');
    assert(adminLoginRes.data.user.role === 'admin', 'Admin user object has role === "admin"');
    const adminToken = adminLoginRes.data.token;

    const adminVerify = await request('GET', '/admin/verify', null, adminToken);
    assert(adminVerify.status === 200, 'Admin accessing /api/admin/verify returns 200 OK');
    assert(adminVerify.data.ok === true && adminVerify.data.user.role === 'admin', 'Admin verify returns valid admin user payload');

    const adminOverview = await request('GET', '/admin/overview', null, adminToken);
    assert(adminOverview.status === 200, 'Admin accessing /api/admin/overview returns 200 OK');
    assert(adminOverview.data.stats && typeof adminOverview.data.stats.users.total === 'number', 'Overview contains real database user count');
    assert(typeof adminOverview.data.stats.channels.total === 'number', 'Overview contains real database channel count');
    assert(typeof adminOverview.data.stats.messages.total === 'number', 'Overview contains real database message count');
    assert(adminOverview.data.server && typeof adminOverview.data.server.uptimeSeconds === 'number', 'Overview contains server runtime info');

    const adminHealth = await request('GET', '/admin/health', null, adminToken);
    assert(adminHealth.status === 200, 'Admin accessing /api/admin/health returns 200 OK');
    assert(adminHealth.data.database && adminHealth.data.database.status === 'connected', 'Health returns connected database state');
    assert(adminHealth.data.memory && typeof adminHealth.data.memory.heapUsedMb === 'number', 'Health returns real memory metrics');

    console.log('\n========================================');
    console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('========================================');
    if (testsFailed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

run();


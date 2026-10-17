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
  console.log('🧪 Starting Part 5 (Announcements, Settings & Storage) Test Suite...\n');
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
    // 1. Authentication setup
    console.log('--- Step 1: Authentication Setup ---');
    const adminLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'Kaivalya', password: 'test' }
    });
    assert(adminLogin.status === 200 && adminLogin.data?.token, 'Logged in as Kaivalya (admin)');
    const adminToken = adminLogin.data?.token;

    // Register or login a test regular user
    const testUsername = `test_part5_user_${Date.now().toString().slice(-4)}`;
    const regRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: 'Password123!'
      }
    });
    let userToken = regRes.data?.token;
    if (!userToken) {
      const uLogin = await request(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { username: testUsername, password: 'Password123!' }
      });
      userToken = uLogin.data?.token;
    }
    assert(Boolean(userToken), 'Obtained test regular user token');

    // 2. Public Endpoints
    console.log('\n--- Step 2: Public Settings and Announcements Endpoints ---');
    const pubSettings = await request(`${API_BASE}/settings/public`);
    assert(pubSettings.status === 200, 'GET /api/settings/public returns HTTP 200');
    assert(typeof pubSettings.data?.allowRegistration === 'boolean', 'Public settings includes allowRegistration');
    assert(typeof pubSettings.data?.announcementsEnabled === 'boolean', 'Public settings includes announcementsEnabled');
    assert(typeof pubSettings.data?.maintenanceMode?.enabled === 'boolean', 'Public settings includes maintenanceMode state');

    const pubAnnounce = await request(`${API_BASE}/announcements`);
    assert(pubAnnounce.status === 200, 'GET /api/announcements returns HTTP 200');
    assert(Array.isArray(pubAnnounce.data?.announcements), 'Public announcements returns an array');

    // 3. Platform Announcements CRUD & Publishing
    console.log('\n--- Step 3: Platform Announcements Lifecycle ---');
    // 3a. Unauthorized access
    const unauthAnnounce = await request(`${API_BASE}/admin/announcements`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(unauthAnnounce.status === 403, 'Regular user accessing /api/admin/announcements rejected with 403');

    // 3b. Create Draft Announcement
    const createDraft = await request(`${API_BASE}/admin/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: {
        title: 'System Maintenance Window Notice',
        content: 'We will be performing a 15-minute maintenance check tonight.',
        category: 'maintenance',
        status: 'draft',
        priority: 'high',
        isDismissible: true
      }
    });
    assert(createDraft.status === 201, 'POST /api/admin/announcements creates announcement (201)');
    const announcementId = createDraft.data?.announcement?.id;
    assert(Boolean(announcementId), 'Announcement ID generated');
    assert(createDraft.data?.announcement?.status === 'draft', 'Announcement created as draft');

    // 3c. Verify draft is NOT visible in public endpoint
    const pubCheck1 = await request(`${API_BASE}/announcements`);
    const foundDraftInPub = pubCheck1.data?.announcements?.some(a => a.id === announcementId);
    assert(!foundDraftInPub, 'Draft announcement is NOT exposed in public /api/announcements');

    // 3d. Update Announcement
    const updateRes = await request(`${API_BASE}/admin/announcements/${announcementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: {
        title: 'Updated: Maintenance Window Notice',
        content: 'Updated content: Maintenance starting at midnight UTC.',
        priority: 'urgent'
      }
    });
    assert(updateRes.status === 200, 'PUT /api/admin/announcements/:id returns 200');
    assert(updateRes.data?.announcement?.title === 'Updated: Maintenance Window Notice', 'Announcement title updated');

    // 3e. Publish Announcement via status patch
    const pubStatusRes = await request(`${API_BASE}/admin/announcements/${announcementId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { status: 'published' }
    });
    assert(pubStatusRes.status === 200, 'PATCH /api/admin/announcements/:id/status returns 200');
    assert(pubStatusRes.data?.announcement?.status === 'published', 'Announcement status is now published');
    assert(Boolean(pubStatusRes.data?.announcement?.publishedAt), 'publishedAt timestamp is populated');

    // 3f. Verify published announcement is now visible in public endpoint
    const pubCheck2 = await request(`${API_BASE}/announcements`);
    const foundPubInPub = pubCheck2.data?.announcements?.some(a => a.id === announcementId);
    assert(foundPubInPub, 'Published announcement is now visible in public /api/announcements');

    // 3g. Archive Announcement
    const archiveRes = await request(`${API_BASE}/admin/announcements/${announcementId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { status: 'archived' }
    });
    assert(archiveRes.status === 200, 'Announcement archived successfully (200)');

    // 3h. Delete Announcement
    const deleteRes = await request(`${API_BASE}/admin/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteRes.status === 200, 'DELETE /api/admin/announcements/:id returns 200');

    // 4. Platform Settings & Maintenance Mode
    console.log('\n--- Step 4: Platform Settings & Maintenance Mode ---');
    // 4a. Read settings
    const getSettings = await request(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(getSettings.status === 200, 'GET /api/admin/settings returns 200');
    assert(getSettings.data?.settings !== undefined, 'Settings object returned');

    // 4b. Test Registration Toggle
    const disableReg = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { allowRegistration: false }
    });
    assert(disableReg.status === 200, 'PATCH /api/admin/settings disabled registration');

    // Try to register new user -> should fail with 403
    const blockedReg = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        username: `should_fail_${Date.now()}`,
        email: `fail_${Date.now()}@example.com`,
        password: 'Password123!'
      }
    });
    assert(blockedReg.status === 403, 'New registration rejected with 403 when registration is disabled');

    // Re-enable registration
    const enableReg = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { allowRegistration: true }
    });
    assert(enableReg.status === 200, 'Re-enabled registration via settings');

    // 4c. Test Maintenance Mode & Safe Recovery
    console.log('Testing Maintenance Mode & Admin Access Recovery...');
    const enableMaint = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: {
        maintenanceMode: {
          enabled: true,
          message: 'Scheduled server maintenance in progress.'
        }
      }
    });
    assert(enableMaint.status === 200, 'Enabled maintenanceMode via settings');

    // Regular user login should be blocked with 503
    const regUserLoginMaint = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: testUsername, password: 'Password123!' }
    });
    assert(regUserLoginMaint.status === 503, 'Non-admin login during maintenance returns HTTP 503');
    assert(regUserLoginMaint.data?.error?.includes('maintenance'), 'Maintenance message returned to user');

    // Admin login MUST still succeed (Recovery guarantee)
    const adminLoginMaint = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'Kaivalya', password: 'test' }
    });
    assert(adminLoginMaint.status === 200, 'Admin can safely log in during maintenance mode (Recovery Guarantee)');

    // Admin disables maintenance mode
    const disableMaint = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: {
        maintenanceMode: {
          enabled: false,
          message: ''
        }
      }
    });
    assert(disableMaint.status === 200, 'Disabled maintenanceMode via settings');

    // Regular user can log in again
    const regUserRestored = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: testUsername, password: 'Password123!' }
    });
    assert(regUserRestored.status === 200, 'Non-admin login restored after maintenance disabled');

    // 4d. Test File Upload Ceiling Setting
    const updateCeiling = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { fileUploadCeilingMb: 20 }
    });
    assert(updateCeiling.status === 200, 'Updated fileUploadCeilingMb to 20MB');

    // Non-admin modifying settings must be rejected
    const unauthSettings = await request(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: { allowRegistration: false }
    });
    assert(unauthSettings.status === 403, 'Non-admin modifying settings rejected with 403 Forbidden');

    // 5. Storage Management & Orphan Detection
    console.log('\n--- Step 5: Storage Management & Orphaned Files ---');
    // 5a. Get Storage Metrics
    const storageMetrics = await request(`${API_BASE}/admin/storage/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(storageMetrics.status === 200, 'GET /api/admin/storage/metrics returns 200');
    assert(typeof storageMetrics.data?.storage?.totalFiles === 'number', 'Storage metrics includes totalFiles');
    assert(typeof storageMetrics.data?.storage?.totalBytes === 'number', 'Storage metrics includes totalBytes');
    assert(storageMetrics.data?.storage?.fileTypes !== undefined, 'Storage metrics includes fileTypes breakdown');
    assert(storageMetrics.data?.storage?.usageTypes !== undefined, 'Storage metrics includes usageTypes breakdown');
    assert(Boolean(storageMetrics.data?.provider?.name), 'Storage provider identified');

    // 5b. Get Storage Files Listing
    const storageFiles = await request(`${API_BASE}/admin/storage/files`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(storageFiles.status === 200, 'GET /api/admin/storage/files returns 200');
    assert(Array.isArray(storageFiles.data?.files), 'Storage files returns array');
    assert(storageFiles.data?.pagination !== undefined, 'Storage files returns pagination');

    // 5c. Scan for Orphans
    const orphanScan = await request(`${API_BASE}/admin/storage/scan-orphans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(orphanScan.status === 200, 'POST /api/admin/storage/scan-orphans returns 200');
    assert(typeof orphanScan.data?.orphanedCount === 'number', 'Orphan scan returns orphanedCount');
    assert(typeof orphanScan.data?.totalScanned === 'number', 'Orphan scan returns totalScanned');

    // 5d. Cleanup Orphan without confirmation -> Rejected
    const rejectCleanup = await request(`${API_BASE}/admin/storage/cleanup-orphan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: { fileId: '60c72b2f9b1d8b0015f8a000', confirm: false }
    });
    assert(rejectCleanup.status === 400, 'Cleanup without explicit confirmation is rejected with 400');

    // Non-admin cleanup -> 403
    const unauthCleanup = await request(`${API_BASE}/admin/storage/cleanup-orphan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: { fileId: '60c72b2f9b1d8b0015f8a000', confirm: true }
    });
    assert(unauthCleanup.status === 403, 'Non-admin storage cleanup rejected with 403 Forbidden');

  } catch (err) {
    console.error('Unexpected error during testing:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Part 5 Results: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();


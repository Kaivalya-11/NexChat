const http = require('http');

const API_URL = 'http://localhost:3001/api';

async function request(method, path, data, token = null) {
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
  try {
    console.log('--- DATA ISOLATION TEST ---');

    // 1. Register User 1
    const u1 = { username: 'testuser1_' + Date.now(), email: 't1@test.com', password: 'password' };
    console.log(`Registering ${u1.username}...`);
    const res1 = await request('POST', '/auth/register', u1);
    if (res1.status !== 201) throw new Error(`Failed to register u1: ${JSON.stringify(res1.data)}`);
    const token1 = res1.data.token;
    const user1Id = res1.data.user.id;

    // 2. Verify User 1 channels
    const ch1 = await request('GET', '/channels', null, token1);
    console.log(`User 1 Channels: ${ch1.data.length}`);
    if (ch1.data.length !== 0) throw new Error('User 1 should have 0 channels');

    // 3. Register User 2
    const u2 = { username: 'testuser2_' + Date.now(), email: 't2@test.com', password: 'password' };
    console.log(`Registering ${u2.username}...`);
    const res2 = await request('POST', '/auth/register', u2);
    if (res2.status !== 201) throw new Error('Failed to register u2');
    const token2 = res2.data.token;
    const user2Id = res2.data.user.id;

    // 4. Verify User 2 channels
    const ch2 = await request('GET', '/channels', null, token2);
    console.log(`User 2 Channels: ${ch2.data.length}`);
    if (ch2.data.length !== 0) throw new Error('User 2 should have 0 channels');

    // 5. User 1 creates channel
    console.log('User 1 creating channel...');
    const createRes = await request('POST', '/channels', { name: 'secret-test-channel', description: '' }, token1);
    const channelId = createRes.data.id;
    console.log(`Channel created: ${channelId}`);

    // 6. Verify User 2 still has 0 channels
    const ch2_after = await request('GET', '/channels', null, token2);
    console.log(`User 2 Channels after U1 creation: ${ch2_after.data.length}`);
    if (ch2_after.data.length !== 0) throw new Error('User 2 should not see User 1 channel');

    // Try to fetch messages for User 2 in User 1's channel
    const msgRes = await request('GET', `/messages/${channelId}`, null, token2);
    console.log(`User 2 trying to read U1 channel messages: Status ${msgRes.status}`);
    if (msgRes.status !== 403) throw new Error('User 2 should be denied access to read messages');

    // 7. Add User 2 to channel
    console.log('User 1 adding User 2 to channel...');
    await request('POST', `/channels/${channelId}/members`, { userId: user2Id }, token1);

    // 8. Verify User 2 can now see channel
    const ch2_final = await request('GET', '/channels', null, token2);
    console.log(`User 2 Channels after being added: ${ch2_final.data.length}`);
    if (ch2_final.data.length !== 1) throw new Error('User 2 should see 1 channel now');
    
    // User 2 reads messages
    const msgResFinal = await request('GET', `/messages/${channelId}`, null, token2);
    console.log(`User 2 trying to read U1 channel messages after being added: Status ${msgResFinal.status}`);
    if (msgResFinal.status !== 200) throw new Error('User 2 should be able to read messages');

    console.log('--- ALL TESTS PASSED SUCCESSFULLY! DATA ISOLATION CONFIRMED. ---');
  } catch (err) {
    console.error('TEST FAILED:', err.message);
  }
}

run();

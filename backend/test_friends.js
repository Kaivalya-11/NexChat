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
    console.log('--- FRIENDS API TEST ---');

    // 1. Register User A
    const u1 = { username: 'testuserA_' + Date.now(), email: 'ta@test.com', password: 'password' };
    console.log(`Registering ${u1.username}...`);
    const res1 = await request('POST', '/auth/register', u1);
    if (res1.status !== 201) {
       console.error("Registration failed:", res1);
       throw new Error(`Failed to register User A: ${JSON.stringify(res1.data)}`);
    }
    const tokenA = res1.data.token;
    const userAId = res1.data.user.id;

    // 2. Register User B
    const u2 = { username: 'testuserB_' + Date.now(), email: 'tb@test.com', password: 'password' };
    console.log(`Registering ${u2.username}...`);
    const res2 = await request('POST', '/auth/register', u2);
    if (res2.status !== 201) throw new Error('Failed to register User B');
    const tokenB = res2.data.token;
    const userBId = res2.data.user.id;

    // 3. User A searches for User B
    const searchRes = await request('GET', `/friends/search?q=${u2.username}`, null, tokenA);
    if (searchRes.status !== 200 || searchRes.data.length === 0 || searchRes.data[0].username !== u2.username) {
       throw new Error('User A could not find User B in search');
    }
    console.log('Search passed.');

    // 4. User A sends Friend Request to User B
    const reqRes = await request('POST', '/friends/requests', { to: userBId }, tokenA);
    if (reqRes.status !== 201) throw new Error(`Failed to send request: ${JSON.stringify(reqRes.data)}`);
    const requestId = reqRes.data._id || reqRes.data.id;
    console.log(`Request sent. ID: ${requestId}`);

    // 5. User B checks incoming requests
    const incRes = await request('GET', '/friends/requests', null, tokenB);
    if (incRes.status !== 200 || incRes.data.incoming.length !== 1 || incRes.data.incoming[0].user.id !== userAId) {
        throw new Error('User B did not receive request');
    }
    const receivedRequestId = incRes.data.incoming[0].id;
    console.log('User B received request.');

    // 6. User B accepts Request
    const acceptRes = await request('POST', `/friends/requests/${receivedRequestId}/accept`, null, tokenB);
    if (acceptRes.status !== 200) throw new Error(`Failed to accept request: ${JSON.stringify(acceptRes.data)}`);
    console.log('User B accepted request.');

    // 7. Verify Both have each other as friends
    const friendsA = await request('GET', '/friends', null, tokenA);
    const friendsB = await request('GET', '/friends', null, tokenB);

    if (friendsA.data.length !== 1 || friendsA.data[0].id !== userBId) throw new Error('User A does not have User B as friend');
    if (friendsB.data.length !== 1 || friendsB.data[0].id !== userAId) throw new Error('User B does not have User A as friend');
    console.log('Friendship established on both sides.');

    // 8. User A creates channel and we test CreateChannel flow backend
    console.log('--- ALL FRIENDS TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('TEST FAILED:', err.message);
  }
}

run();

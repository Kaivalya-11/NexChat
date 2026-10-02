const http = require('http');

async function test() {
  console.log('Testing login and messages...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  
  const token = loginData.token;
  console.log('Got token:', token);
  
  const channelsRes = await fetch('http://localhost:3001/api/channels', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const channels = await channelsRes.json();
  console.log('Channels:', channels.map(c => c.id));
  
  if (channels.length > 0) {
    const channelId = channels[0].id;
    console.log('Fetching messages for channel:', channelId);
    const msgsRes = await fetch(`http://localhost:3001/api/messages/${channelId}?limit=40`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const msgsData = await msgsRes.json();
    console.log('Messages Status:', msgsRes.status);
    console.log('Messages Response:', msgsData);
  }
}

test();

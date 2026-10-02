const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const store = require('./server/store');

async function test() {
  await store.initDB();
  const user = await store.findUserByUsername('Kaivalya');
  console.log('Kaivalya user id:', user.id);
  
  const channels = await store.getChannelsForUser(user.id);
  console.log('Kaivalya channels:', channels.map(c => ({ id: c.id, members: c.members })));
  
  if (channels.length > 0) {
    const chanId = channels[0].id;
    console.log('Testing chanId:', chanId);
    
    const chan = await store.getChannelById(chanId);
    console.log('Fetched chan members:', chan.members);
    console.log('Includes user.id?', chan.members.includes(user.id));
  }
  process.exit(0);
}
test();

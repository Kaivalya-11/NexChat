const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: './.env' });

const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const channelsRoutes = require('./routes/channels');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const store = require('./store');

const expressApp = express();
const server = http.createServer(expressApp);

async function startServer() {
  await store.initDB();

  const io = new Server(server, {
    cors: {
      origin: '*', // We can restrict this in production
      methods: ['GET', 'POST']
    }
  });

  initSocket(io);

  expressApp.use(cors());
  expressApp.use(express.json());

  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/channels', channelsRoutes);
  expressApp.use('/api/messages', messagesRoutes);
  expressApp.use('/api/upload', uploadRoutes);

  expressApp.use('/uploads', express.static('./public/uploads'));

  const PORT = process.env.PORT || 3001;

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Backend API ready on port ${PORT}`);
  });
}

startServer();

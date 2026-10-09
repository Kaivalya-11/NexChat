const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const channelsRoutes = require('./routes/channels');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const friendsRoutes = require('./routes/friends');
const store = require('./store');

const expressApp = express();
const server = http.createServer(expressApp);

async function startServer() {
  await store.initDB();

  const CLIENT_URL = process.env.CLIENT_URL || '*';

  const corsOptions = {
    origin: function (origin, callback) {
      callback(null, true); // reflect origin
    },
    credentials: true
  };

  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  initSocket(io);

  expressApp.use(cors(corsOptions));

  expressApp.use(express.json());

  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/channels', channelsRoutes);
  expressApp.use('/api/messages', messagesRoutes);
  expressApp.use('/api/upload', uploadRoutes);
  expressApp.use('/api/friends', friendsRoutes);

  expressApp.use('/uploads', express.static('./public/uploads'));

  const PORT = process.env.PORT || 3001;

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Backend API ready on port ${PORT}`);
  });
}

startServer();
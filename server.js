const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: './server/.env' });

const { initSocket } = require('./server/socket');
const authRoutes = require('./server/routes/auth');
const channelsRoutes = require('./server/routes/channels');
const messagesRoutes = require('./server/routes/messages');
const uploadRoutes = require('./server/routes/upload');
const store = require('./server/store');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  
  // Connect to DB
  await store.initDB();

  // Socket setup
  const io = new Server(server, {
    cors: {
      origin: '*', // We can restrict this in production
      methods: ['GET', 'POST']
    }
  });
  
  initSocket(io);

  // Middlewares
  expressApp.use(cors());
  expressApp.use(express.json());

  // API Routes
  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/channels', channelsRoutes);
  expressApp.use('/api/messages', messagesRoutes);
  expressApp.use('/api/upload', uploadRoutes);

  // Serve static files from backend public if needed, or next.js will handle public
  expressApp.use('/uploads', express.static('./server/public/uploads'));

  // Fallback for all other routes to Next.js
  expressApp.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

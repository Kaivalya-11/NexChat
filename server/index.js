const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const store = require('./store');
const { initSocket } = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), database: store.isMongo() ? 'MongoDB' : 'Local File Store' });
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

initSocket(io);

const PORT = process.env.PORT || 5000;

// Initialize Database connection then start server
store.initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Real-Time Chat Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize store:', err);
  server.listen(PORT, () => {
    console.log(`🚀 Real-Time Chat Server running on http://localhost:${PORT}`);
  });
});
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
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
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

  // Public deployment health check endpoint (returns minimal safe status, no sensitive details)
  expressApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public announcements endpoint (only returns published, non-expired announcements)
  expressApp.get('/api/announcements', async (req, res) => {
    try {
      const isEnabled = await store.getPlatformSetting('announcementsEnabled', true);
      if (!isEnabled) {
        return res.json({ announcements: [] });
      }
      const now = new Date();
      const docs = await store.AnnouncementModel.find({
        status: 'published',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }).sort({ publishedAt: -1, createdAt: -1 }).limit(10);
      res.json({ announcements: docs.map(store.formatAnnouncement) });
    } catch (err) {
      console.error('Error fetching public announcements:', err);
      res.status(500).json({ error: 'Failed to retrieve announcements' });
    }
  });

  // Public safe settings endpoint
  expressApp.get('/api/settings/public', async (req, res) => {
    try {
      const { settings } = await store.getAllPlatformSettings();
      res.json({
        maintenanceMode: {
          enabled: Boolean(settings.maintenanceMode?.enabled),
          message: settings.maintenanceMode?.message || ''
        },
        allowRegistration: Boolean(settings.allowRegistration),
        announcementsEnabled: Boolean(settings.announcementsEnabled),
        fileUploadCeilingMb: settings.fileUploadCeilingMb || 25,
        featureFlags: settings.featureFlags || {}
      });
    } catch (err) {
      console.error('Error fetching public settings:', err);
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/channels', channelsRoutes);
  expressApp.use('/api/messages', messagesRoutes);
  expressApp.use('/api/upload', uploadRoutes);
  expressApp.use('/api/friends', friendsRoutes);
  expressApp.use('/api/reports', reportsRoutes);
  expressApp.use('/api/admin', adminRoutes);

  expressApp.use('/uploads', express.static('./public/uploads'));

  // Centralized Error Handler (prevents leaking internal stack traces)
  expressApp.use((err, req, res, next) => {
    console.error('Unhandled API Error:', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error')
    });
  });

  const PORT = process.env.PORT || 3001;

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Backend API ready on port ${PORT}`);
  });
}

startServer();
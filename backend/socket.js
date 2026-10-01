const jwt = require('jsonwebtoken');
const store = require('./store');
const { JWT_SECRET } = require('./middleware/auth');

// Map of userId -> Set of socket.id
const userSockets = new Map();
// Map of socket.id -> userId
const socketUserMap = new Map();

function initSocket(io) {
  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;

    // Track user socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socketUserMap.set(socket.id, userId);

    // Set online status in database and broadcast
    const userProfile = await store.updateUser(userId, { status: 'online', lastSeen: new Date().toISOString() });
    io.emit('presence-update', {
      userId,
      status: 'online',
      lastSeen: new Date().toISOString(),
      user: userProfile
    });

    console.log(`🔌 Socket connected: ${username} (${socket.id})`);

    // Automatically join all user's channels
    try {
      const userChannels = await store.getChannelsForUser(userId);
      userChannels.forEach(c => {
        socket.join(c.id);
      });
    } catch (err) {
      console.error('Error joining user channels:', err);
    }

    // Explicit Join / Leave room handler
    socket.on('join-channel', (channelId) => {
      socket.join(channelId);
      console.log(`User ${username} joined channel ${channelId}`);
    });

    socket.on('leave-channel', (channelId) => {
      socket.leave(channelId);
    });

    // Send Message
    socket.on('send-message', async (data, callback) => {
      try {
        const { channelId, content, media, parentId } = data;
        const senderProfile = await store.findUserById(userId);

        const newMsg = await store.createMessage({
          channelId,
          sender: userId,
          content,
          media,
          parentId
        });

        // Broadcast to channel room
        io.to(channelId).emit('new-message', newMsg);

        // Also emit notification alert to channel members who might be in other rooms
        const channel = await store.getChannelById(channelId);
        if (channel) {
          channel.members.forEach(memberId => {
            if (memberId !== userId) {
              const recipientSockets = userSockets.get(memberId);
              if (recipientSockets) {
                recipientSockets.forEach(sId => {
                  io.to(sId).emit('notification-alert', {
                    channelId,
                    channelName: channel.isGroup ? `#${channel.name}` : `Direct Message from ${senderProfile?.username}`,
                    message: newMsg
                  });
                });
              }
            }
          });
        }

        if (typeof callback === 'function') {
          callback({ success: true, message: newMsg });
        }
      } catch (err) {
        console.error('Error sending message:', err);
        if (typeof callback === 'function') {
          callback({ error: 'Failed to send message' });
        }
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ channelId }) => {
      socket.to(channelId).emit('user-typing', {
        userId,
        username,
        channelId
      });
    });

    socket.on('typing-stop', ({ channelId }) => {
      socket.to(channelId).emit('user-stop-typing', {
        userId,
        channelId
      });
    });

    // Message Reactions
    socket.on('toggle-reaction', async ({ messageId, emoji, channelId }) => {
      try {
        const updatedMsg = await store.toggleReaction(messageId, userId, emoji);
        if (updatedMsg) {
          io.to(channelId).emit('reaction-updated', {
            messageId,
            reactions: updatedMsg.reactions,
            channelId
          });
        }
      } catch (err) {
        console.error('Error toggling reaction:', err);
      }
    });

    // Mark Messages as Read
    socket.on('mark-read', async ({ channelId }) => {
      try {
        await store.markMessageRead(channelId, userId);
        io.to(channelId).emit('messages-read', {
          channelId,
          readByUserId: userId,
          readAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error marking read:', err);
      }
    });

    // Channel creation / update real-time sync
    socket.on('channel-updated', ({ channelId }) => {
      io.to(channelId).emit('channel-details-changed', { channelId });
    });

    // Custom Status Update
    socket.on('update-status', async ({ status, statusText }) => {
      try {
        const updated = await store.updateUser(userId, { status, statusText });
        io.emit('presence-update', {
          userId,
          status,
          statusText,
          lastSeen: new Date().toISOString(),
          user: updated
        });
      } catch (err) {
        console.error('Error updating socket status:', err);
      }
    });

    // Disconnect Handler
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${username} (${socket.id})`);
      const sSet = userSockets.get(userId);
      if (sSet) {
        sSet.delete(socket.id);
        if (sSet.size === 0) {
          userSockets.delete(userId);
          const nowIso = new Date().toISOString();
          const updatedUser = await store.updateUser(userId, { status: 'offline', lastSeen: nowIso });
          io.emit('presence-update', {
            userId,
            status: 'offline',
            lastSeen: nowIso,
            user: updatedUser
          });
        }
      }
      socketUserMap.delete(socket.id);
    });
  });
}

module.exports = { initSocket };

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
        const { channelId, content, media, parentId, quote, type } = data;
        const senderProfile = await store.findUserById(userId);

        const newMsg = await store.createMessage({
          channelId,
          sender: userId,
          content,
          type: type || 'text',
          media,
          parentId,
          quote
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

    // Poll Voting Handler
    socket.on('vote-poll', async ({ messageId, optionIndex, channelId }) => {
      try {
        const msg = await store.getMessageById(messageId);
        if (msg && msg.type === 'poll') {
          let pollData = JSON.parse(msg.content);
          const option = pollData.options[optionIndex];
          if (!option) return;

          let votes = option.votes || [];
          const userIdx = votes.indexOf(userId);

          if (userIdx > -1) {
            // Unvote
            votes.splice(userIdx, 1);
          } else {
            // Vote
            if (!pollData.allowMultiple) {
              // Remove vote from other options if single choice
              pollData.options.forEach(opt => {
                opt.votes = (opt.votes || []).filter(v => v !== userId);
              });
            }
            votes.push(userId);
          }
          option.votes = votes;

          const updatedMsg = await store.updateMessageContent(messageId, JSON.stringify(pollData));
          io.to(channelId).emit('poll-updated', { messageId, poll: pollData, channelId });
        }
      } catch (err) {
        console.error('Error in vote-poll:', err);
      }
    });

    // WebRTC Video / Audio Call Signaling
    socket.on('call-user', async ({ channelId, isVideo }) => {
      const callerUser = await store.findUserById(userId);
      const channel = await store.getChannelById(channelId);

      const payload = {
        channelId,
        caller: {
          id: userId,
          username: socket.user.username,
          avatar: callerUser?.avatar
        },
        isVideo
      };

      socket.to(channelId).emit('incoming-call', payload);

      if (channel && channel.members) {
        channel.members.forEach(memberId => {
          if (memberId !== userId) {
            const recipientSockets = userSockets.get(memberId);
            if (recipientSockets) {
              recipientSockets.forEach(sId => {
                io.to(sId).emit('incoming-call', payload);
              });
            }
          }
        });
      }
    });

    socket.on('accept-call', async ({ channelId }) => {
      const acceptorUser = await store.findUserById(userId);
      const channel = await store.getChannelById(channelId);

      const payload = {
        channelId,
        user: {
          id: userId,
          username: socket.user.username,
          avatar: acceptorUser?.avatar
        }
      };

      io.to(channelId).emit('call-accepted', payload);

      if (channel && channel.members) {
        channel.members.forEach(memberId => {
          const recipientSockets = userSockets.get(memberId);
          if (recipientSockets) {
            recipientSockets.forEach(sId => {
              io.to(sId).emit('call-accepted', payload);
            });
          }
        });
      }
    });

    socket.on('reject-call', async ({ channelId }) => {
      const channel = await store.getChannelById(channelId);
      socket.to(channelId).emit('call-rejected', { channelId, userId });
      if (channel && channel.members) {
        channel.members.forEach(memberId => {
          if (memberId !== userId) {
            const recipientSockets = userSockets.get(memberId);
            if (recipientSockets) {
              recipientSockets.forEach(sId => {
                io.to(sId).emit('call-rejected', { channelId, userId });
              });
            }
          }
        });
      }
    });

    socket.on('end-call', async ({ channelId }) => {
      const channel = await store.getChannelById(channelId);
      io.to(channelId).emit('call-ended', { channelId, userId });
      if (channel && channel.members) {
        channel.members.forEach(memberId => {
          const recipientSockets = userSockets.get(memberId);
          if (recipientSockets) {
            recipientSockets.forEach(sId => {
              io.to(sId).emit('call-ended', { channelId, userId });
            });
          }
        });
      }
    });

    socket.on('webrtc-signal', ({ toUserId, signal, type }) => {
      const targetSockets = userSockets.get(toUserId);
      if (targetSockets) {
        targetSockets.forEach(sId => {
          io.to(sId).emit('webrtc-signal', {
            fromUserId: userId,
            signal,
            type
          });
        });
      }
    });

    socket.on('call-toggle-media', ({ channelId, mediaType, isEnabled }) => {
      socket.to(channelId).emit('participant-media-toggled', {
        userId,
        mediaType,
        isEnabled
      });
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

    // Delete message socket handler
    socket.on('delete-message', async ({ messageId, channelId }, callback) => {
      try {
        const result = await store.deleteMessage(messageId, userId);
        if (result) {
          io.to(channelId).emit('message-deleted', { messageId, channelId });
          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        console.error('Error deleting message via socket:', err);
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Delete channel / DM socket handler
    socket.on('delete-channel', async ({ channelId }, callback) => {
      try {
        const result = await store.deleteChannel(channelId, userId);
        if (result) {
          io.to(channelId).emit('channel-deleted', { channelId, action: result.action, userId });
          io.emit('channel-details-changed', { channelId });
          if (typeof callback === 'function') callback({ success: true, result });
        }
      } catch (err) {
        console.error('Error deleting channel via socket:', err);
        if (typeof callback === 'function') callback({ error: err.message });
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

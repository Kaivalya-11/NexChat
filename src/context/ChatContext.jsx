import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { soundManager } from '../services/sound';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // { channelId: count }
  const [activeThread, setActiveThread] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [previewMedia, setPreviewMedia] = useState(null);

  // Load Channels
  const loadChannels = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getChannels(token);
      setChannels(data);
      if (data.length > 0) {
        const isActiveValid = data.some(c => c.id === activeChannelId);
        if (!activeChannelId || !isActiveValid) {
          setActiveChannelId(data[0].id);
        }
      } else {
        setActiveChannelId(null);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  }, [token, activeChannelId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Load Messages for Active Channel
  const loadMessages = useCallback(async (channelId, before = null) => {
    if (!token || !channelId) return;
    setLoadingMessages(true);
    try {
      const msgs = await api.getMessages(token, channelId, before);
      if (before) {
         setMessages(prev => [...msgs, ...prev]);
      } else {
         setMessages(msgs);
         // Mark as read when loading fresh messages
         if (socket) {
             socket.emit('mark-read', { channelId });
         }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [token, socket]);

  useEffect(() => {
    if (activeChannelId) {
      if (socket) {
        socket.emit('join-channel', activeChannelId);
      }
      loadMessages(activeChannelId);
    } else {
      setMessages([]);
    }
  }, [activeChannelId, socket, loadMessages]);

  // Socket Listeners
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      if (msg.channelId === activeChannelId) {
        setMessages(prev => [...prev, msg]);
        if (msg.sender.id !== user.id) {
          socket.emit('mark-read', { channelId: activeChannelId });
        }
      } else {
        // Notification for other channels
        soundManager.playNotificationSound();
        setUnreadCounts(prev => ({
          ...prev,
          [msg.channelId]: (prev[msg.channelId] || 0) + 1
        }));
      }
      
      // Update channel list to show latest activity
      setChannels(prev => {
         const newChannels = [...prev];
         const idx = newChannels.findIndex(c => c.id === msg.channelId);
         if (idx !== -1) {
             const [c] = newChannels.splice(idx, 1);
             c.updatedAt = new Date().toISOString();
             newChannels.unshift(c);
         }
         return newChannels;
      });
    };

    const handleUserTyping = ({ userId, channelId }) => {
      setTypingUsers(prev => {
        const current = prev[channelId] ? new Set(prev[channelId]) : new Set();
        current.add(userId);
        return { ...prev, [channelId]: current };
      });
    };

    const handleUserStopTyping = ({ userId, channelId }) => {
      setTypingUsers(prev => {
        if (!prev[channelId]) return prev;
        const current = new Set(prev[channelId]);
        current.delete(userId);
        return { ...prev, [channelId]: current };
      });
    };

    const handleReactionUpdated = ({ messageId, reactions, channelId }) => {
       if (channelId === activeChannelId) {
           setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
       }
    };

    const handlePollUpdated = ({ messageId, poll, channelId }) => {
       if (channelId === activeChannelId) {
           setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: JSON.stringify(poll) } : m));
       }
    };

    const handleMessagesRead = ({ channelId, readByUserId, readAt }) => {
       if (channelId === activeChannelId) {
           setMessages(prev => prev.map(m => {
               const readBy = m.readBy || [];
               if (!readBy.some(r => r.userId === readByUserId)) {
                   return { ...m, readBy: [...readBy, { userId: readByUserId, readAt }] };
               }
               return m;
           }));
       }
    };

    const handleChannelDetailsChanged = ({ channelId }) => {
       loadChannels(); // Reload channels
    };

    const handleNotificationAlert = (alert) => {
      setNotifications(prev => [alert, ...prev]);
    };

    const handleMessageDeleted = ({ messageId, channelId }) => {
      if (channelId === activeChannelId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      setActiveThread(prev => (prev?.id === messageId ? null : prev));
      setReplyingTo(prev => (prev?.id === messageId ? null : prev));
    };

    const handleChannelDeleted = ({ channelId }) => {
      setChannels(prev => prev.filter(c => c.id !== channelId));
      setActiveChannelId(prevId => {
        if (prevId === channelId) {
          const remaining = channels.filter(c => c.id !== channelId);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return prevId;
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('poll-updated', handlePollUpdated);
    socket.on('messages-read', handleMessagesRead);
    socket.on('channel-details-changed', handleChannelDetailsChanged);
    socket.on('notification-alert', handleNotificationAlert);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('channel-deleted', handleChannelDeleted);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('poll-updated', handlePollUpdated);
      socket.off('messages-read', handleMessagesRead);
      socket.off('channel-details-changed', handleChannelDetailsChanged);
      socket.off('notification-alert', handleNotificationAlert);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('channel-deleted', handleChannelDeleted);
    };
  }, [socket, activeChannelId, user, loadChannels, channels]);

  const handleSetActiveChannelId = useCallback((id) => {
    setActiveChannelId(id);
    setReplyingTo(null);
    if (id) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[id];
        return newCounts;
      });
    }
  }, []);

  const removeMessage = useCallback(async (messageId) => {
    if (!token || !activeChannelId) return;
    try {
      // Optimistic state update
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setActiveThread(prev => (prev?.id === messageId ? null : prev));
      setReplyingTo(prev => (prev?.id === messageId ? null : prev));

      await api.deleteMessage(token, messageId);
      if (socket) {
        socket.emit('delete-message', { messageId, channelId: activeChannelId });
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      if (activeChannelId) loadMessages(activeChannelId);
    }
  }, [token, activeChannelId, socket, loadMessages]);

  const removeChannel = useCallback(async (channelId) => {
    if (!token || !channelId) return;
    try {
      // Optimistic state update
      setChannels(prev => {
        const remaining = prev.filter(c => c.id !== channelId);
        if (activeChannelId === channelId) {
          setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });

      await api.deleteChannel(token, channelId);
      if (socket) {
        socket.emit('delete-channel', { channelId });
      }
    } catch (err) {
      console.error('Failed to delete channel:', err);
      loadChannels();
    }
  }, [token, activeChannelId, socket, loadChannels]);

  const value = {
    channels,
    activeChannelId,
    setActiveChannelId: handleSetActiveChannelId,
    messages,
    loadingMessages,
    loadMessages, // for pagination
    typingUsers,
    activeThread,
    setActiveThread,
    replyingTo,
    setReplyingTo,
    searchQuery,
    setSearchQuery,
    refreshChannels: loadChannels,
    unreadCounts,
    notifications,
    setNotifications,
    previewMedia,
    setPreviewMedia,
    removeMessage,
    removeChannel
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

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
      loadMessages(activeChannelId);
    } else {
      setMessages([]);
    }
  }, [activeChannelId, loadMessages]);

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

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('messages-read', handleMessagesRead);
    socket.on('channel-details-changed', handleChannelDetailsChanged);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('messages-read', handleMessagesRead);
      socket.off('channel-details-changed', handleChannelDetailsChanged);
    };
  }, [socket, activeChannelId, user, loadChannels]);

  const handleSetActiveChannelId = useCallback((id) => {
    setActiveChannelId(id);
    if (id) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[id];
        return newCounts;
      });
    }
  }, []);

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
    searchQuery,
    setSearchQuery,
    refreshChannels: loadChannels,
    unreadCounts
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

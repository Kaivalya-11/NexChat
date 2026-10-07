import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeThread, setActiveThread] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState({});

  const loadChannels = async () => {
    if (!token) return;
    try {
      const data = await api.getChannels(token);
      setChannels(data);
      if (data.length > 0) {
        if (!activeChannelId || !data.some(c => c.id === activeChannelId)) {
          setActiveChannelId(data[0].id);
        }
      } else {
        setActiveChannelId(null);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadMessages = async (channelId, before = null) => {
    if (!token || !channelId) return;
    setLoadingMessages(true);
    try {
      const msgs = await api.getMessages(token, channelId, before);
      if (before) {
         setMessages(prev => [...msgs, ...prev]);
         return msgs.length;
      } else {
         setMessages(msgs);
         if (socket) {
             socket.emit('mark-channel-delivered', { channelId });
             socket.emit('mark-read', { channelId });
         }
         return msgs.length;
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeChannelId) {
      if (socket) socket.emit('join-channel', activeChannelId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(activeChannelId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, socket]);

  useEffect(() => {
    if (!socket || !user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleNewMessage = (msg) => {
      if (msg.sender.id !== user.id) {
        socket.emit('mark-delivered', { messageId: msg.id, channelId: msg.channelId });

        if ('Notification' in window && Notification.permission === 'granted' && (msg.channelId !== activeChannelId || document.hidden)) {
          const channel = channels.find(c => c.id === msg.channelId);
          new Notification(`${msg.sender.username} (${channel?.isGroup ? `#${channel.name}` : 'Direct Message'})`, {
            body: msg.content || 'Sent an attachment',
            icon: msg.sender.avatar
          });
        }
      }

      if (msg.channelId === activeChannelId) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.sender.id !== user.id) socket.emit('mark-read', { channelId: activeChannelId });
      } else {
        soundManager.playNotificationSound();
        setUnreadCounts(prev => ({ ...prev, [msg.channelId]: (prev[msg.channelId] || 0) + 1 }));
      }
      
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
      setTypingUsers(prev => ({ ...prev, [channelId]: new Set(prev[channelId]).add(userId) }));
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

    const handleMessageDelivered = ({ messageId, userId, channelId }) => {
       if (channelId === activeChannelId) {
           setMessages(prev => prev.map(m => {
               if (m.id === messageId && !(m.deliveredTo || []).includes(userId)) {
                   return { ...m, deliveredTo: [...(m.deliveredTo || []), userId] };
               }
               return m;
           }));
       }
    };

    const handleChannelDelivered = ({ channelId, userId }) => {
       if (channelId === activeChannelId) {
           setMessages(prev => prev.map(m => {
               if (!(m.deliveredTo || []).includes(userId)) {
                   return { ...m, deliveredTo: [...(m.deliveredTo || []), userId] };
               }
               return m;
           }));
       }
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
    socket.on('message-delivered', handleMessageDelivered);
    socket.on('channel-delivered', handleChannelDelivered);
    socket.on('channel-details-changed', loadChannels);
    socket.on('notification-alert', alert => setNotifications(prev => [alert, ...prev]));
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('channel-deleted', handleChannelDeleted);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('poll-updated', handlePollUpdated);
      socket.off('messages-read', handleMessagesRead);
      socket.off('message-delivered', handleMessageDelivered);
      socket.off('channel-delivered', handleChannelDelivered);
      socket.off('channel-details-changed', loadChannels);
      socket.off('notification-alert');
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('channel-deleted', handleChannelDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeChannelId, user, channels]);

  const handleSetActiveChannelId = (id) => {
    setActiveChannelId(id);
    setReplyingTo(null);
    if (id) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[id];
        return newCounts;
      });
    }
  };

  const removeMessage = async (messageId) => {
    if (!token || !activeChannelId) return;
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setActiveThread(prev => (prev?.id === messageId ? null : prev));
      setReplyingTo(prev => (prev?.id === messageId ? null : prev));

      await api.deleteMessage(token, messageId);
      if (socket) socket.emit('delete-message', { messageId, channelId: activeChannelId });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const removeChannel = async (channelId) => {
    if (!token || !channelId) return;
    try {
      setChannels(prev => {
        const remaining = prev.filter(c => c.id !== channelId);
        if (activeChannelId === channelId) setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });

      await api.deleteChannel(token, channelId);
      if (socket) socket.emit('delete-channel', { channelId });
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const sendMessage = (messageData) => {
    if (!socket || !user) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      channelId: messageData.channelId,
      sender: { id: user.id, username: user.username, avatar: user.avatar },
      content: messageData.content || '',
      type: messageData.type || 'text',
      media: messageData.media || [],
      parentId: messageData.parentId || null,
      quote: messageData.quote || null,
      reactions: {},
      deliveredTo: [user.id],
      readBy: [{ userId: user.id, readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      isOptimistic: true 
    };

    if (messageData.channelId === activeChannelId) {
       setMessages(prev => [...prev, optimisticMsg]);
    }

    socket.emit('send-message', messageData, (response) => {
      if (messageData.channelId === activeChannelId) {
        if (response?.success) {
          setMessages(prev => prev.map(m => m.id === tempId ? response.message : m));
        } else {
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      }
    });
  };

  const toggleReaction = (messageId, emoji, channelId) => {
    if (!socket || !user) return;
    
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];
        const idx = reactions[emoji].indexOf(user.id);
        if (idx > -1) {
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...reactions[emoji], user.id];
        }
        return { ...m, reactions };
      }
      return m;
    }));

    socket.emit('toggle-reaction', { messageId, emoji, channelId });
  };

  const votePoll = (messageId, optionIndex, channelId) => {
    if (!socket || !user) return;

    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.type === 'poll') {
        let poll;
        try { poll = typeof m.content === 'string' ? JSON.parse(m.content) : m.content; } 
        catch(e) { return m; }
        
        const option = poll.options[optionIndex];
        if (option) {
          const votes = option.votes || [];
          const idx = votes.indexOf(user.id);
          if (idx > -1) {
            option.votes = votes.filter(id => id !== user.id);
          } else {
            if (!poll.allowMultiple) {
              poll.options.forEach(opt => { opt.votes = (opt.votes || []).filter(id => id !== user.id); });
            }
            option.votes = [...(option.votes || []), user.id];
          }
        }
        return { ...m, content: JSON.stringify(poll) };
      }
      return m;
    }));

    socket.emit('vote-poll', { messageId, optionIndex, channelId });
  };

  const pinMessage = (channelId, message) => {
    setPinnedMessages(prev => ({ ...prev, [channelId]: message }));
  };

  const unpinMessage = (channelId) => {
    setPinnedMessages(prev => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  };

  const value = {
    channels,
    activeChannelId,
    setActiveChannelId: handleSetActiveChannelId,
    messages,
    loadingMessages,
    loadMessages,
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
    removeChannel,
    sendMessage,
    toggleReaction,
    votePoll,
    pinnedMessages,
    pinMessage,
    unpinMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}

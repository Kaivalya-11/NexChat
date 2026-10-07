import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { RiCloseLine, RiUserAddFill, RiUserMinusFill, RiVipCrownFill, RiShieldUserFill } from 'react-icons/ri';

export default function MemberDrawer({ onClose }) {
  const { channels, activeChannelId, refreshChannels } = useChat();
  const { onlineUsers, socket } = useSocket();
  const { token, user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');

  const channel = channels.find(c => c.id === activeChannelId);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getAllUsers(token);
        setAllUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [token]);

  if (!channel) return null;

  const isAdmin = channel.admins?.includes(currentUser?.id) || channel.owner === currentUser?.id;
  const membersData = allUsers.filter(u => channel.members?.includes(u.id));
  const nonMembers = allUsers.filter(u => !channel.members?.includes(u.id));

  const handleRemoveMember = async (userId) => {
    try {
      await api.removeChannelMember(token, channel.id, userId);
      refreshChannels();
      socket.emit('channel-updated', { channelId: channel.id });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      await api.addChannelMember(token, channel.id, selectedUserId);
      setSelectedUserId('');
      refreshChannels();
      socket.emit('channel-updated', { channelId: channel.id });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      className="member-drawer"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 240 }}
      style={{ 
        width: '320px', 
        backgroundColor: 'var(--glass-bg)', 
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        position: 'relative',
        boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            {channel.isGroup ? '#' : ''}{channel.name}
          </h2>

          <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
            Active Room
          </div>
        </div>
        <button 
          className="btn-icon" 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '8px' }}
        >
          <RiCloseLine size={22} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select 
              value={selectedUserId} 
              onChange={e => setSelectedUserId(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-card)', 
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>Select a user...</option>
              {nonMembers.map(u => (
                <option key={u.id} value={u.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{u.username}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleAddMember}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  backgroundColor: 'var(--accent-primary)', 
                  color: 'var(--bg-darkest)', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Add
              </button>
              <button 
                onClick={() => setSelectedUserId('')}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  backgroundColor: 'var(--bg-hover)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px' }}>
          CHANNEL MEMBERS — {membersData.length}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {membersData.map((member, idx) => {
            const presence = onlineUsers.get(member.id);
            const isOnline = presence?.status === 'online' || member.status === 'online';
            const statusColor = isOnline ? '#10b981' : 'var(--text-muted)';
            const isSelf = member.id === currentUser?.id;
            const isOwner = channel.owner === member.id;

            return (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 12px', 
                  borderRadius: '12px',
                  backgroundColor: isOwner ? 'rgba(176, 228, 204, 0.05)' : (isSelf ? 'var(--bg-hover)' : 'transparent'),
                  border: isOwner ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  borderLeft: isOwner ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  boxShadow: isOwner ? '0 0 16px rgba(176, 228, 204, 0.08)' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`} 
                      alt={member.username} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      right: '0', 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: statusColor, 
                      border: '2px solid var(--glass-bg)' 
                    }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{member.username}</span>
                      {channel.owner === member.id && <RiVipCrownFill size={14} style={{ color: '#f59e0b' }} title="Owner"/>}
                      {channel.admins?.includes(member.id) && channel.owner !== member.id && <RiShieldUserFill size={14} style={{ color: 'var(--accent-primary)' }} title="Admin"/>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isOnline ? 'Available' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {isAdmin && member.id !== currentUser?.id && member.id !== channel.owner && (
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: 'none', 
                      color: '#ef4444', 
                      padding: '6px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} 
                    title="Remove Member" 
                  >
                    <RiUserMinusFill size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.72rem' }}>PINNED CHANNEL</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Mute notifications for {channel.isGroup ? "#" : ""}{channel.name}</span>
            <div style={{ width: '32px', height: '18px', background: 'var(--bg-darkest)', borderRadius: '10px', border: '1px solid var(--border-color)' }}></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


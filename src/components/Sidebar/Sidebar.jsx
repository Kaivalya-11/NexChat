import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  RiHashtag,
  RiMessage3Fill,
  RiAddFill,
  RiSearch2Line,
  RiSettings4Fill,
  RiSettings4Line,
  RiLogoutBoxRFill,
  RiSunFill,
  RiMoonClearFill,
  RiDeleteBin6Line
} from 'react-icons/ri';
import CreateChannelModal from './CreateChannelModal';
import StartDMModal from './StartDMModal';

export default function Sidebar({ onOpenProfile, onOpenSearch, theme, onToggleTheme, onSelectChannel }) {
  const { channels, activeChannelId, setActiveChannelId, unreadCounts, removeChannel } = useChat();
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();

  const handleSelect = (id) => {
    setActiveChannelId(id);
    if (onSelectChannel) {
      onSelectChannel();
    }
  };

  const groupChannels = channels.filter(c => c.isGroup);
  const dmChannels = channels.filter(c => !c.isGroup);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'var(--accent-success)';
      case 'away': return 'var(--accent-warning)';
      case 'dnd': return 'var(--accent-danger)';
      default: return 'var(--text-dim)';
    }
  };

  const getDMOtherUserStatus = (channel) => {
    const otherMemberId = channel.members.find(m => m !== user.id);
    const presence = onlineUsers.get(otherMemberId);
    return presence ? presence.status : 'offline';
  };

  const getDMName = (channel) => {
    if (channel.name.startsWith('DM: ')) {
      const parts = channel.name.replace('DM: ', '').split(' & ');
      return parts.find(p => p !== user.username) || channel.name;
    }
    return channel.name;
  };

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);

  return (
    <aside style={{
      width: '280px',
      backgroundColor: 'var(--bg-sidebar)',
      backgroundImage: theme === 'dark' ? 'radial-gradient(circle at 0% 100%, rgba(20, 184, 166, 0.15) 0%, transparent 60%)' : 'none',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        height: '60px',
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          NexChat <span style={{ fontSize: '1.1rem' }}>🚀</span>
        </h2>
        <motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.85 }}
          className="btn-icon"
          onClick={() => setShowCreateChannel(true)}
          title="Create Channel"
          style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-muted)' }}
        >
          <RiAddFill size={20} />
        </motion.button>
      </div>

      {/* Channel List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>

        {/* Groups */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>CHANNELS</span>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              className="btn-icon"
              style={{ padding: '2px', borderRadius: '6px', color: 'var(--text-muted)' }}
              onClick={() => setShowCreateChannel(true)}
            >
              <RiAddFill size={16} />
            </motion.button>
          </div>

          {groupChannels.map(c => {
            const isActive = activeChannelId === c.id;
            const hasUnread = unreadCounts[c.id] && !isActive;

            return (
              <motion.div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="channel-sidebar-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  background: isActive 
                    ? (theme === 'dark' 
                        ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(13, 148, 136, 0.48) 100%)'
                        : 'rgba(20, 184, 166, 0.15)')
                    : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: isActive ? (theme === 'dark' ? '#ffffff' : 'var(--accent-primary-hover)') : 'var(--text-muted)',
                  marginBottom: '5px',
                  boxShadow: isActive ? '0 4px 16px rgba(20, 184, 166, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                  <RiHashtag size={18} />
                </div>
                <span style={{ fontWeight: isActive || hasUnread ? 600 : 500, color: isActive ? 'var(--text-main)' : (hasUnread ? 'var(--text-main)' : 'inherit'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.92rem' }}>
                  {c.name}
                </span>

                {hasUnread && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="unread-badge"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}
                  >
                    {unreadCounts[c.id]}
                  </motion.div>
                )}

                {isActive && (
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProfile();
                    }}
                    style={{ padding: '2px', color: 'rgba(255,255,255,0.8)' }}
                    title="Channel Settings"
                  >
                    <RiSettings4Line size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* DMs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>DIRECT MESSAGES</span>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              className="btn-icon"
              style={{ padding: '2px', borderRadius: '6px', color: 'var(--text-muted)' }}
              onClick={() => setShowStartDM(true)}
            >
              <RiAddFill size={16} />
            </motion.button>
          </div>

          {dmChannels.map(c => {
            const isActive = activeChannelId === c.id;
            const status = getDMOtherUserStatus(c);
            const hasUnread = unreadCounts[c.id] && !isActive;

            return (
              <motion.div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="channel-sidebar-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(13, 148, 136, 0.48) 100%)' 
                    : 'transparent',
                  border: isActive ? '1px solid rgba(45, 212, 191, 0.4)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                  marginBottom: '5px',
                  boxShadow: isActive ? '0 4px 16px rgba(20, 184, 166, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#2dd4bf' : 'var(--text-muted)' }}>
                    <RiMessage3Fill size={14} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(status),
                    border: '2.5px solid #0c1417'
                  }} />
                </div>
                <span style={{ fontWeight: isActive || hasUnread ? 600 : 500, color: isActive ? '#ffffff' : (hasUnread ? 'white' : 'inherit'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.92rem' }}>
                  {getDMName(c)}
                </span>
                {hasUnread && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="unread-badge"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}
                  >
                    {unreadCounts[c.id]}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Floating Card User Profile (Matches Reference Image) */}
      <div style={{ padding: '12px' }}>
        <div style={{
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '16px 14px 12px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Settings icon on top right */}
          <button
            onClick={onOpenProfile}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Profile Settings"
          >
            <RiSettings4Fill size={17} />
          </button>

          {/* Large Centered Avatar */}
          <div style={{ position: 'relative', marginBottom: '8px', cursor: 'pointer' }} onClick={onOpenProfile}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
              alt={user.username}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--border-color)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(user.status || 'online'),
              border: '2.5px solid var(--glass-bg)'
            }} />
          </div>

          {/* User Name & Status Text */}
          <div style={{ textAlign: 'center', marginBottom: '14px', width: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.statusText || 'Available'}
            </div>
          </div>

          {/* Bottom Controls Strip inside Card */}
          <div style={{
            width: '100%',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              className="btn-icon"
              onClick={onOpenProfile}
              title="Settings"
              style={{ padding: '6px', color: 'var(--text-muted)' }}
            >
              <RiSettings4Fill size={17} />
            </button>

            {/* Single Theme Toggle Button */}
            <button
              className="btn-icon"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ padding: '6px', color: 'var(--text-muted)' }}
            >
              {theme === 'dark' ? (
                <RiSunFill size={17} style={{ color: '#facc15' }} />
              ) : (
                <RiMoonClearFill size={17} style={{ color: '#6366f1' }} />
              )}
            </button>

            <button
              className="btn-icon"
              onClick={logout}
              title="Logout"
              style={{ padding: '6px', color: '#ef4444' }}
            >
              <RiLogoutBoxRFill size={17} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreateChannel && <CreateChannelModal key="create-channel-modal" onClose={() => setShowCreateChannel(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showStartDM && <StartDMModal key="start-dm-modal" onClose={() => setShowStartDM(false)} />}
      </AnimatePresence>
    </aside>
  );
}

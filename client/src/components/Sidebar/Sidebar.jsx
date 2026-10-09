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
  RiDeleteBin6Line,
  RiUserSmileFill
} from 'react-icons/ri';
import CreateChannelModal from './CreateChannelModal';
import StartDMModal from './StartDMModal';
import UserProfilePanel from './UserProfilePanel';
import ChannelSettingsModal from './ChannelSettingsModal';

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
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [selectedChannelForSettings, setSelectedChannelForSettings] = useState(null);

  return (
    <aside style={{
      width: '280px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <motion.div
          className="hover-item"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 16px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            border: '1px solid var(--accent-success)',
            boxShadow: '0 4px 12px -2px rgba(40, 90, 72, 0.4), 0 0 8px rgba(176, 228, 204, 0.15)'
          }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: 'var(--accent-success)', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 0 4px rgba(176, 228, 204, 0.2)' }}>
            NexChat
          </h2>
        </motion.div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>

        <div style={{ marginBottom: '24px' }}>
          <motion.div
            onClick={() => handleSelect('friends')}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="channel-sidebar-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: activeChannelId === 'friends' ? 'var(--bg-card)' : 'transparent',
              border: activeChannelId === 'friends' ? '1px solid var(--border-color)' : '1px solid transparent',
              color: activeChannelId === 'friends' ? 'var(--text-main)' : 'var(--text-muted)',
              marginBottom: '12px'
            }}
          >
            <RiUserSmileFill size={20} />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Friends</span>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>CHANNELS</span>
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

          {groupChannels.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>You aren't in any channels yet.</p>
              <button
                onClick={() => setShowCreateChannel(true)}
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-darkest)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Create Channel
              </button>
            </div>
          ) : (
            groupChannels.map(c => {
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
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    position: 'relative',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    marginBottom: '2px',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                    <RiHashtag size={18} />
                  </div>
                  <span style={{ fontWeight: isActive || hasUnread ? 600 : 500, color: isActive ? 'var(--accent-primary)' : (hasUnread ? 'var(--text-main)' : 'inherit'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
                    {c.name}
                  </span>

                  {hasUnread && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="unread-badge"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-darkest)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}
                    >
                      {unreadCounts[c.id]}
                    </motion.div>
                  )}

                  {isActive && (
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChannelForSettings(c);
                        setShowChannelSettings(true);
                      }}
                      style={{ padding: '2px', color: 'var(--text-main)' }}
                      title="Channel Settings"
                    >
                      <RiSettings4Line size={16} />
                    </button>
                  )}
                </motion.div>
              );
            }))}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>DIRECT MESSAGES</span>
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

          {dmChannels.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>No direct messages yet.</p>
              <button
                onClick={() => setShowStartDM(true)}
                style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Start a Chat
              </button>
            </div>
          ) : (
            dmChannels.map(c => {
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
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    position: 'relative',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    marginBottom: '2px',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      <RiMessage3Fill size={14} />
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: getStatusColor(status),
                      border: '2px solid var(--bg-sidebar)'
                    }} />
                  </div>
                  <span style={{ fontWeight: isActive || hasUnread ? 600 : 500, color: isActive ? 'var(--text-main)' : (hasUnread ? 'var(--text-main)' : 'inherit'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
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
                  {isActive && (
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChannelForSettings(c);
                        setShowChannelSettings(true);
                      }}
                      style={{ padding: '2px', color: 'var(--text-main)' }}
                      title="Chat Settings"
                    >
                      <RiSettings4Line size={16} />
                    </button>
                  )}
                </motion.div>
              );
            }))}
        </div>

      </div>

      <UserProfilePanel
        user={user}
        theme={theme}
        onOpenProfile={onOpenProfile}
        onOpenSearch={onOpenSearch}
        onToggleTheme={onToggleTheme}
        logout={logout}
        getStatusColor={getStatusColor}
      />

      <AnimatePresence>
        {showCreateChannel && <CreateChannelModal key="create-channel-modal" onClose={() => setShowCreateChannel(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showStartDM && <StartDMModal key="start-dm-modal" onClose={() => setShowStartDM(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showChannelSettings && selectedChannelForSettings && (
          <ChannelSettingsModal
            key="channel-settings-modal"
            channel={selectedChannelForSettings}
            onClose={() => {
              setShowChannelSettings(false);
              setSelectedChannelForSettings(null);
            }}
          />
        )}
      </AnimatePresence>
    </aside>
  );
}

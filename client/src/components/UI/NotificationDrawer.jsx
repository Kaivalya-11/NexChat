import React from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { RiNotification3Fill, RiCloseLine } from 'react-icons/ri';

export default function NotificationDrawer({ onClose }) {
  const { notifications, setNotifications, setActiveChannelId } = useChat();

  const handleNotificationClick = (channelId) => {
    setActiveChannelId(channelId);
    onClose();
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <motion.div 
      className="notification-drawer"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 240 }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '320px',
        backgroundColor: 'var(--bg-darker)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}><RiNotification3Fill size={18} style={{ color: 'var(--accent-primary)' }}/> Notifications</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notifications.length > 0 && <button className="btn-icon" onClick={clearNotifications} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Clear</button>}
          <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {notifications.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '64px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RiNotification3Fill size={48} style={{ color: 'var(--border-highlight)', marginBottom: '16px' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>All caught up!</span>
            <span>You have no new notifications.</span>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: -2 }}
              onClick={() => handleNotificationClick(n.channelId)}
              className="hover-item"
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>{n.channelName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontWeight: 500 }}>{n.message.sender.username}:</span> {n.message.content || 'Sent an attachment'}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}


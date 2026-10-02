import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useSocket } from '../../context/SocketContext';
import { 
  RiHashtag, 
  RiMessage3Fill, 
  RiPhoneFill, 
  RiVideoChatFill, 
  RiSearch2Line, 
  RiNotification3Fill, 
  RiGroupFill, 
  RiMenuLine,
  RiDeleteBin6Line
} from 'react-icons/ri';

export default function ChatHeader({ onToggleMembers, onOpenSearch, onToggleSidebar, onToggleNotifications }) {
  const { channels, activeChannelId, notifications, removeChannel } = useChat();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { startCall } = useCall();

  const channel = channels.find(c => c.id === activeChannelId);

  if (!channel) {
    return (
      <div style={{ height: '60px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 20px', backgroundColor: 'var(--bg-card)' }}>
        Loading...
      </div>
    );
  }

  const getDMName = (c) => {
    if (c.name.startsWith('DM: ')) {
      const parts = c.name.replace('DM: ', '').split(' & ');
      return parts.find(p => p !== user.username) || c.name;
    }
    return c.name;
  };

  const getDMOtherUserStatus = (c) => {
    const otherMemberId = c.members.find(m => m !== user.id);
    const presence = onlineUsers.get(otherMemberId);
    return presence ? presence.status : 'offline';
  };

  return (
    <div style={{ 
      height: '60px', 
      borderBottom: '1px solid var(--border-color)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 16px', 
      backgroundColor: 'var(--bg-card)',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, marginRight: '8px' }}>
        <button className="btn-icon mobile-only" onClick={onToggleSidebar} style={{ marginRight: '4px', padding: '6px', flexShrink: 0 }}>
          <RiMenuLine size={20} style={{ color: 'var(--text-main)' }} />
        </button>
        <div style={{ 
          width: '34px', 
          height: '34px', 
          borderRadius: '10px', 
          background: channel.isGroup 
            ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)' 
            : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(16,185,129,0.2) 100%)', 
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: channel.isGroup ? 'var(--accent-primary)' : '#10b981',
          flexShrink: 0
        }}>
          {channel.isGroup ? <RiHashtag size={20} /> : <RiMessage3Fill size={18} />}
        </div>
        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {channel.isGroup ? channel.name : getDMName(channel)}
            </span>
            {!channel.isGroup && (
              <span className={`status-dot ${getDMOtherUserStatus(channel)}`} style={{ flexShrink: 0 }} />
            )}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {channel.isGroup ? `${channel.members.length} members` : (getDMOtherUserStatus(channel) === 'online' ? 'Online' : 'Offline')}
            {channel.description && <span style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>{channel.description}</span>}
          </p>
        </div>
      </div>

      <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          className="btn-icon"
          title="Start Voice Call"
          onClick={() => startCall(activeChannelId, false)}
          style={{
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: 'var(--header-btn-bg)',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--header-btn-bg)'}
        >
          <RiPhoneFill size={18} />
        </button>
        
        <button
          className="btn-icon"
          title="Start Video Call"
          onClick={() => startCall(activeChannelId, true)}
          style={{
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: 'var(--header-btn-bg)',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--header-btn-bg)'}
        >
          <RiVideoChatFill size={18} />
        </button>

        {/* Search Pill Input Bar (Only 1 Search Element) */}
        <div
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--input-pill-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
            width: '160px'
          }}
        >
          <RiSearch2Line size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', userSelect: 'none' }}>Search</span>
        </div>

        <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

        <button
          className="btn-icon"
          title="Notifications"
          onClick={onToggleNotifications}
          style={{
            position: 'relative',
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: 'var(--header-btn-bg)',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--border-color)'
          }}
        >
          <RiNotification3Fill size={18} />
          {notifications && notifications.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              backgroundColor: '#ff4d4f',
              borderRadius: '50%',
              boxShadow: '0 0 8px #ff4d4f'
            }} />
          )}
        </button>

        {channel.isGroup && (
          <button
            className="btn-icon"
            title="Toggle Member List"
            onClick={onToggleMembers}
            style={{
              padding: '8px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--header-btn-bg)',
              color: 'var(--header-btn-text)',
              border: '1px solid var(--border-color)'
            }}
          >
            <RiGroupFill size={18} />
          </button>
        )}

        <button
          className="btn-icon"
          title={channel.isGroup ? "Delete / Leave Channel" : "Delete Chat"}
          onClick={() => {
            const confirmText = channel.isGroup 
              ? `Are you sure you want to delete/leave #${channel.name}?`
              : `Are you sure you want to delete this chat conversation?`;
            if (window.confirm(confirmText)) {
              removeChannel(channel.id);
            }
          }}
          style={{
            padding: '8px 10px',
            borderRadius: '12px',
            color: '#ff4d4f',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease',
            marginLeft: '2px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
        >
          <RiDeleteBin6Line size={18} />
        </button>
      </div>
    </div>
  );
}

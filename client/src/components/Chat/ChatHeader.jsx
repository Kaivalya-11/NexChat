import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Hash, Users, Bell, Phone, Video, Search, MessageSquare, Menu } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function ChatHeader({ onToggleMembers, onOpenSearch, onToggleSidebar }) {
  const { channels, activeChannelId } = useChat();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

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
      padding: '0 20px', 
      backgroundColor: 'var(--bg-card)',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-icon mobile-only" onClick={onToggleSidebar} style={{ marginRight: '4px', padding: '4px' }}>
          <Menu size={20} style={{ color: 'var(--text-main)' }} />
        </button>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: 'var(--radius-md)', 
          backgroundColor: 'var(--bg-hover)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-muted)'
        }}>
          {channel.isGroup ? <Hash size={18} /> : <MessageSquare size={18} />}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {channel.isGroup ? channel.name : getDMName(channel)}
            {!channel.isGroup && (
              <span className={`status-dot ${getDMOtherUserStatus(channel)}`} />
            )}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {channel.isGroup ? `${channel.members.length} members` : (getDMOtherUserStatus(channel) === 'online' ? 'Online' : 'Offline')}
            {channel.description && <span style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>{channel.description}</span>}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn-icon" title="Start Voice Call" style={{ color: 'var(--text-dim)' }}>
          <Phone size={18} />
        </button>
        <button className="btn-icon" title="Start Video Call" style={{ color: 'var(--text-dim)' }}>
          <Video size={18} />
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
        <button className="btn-icon" title="Search Chat (Ctrl+F)" onClick={onOpenSearch}>
          <Search size={18} />
        </button>
        <button className="btn-icon" title="Notifications">
          <Bell size={18} />
        </button>
        {channel.isGroup && (
          <button className="btn-icon" title="Toggle Member List" onClick={onToggleMembers}>
            <Users size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

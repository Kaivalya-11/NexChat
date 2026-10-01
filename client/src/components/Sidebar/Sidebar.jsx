import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Hash, MessageSquare, Plus, Search, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import CreateChannelModal from './CreateChannelModal';
import StartDMModal from './StartDMModal';

export default function Sidebar({ onOpenProfile, onOpenSearch, theme, onToggleTheme }) {
  const { channels, activeChannelId, setActiveChannelId, unreadCounts } = useChat();
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();

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
      backgroundColor: 'var(--bg-darker)', 
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{ 
        height: '60px', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Chat Workspace</h2>
        <button className="btn-icon" onClick={onOpenSearch} title="Search (Ctrl+K)">
          <Search size={18} />
        </button>
      </div>

      {/* Channel List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
        
        {/* Groups */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Channels</span>
            <button className="btn-icon" style={{ padding: '4px' }} onClick={() => setShowCreateChannel(true)}>
              <Plus size={14} />
            </button>
          </div>
          
          {groupChannels.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveChannelId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                backgroundColor: activeChannelId === c.id ? 'var(--bg-active)' : 'transparent',
                color: activeChannelId === c.id ? 'white' : 'var(--text-muted)',
                marginBottom: '2px',
                transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => { if(activeChannelId !== c.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if(activeChannelId !== c.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Hash size={16} style={{ color: activeChannelId === c.id ? 'var(--text-main)' : 'var(--text-dim)' }} />
              <span style={{ fontWeight: activeChannelId === c.id || unreadCounts[c.id] ? 600 : 500, color: unreadCounts[c.id] && activeChannelId !== c.id ? 'white' : 'inherit', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </span>
              {unreadCounts[c.id] && activeChannelId !== c.id && (
                <div style={{ backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                  {unreadCounts[c.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DMs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Direct Messages</span>
            <button className="btn-icon" style={{ padding: '4px' }} onClick={() => setShowStartDM(true)}>
              <Plus size={14} />
            </button>
          </div>

          {dmChannels.map(c => {
            const status = getDMOtherUserStatus(c);
            return (
              <div 
                key={c.id} 
                onClick={() => setActiveChannelId(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: activeChannelId === c.id ? 'var(--bg-active)' : 'transparent',
                  color: activeChannelId === c.id ? 'white' : 'var(--text-muted)',
                  marginBottom: '2px'
                }}
              >
                <div style={{ position: 'relative' }}>
                  {/* Fallback avatar for DM list */}
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={12} />
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '-2px', 
                    right: '-2px', 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor(status),
                    border: '2px solid var(--bg-darker)'
                  }} />
                </div>
                <span style={{ fontWeight: activeChannelId === c.id || unreadCounts[c.id] ? 600 : 500, color: unreadCounts[c.id] && activeChannelId !== c.id ? 'white' : 'inherit', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getDMName(c)}
                </span>
                {unreadCounts[c.id] && activeChannelId !== c.id && (
                  <div style={{ backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                    {unreadCounts[c.id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile Strip */}
      <div style={{ 
        backgroundColor: 'rgba(0,0,0,0.15)', 
        padding: '12px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, overflow: 'hidden' }} onClick={onOpenProfile}>
          <div style={{ position: 'relative' }}>
            <img src={user.avatar} alt="User avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: getStatusColor(user.status || 'online'),
              border: '2px solid var(--bg-darker)'
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.statusText}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-icon" onClick={onOpenProfile} title="Settings">
            <Settings size={18} />
          </button>
          <button className="btn-icon" onClick={logout} title="Logout" style={{ color: 'var(--accent-danger)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {showCreateChannel && <CreateChannelModal onClose={() => setShowCreateChannel(false)} />}
      {showStartDM && <StartDMModal onClose={() => setShowStartDM(false)} />}
    </aside>
  );
}

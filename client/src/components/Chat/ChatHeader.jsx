import React, { useState } from 'react';
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
  RiDeleteBin6Line,
  RiArrowLeftSLine
} from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';

export default function ChatHeader({ onToggleMembers, onOpenSearch, onToggleSidebar, onToggleNotifications }) {
  const { channels, activeChannelId, notifications, removeChannel } = useChat();
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { startCall } = useCall();
  const [confirmConfig, setConfirmConfig] = useState(null);

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
      return parts.find(p => p !== user?.username) || c.name;
    }
    return c.name;
  };

  const getDMOtherUserStatus = (c) => {
    if (!user) return 'offline';
    const otherMemberId = c.members.find(m => m !== user.id);
    const presence = onlineUsers.get(otherMemberId);
    return presence ? presence.status : 'offline';
  };

  const channelName = channel.isGroup ? channel.name : getDMName(channel);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-card)',
      zIndex: 10,
    }}>

      {/* Channel Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon mobile-only" onClick={onToggleSidebar} style={{ padding: '4px', marginRight: '4px' }}>
            <RiMenuLine size={20} color="var(--text-main)" />
          </button>
          <div style={{ color: 'var(--accent-primary)' }}>
            {channel.isGroup ? <RiHashtag size={22} /> : <RiMessage3Fill size={20} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {channelName}
              {!channel.isGroup && (
                <span className={`status-dot ${getDMOtherUserStatus(channel)}`} style={{ borderRadius: '2px', width: '6px', height: '6px' }} />
              )}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>ONLINE USERS: {channel.members.filter(id => onlineUsers.has(id)).length}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon" onClick={onOpenSearch} title="Search" style={{ padding: '6px', color: 'var(--text-muted)' }}>
            <RiSearch2Line size={18} />
          </button>

          {channel.isGroup && (
            <button className="btn-icon" onClick={onToggleMembers} title="Members" style={{ padding: '6px', color: 'var(--text-muted)' }}>
              <RiGroupFill size={18} />
            </button>
          )}

          <button
            className="btn-icon"
            onClick={() => {
              setConfirmConfig({
                title: channel.isGroup ? `Leave Channel` : `Delete Chat`,
                message: channel.isGroup ? `Are you sure you want to leave #${channel.name}?` : `Are you sure you want to delete this chat?`,
                confirmText: channel.isGroup ? 'Leave' : 'Delete',
                isDanger: true,
                onConfirm: () => removeChannel(channel.id)
              });
            }}
            title="Remove/Leave"
            style={{ padding: '6px', color: 'var(--accent-danger)' }}
          >
            <RiDeleteBin6Line size={18} />
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        isDanger={confirmConfig?.isDanger}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}

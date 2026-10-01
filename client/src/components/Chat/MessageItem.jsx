import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Smile, MessageSquareReply, Check, CheckCheck, MoreHorizontal, FileText, Download } from 'lucide-react';

export default function MessageItem({ message, isGrouped, isOwn }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { setActiveThread, activeChannelId, channels } = useChat();
  const [showActions, setShowActions] = useState(false);
  
  const currentChannel = channels.find(c => c.id === activeChannelId);
  const totalChannelMembers = currentChannel?.members?.length || 2; // For group chat delivered/read logic

  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Receipt status logic
  let receiptIcon = null;
  if (isOwn) {
    const isReadByAll = message.readBy?.length >= totalChannelMembers;
    const isReadBySome = message.readBy?.length > 1; // 1 is always sender
    const isDeliveredBySome = message.deliveredTo?.length > 1;

    if (isReadByAll || isReadBySome) {
      receiptIcon = <CheckCheck size={14} style={{ color: '#53bdeb' }} />; // Blue double check
    } else if (isDeliveredBySome) {
      receiptIcon = <CheckCheck size={14} style={{ color: 'var(--text-muted)' }} />; // Gray double check
    } else {
      receiptIcon = <Check size={14} style={{ color: 'var(--text-muted)' }} />; // Gray single check
    }
  }

  const handleReaction = (emoji) => {
    socket.emit('toggle-reaction', { messageId: message.id, emoji, channelId: activeChannelId });
  };

  const renderMedia = (mediaItem) => {
    if (mediaItem.fileType === 'image') {
      return (
        <div key={mediaItem.url} style={{ marginTop: '8px', cursor: 'pointer' }}>
          <img src={mediaItem.url} alt={mediaItem.fileName} style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: 'var(--radius-md)' }} />
        </div>
      );
    } else if (mediaItem.fileType === 'audio') {
      return (
        <div key={mediaItem.url} style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <audio controls src={mediaItem.url} style={{ height: '32px' }} />
        </div>
      );
    } else {
      return (
        <a key={mediaItem.url} href={mediaItem.url} target="_blank" rel="noreferrer" style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
          <div style={{ background: 'var(--bg-hover)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
             <FileText size={24} style={{ color: 'var(--accent-primary)' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{mediaItem.fileName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(mediaItem.fileSize / 1024).toFixed(1)} KB</div>
          </div>
          <Download size={18} style={{ color: 'var(--text-muted)' }}/>
        </a>
      );
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        padding: isGrouped ? '4px 20px 4px 65px' : '16px 20px 4px 65px', 
        position: 'relative',
        backgroundColor: showActions ? 'rgba(255,255,255,0.02)' : 'transparent'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (only if not grouped) */}
      {!isGrouped && (
        <div style={{ width: '40px', flexShrink: 0, position: 'absolute', left: '20px' }}>
          <img src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Message Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        
        {/* Header (only if not grouped) */}
        {!isGrouped && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{message.sender.username}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeString}</span>
          </div>
        )}

        {/* Hover timestamp for grouped messages */}
        {isGrouped && showActions && (
          <div style={{ position: 'absolute', left: '-45px', top: '2px', fontSize: '0.65rem', color: 'var(--text-dim)', width: '35px', textAlign: 'right' }}>
            {timeString}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div style={{ 
            color: 'var(--text-main)', 
            fontSize: '0.95rem', 
            lineHeight: '1.4', 
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {message.content}
          </div>
        )}

        {/* Media Content */}
        {message.media && message.media.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {message.media.map(renderMedia)}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              const hasReacted = users.includes(user.id);
              return (
                <div 
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    backgroundColor: hasReacted ? 'var(--accent-bg)' : 'var(--bg-card)',
                    border: `1px solid ${hasReacted ? 'var(--accent-border)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ color: hasReacted ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>{users.length}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Thread Info */}
        {message.replyCount > 0 && (
          <div 
            onClick={() => setActiveThread(message)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginTop: '8px', 
              color: 'var(--accent-primary)', 
              fontSize: '0.85rem', 
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <MessageSquareReply size={14} />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}
      </div>

      {/* Receipts */}
      {isOwn && (
        <div style={{ marginLeft: '8px', marginTop: isGrouped ? '2px' : '0', display: 'flex', alignItems: 'flex-start' }}>
          {receiptIcon}
        </div>
      )}

      {/* Actions Menu (Always visible but faded when not hovering) */}
      <div className="glass-panel" style={{
          position: 'absolute',
          top: '-16px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-sm)',
          opacity: showActions ? 1 : 0.3,
          transition: 'opacity 0.2s ease',
          pointerEvents: showActions ? 'auto' : 'none'
        }}>
          <button className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('👍')}>
             <span>👍</span>
          </button>
          <button className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('❤️')}>
             <span>❤️</span>
          </button>
          <button className="btn-icon" style={{ padding: '6px' }} onClick={() => setActiveThread(message)} title="Reply in Thread">
             <MessageSquareReply size={16} />
          </button>
          <button className="btn-icon" style={{ padding: '6px' }} title="More actions">
             <MoreHorizontal size={16} />
          </button>
        </div>
    </div>
  );
}

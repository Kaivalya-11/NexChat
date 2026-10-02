import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { 
  RiCheckDoubleLine, 
  RiCheckLine, 
  RiFileTextFill, 
  RiDownload2Line, 
  RiPhoneFill, 
  RiMessage3Fill, 
  RiBarChart2Fill, 
  RiCheckboxCircleFill, 
  RiCheckboxBlankCircleLine, 
  RiCheckboxFill, 
  RiCheckboxBlankLine, 
  RiReplyFill, 
  RiChat1Fill, 
  RiChatQuoteFill, 
  RiMoreFill,
  RiDeleteBin6Line
} from 'react-icons/ri';

export default function MessageItem({ message, isGrouped, isOwn }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const { setActiveThread, activeChannelId, channels, setReplyingTo, refreshChannels, setActiveChannelId: setChannelId, setPreviewMedia, removeMessage } = useChat();
  const [showActions, setShowActions] = useState(false);
  
  const currentChannel = channels.find(c => c.id === activeChannelId);
  const totalChannelMembers = currentChannel?.members?.length || 2;

  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Receipt status logic
  let receiptIcon = null;
  if (isOwn) {
    const isReadByAll = message.readBy?.length >= totalChannelMembers;
    const isReadBySome = message.readBy?.length > 1;
    const isDeliveredBySome = message.deliveredTo?.length > 1;

    if (isReadByAll || isReadBySome) {
      receiptIcon = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><RiCheckDoubleLine size={16} style={{ color: '#53bdeb' }} /></motion.span>;
    } else if (isDeliveredBySome) {
      receiptIcon = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><RiCheckDoubleLine size={16} style={{ color: 'var(--text-muted)' }} /></motion.span>;
    } else {
      receiptIcon = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><RiCheckLine size={16} style={{ color: 'var(--text-muted)' }} /></motion.span>;
    }
  }

  const handleReaction = (emoji) => {
    socket.emit('toggle-reaction', { messageId: message.id, emoji, channelId: activeChannelId });
  };

  const handlePollVote = (optionIndex) => {
    if (socket) {
      socket.emit('vote-poll', { messageId: message.id, optionIndex, channelId: activeChannelId });
    }
  };

  const renderMedia = (mediaItem) => {
    const isVideo = mediaItem.fileType === 'video' || (mediaItem.fileName && /\.(mp4|webm|mov|mkv)$/i.test(mediaItem.fileName));
    
    if (mediaItem.fileType === 'image') {
      return (
        <motion.div 
          key={mediaItem.url} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          whileHover={{ scale: 1.02 }}
          onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Photo', fileType: 'image', fileSize: mediaItem.fileSize })}
          style={{ marginTop: '8px', cursor: 'pointer', display: 'inline-block' }}
        >
          <img src={mediaItem.url} alt={mediaItem.fileName} style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
        </motion.div>
      );
    } else if (isVideo) {
      return (
        <motion.div key={mediaItem.url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Video', fileType: 'video', fileSize: mediaItem.fileSize })}>
          <video src={mediaItem.url} style={{ maxWidth: '320px', maxHeight: '300px', borderRadius: 'var(--radius-md)', backgroundColor: '#000' }} />
        </motion.div>
      );
    } else if (mediaItem.fileType === 'audio') {
      return (
        <div key={mediaItem.url} style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}>
          <audio controls src={mediaItem.url} style={{ height: '32px', width: '240px' }} />
        </div>
      );
    } else {
      return (
        <div 
          key={mediaItem.url} 
          onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Document', fileType: 'document', fileSize: mediaItem.fileSize })}
          style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border-color)', maxWidth: '320px' }}
        >
          <div style={{ background: 'var(--bg-hover)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
             <RiFileTextFill size={24} style={{ color: 'var(--accent-primary)' }}/>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mediaItem.fileName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(mediaItem.fileSize / 1024).toFixed(1)} KB</div>
          </div>
          <RiDownload2Line size={20} style={{ color: 'var(--text-muted)' }}/>
        </div>
      );
    }
  };

  // Helper to render special message types (poll, contact, sticker)
  const renderSpecialMessage = () => {
    if (message.type === 'sticker') {
      return (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          whileHover={{ scale: 1.08 }}
          onClick={() => setPreviewMedia({ url: message.content, fileName: 'Sticker / GIF', fileType: 'image', contentType: 'sticker' })}
          style={{ marginTop: '4px', display: 'inline-block', cursor: 'pointer' }}
        >
          <img src={message.content} alt="Sticker" style={{ width: '130px', height: '130px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
        </motion.div>
      );
    }

    if (message.type === 'contact') {
      let contactData = {};
      try {
        contactData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
      } catch (e) {
        contactData = { name: message.content };
      }

      return (
        <div style={{
          marginTop: '6px',
          width: '280px',
          backgroundColor: 'var(--bg-darker)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <img 
              src={contactData.avatar || `https://ui-avatars.com/api/?name=${contactData.name || 'Contact'}`} 
              alt={contactData.name} 
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contactData.name || 'Shared Contact'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <RiPhoneFill size={14} /> {contactData.phone || contactData.email || 'Contact Info'}
              </div>
            </div>
          </div>
          {contactData.userId && contactData.userId !== user.id && (
            <button
              onClick={async () => {
                try {
                  const dm = await api.getOrCreateDM(token, contactData.userId);
                  refreshChannels();
                  setChannelId(dm.id);
                } catch(err) {
                  alert('Failed to start DM with contact');
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RiMessage3Fill size={16} /> Message Contact
            </button>
          )}
        </div>
      );
    }

    if (message.type === 'poll') {
      let poll = { question: 'Poll', options: [], allowMultiple: false };
      try {
        poll = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
      } catch (e) {
        return <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>[Poll content unavailable]</div>;
      }

      // Calculate total unique voters
      const allVoters = new Set();
      poll.options.forEach(opt => (opt.votes || []).forEach(v => allVoters.add(v)));
      const totalVoters = allVoters.size;

      return (
        <div style={{
          marginTop: '6px',
          width: '100%',
          maxWidth: '340px',
          backgroundColor: 'var(--bg-dark)',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ padding: '6px', backgroundColor: 'rgba(255, 204, 0, 0.15)', borderRadius: '8px', color: '#ffcc00' }}>
              <RiBarChart2Fill size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                {poll.question}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {poll.allowMultiple ? 'Select one or more' : 'Select one option'}
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {poll.options.map((option, idx) => {
              const votes = option.votes || [];
              const userVoted = votes.includes(user.id);
              const percentage = totalVoters > 0 ? Math.round((votes.length / totalVoters) * 100) : 0;

              return (
                <div
                  key={idx}
                  onClick={() => handlePollVote(idx)}
                  style={{
                    position: 'relative',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-hover)',
                    border: `1px solid ${userVoted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* Progress fill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: userVoted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.06)',
                      transition: 'width 0.3s ease',
                      zIndex: 0
                    }}
                  />

                  {/* Content */}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingRight: '8px' }}>
                    <div style={{ color: userVoted ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {poll.allowMultiple ? (
                        userVoted ? <RiCheckboxFill size={18} /> : <RiCheckboxBlankLine size={18} />
                      ) : (
                        userVoted ? <RiCheckboxCircleFill size={18} /> : <RiCheckboxBlankCircleLine size={18} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.88rem', color: userVoted ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: userVoted ? 600 : 400 }}>
                      {option.text}
                    </span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{votes.length}</span>
                    <span>({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>{totalVoters} {totalVoters === 1 ? 'vote' : 'votes'} total</span>
            <span>Click an option to vote</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div 
      className={`message-item ${isGrouped ? 'grouped' : ''}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ 
        display: 'flex', 
        gap: '12px',
        padding: '12px 16px', 
        position: 'relative',
        backgroundColor: 'var(--msg-card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        marginBottom: '8px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <motion.div 
        whileHover={{ scale: 1.08 }}
        className="message-avatar" 
        style={{ width: '36px', height: '36px', flexShrink: 0 }}
      >
        <img src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
      </motion.div>

      {/* Message Content Area */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        
        {/* Top Header: Username, Time, and Receipts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{message.sender.username}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeString}</span>
          </div>
          {isOwn && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {receiptIcon}
            </div>
          )}
        </div>

        {/* Quoted Message Block */}
        {message.quote && (
          <motion.div 
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              backgroundColor: 'var(--bg-darkest)',
              borderLeft: '4px solid var(--accent-primary)',
              padding: '6px 12px',
              marginBottom: '8px',
              borderRadius: 'var(--radius-sm)',
              opacity: 0.85,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>{message.quote.senderName}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message.quote.content}</div>
          </motion.div>
        )}

        {/* Special Render (Sticker, Contact, Poll) */}
        {renderSpecialMessage()}

        {/* Text Content (if not special message or if text exists) */}
        {message.content && !['poll', 'contact', 'sticker'].includes(message.type) && (
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
                <motion.div 
                  key={emoji}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: hasReacted ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                    border: `1px solid ${hasReacted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ color: hasReacted ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>{users.length}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Thread Info */}
        {message.replyCount > 0 && (
          <motion.div 
            whileHover={{ x: 3 }}
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
            <RiChat1Fill size={16} />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </motion.div>
        )}
      </div>

      {/* Receipts */}
      {isOwn && (
        <div style={{ marginLeft: '8px', marginTop: isGrouped ? '2px' : '0', display: 'flex', alignItems: 'flex-start' }}>
          {receiptIcon}
        </div>
      )}

      {/* Actions Menu */}
      <motion.div 
        className="glass-panel message-actions-menu" 
        initial={{ opacity: 0, y: -4, scale: 0.95 }}
        animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : -4, scale: showActions ? 1 : 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          top: '-16px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: showActions ? 'auto' : 'none'
        }}
      >
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('👍')}>
             <span>👍</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('❤️')}>
             <span>❤️</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => setReplyingTo(message)} title="Reply">
             <RiReplyFill size={18} />
          </motion.button>
          {!isOwn && currentChannel?.isGroup && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={async () => {
              try {
                const dm = await api.getOrCreateDM(token, message.sender.id);
                refreshChannels();
                setChannelId(dm.id);
                setTimeout(() => setReplyingTo(message), 0);
              } catch(err) {
                alert('Failed to start DM');
              }
            }} title="Reply Privately">
               <RiChatQuoteFill size={18} />
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => setActiveThread(message)} title="Reply in Thread">
             <RiChat1Fill size={18} />
          </motion.button>
          {(isOwn || currentChannel?.admins?.includes(user?.id) || currentChannel?.owner === user?.id) && (
            <motion.button 
              whileHover={{ scale: 1.1, color: '#ff4d4f' }} 
              whileTap={{ scale: 0.9 }} 
              className="btn-icon" 
              style={{ padding: '6px', color: 'rgba(239,68,68,0.85)' }} 
              onClick={() => {
                if (window.confirm('Delete this message?')) {
                  removeMessage(message.id);
                }
              }} 
              title="Delete Message"
            >
               <RiDeleteBin6Line size={18} />
            </motion.button>
          )}
        </motion.div>
    </motion.div>
  );
}


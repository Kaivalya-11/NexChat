import React, { useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
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
  RiReplyFill,
  RiChat1Fill,
  RiChatQuoteFill,
  RiMoreFill,
  RiDeleteBin6Line,
  RiAddLine,
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
  RiPushpinLine
} from 'react-icons/ri';
import PollMessage from './PollMessage';
import { RiPhoneFill, RiMessage3Fill } from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';

const formatMessageText = (text) => {
  if (typeof text !== 'string') return text;
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;" onClick="event.stopPropagation()">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(127,127,127,0.2); padding: 2px 4px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9em; color: var(--accent-primary);">$1</code>');
  
  return html;
};

export default function MessageItem({ message, isGrouped, isOwn, isSelected, onToggleSelect, selectionMode }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const { setActiveThread, activeChannelId, channels, setReplyingTo, refreshChannels, setActiveChannelId: setChannelId, setPreviewMedia, removeMessage, toggleReaction, votePoll, pinMessage } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  const touchTimerRef = useRef(null);
  const touchPosRef = useRef(null);

  const currentChannel = channels.find(c => c.id === activeChannelId);
  const totalChannelMembers = currentChannel?.members?.length || 2;

  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasText = !!message.content && !['poll', 'contact', 'sticker'].includes(message.type);
  const isMediaOnly = !hasText && message.media?.length > 0 && !message.quote;

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
    toggleReaction(message.id, emoji, activeChannelId);
    setShowActions(false);
  };

  const handlePollVote = (optionIndex) => {
    votePoll(message.id, optionIndex, activeChannelId);
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
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', backgroundColor: '#000', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
        >
          <img src={mediaItem.url} alt={mediaItem.fileName} style={{ maxWidth: '320px', maxHeight: '400px', width: 'auto', height: 'auto', borderRadius: '2px', display: 'block', objectFit: 'contain' }} />
        </motion.div>
      );
    } else if (mediaItem.fileType === 'audio') {
      return (
        <div key={mediaItem.url} style={{ marginTop: isMediaOnly ? '2px' : '8px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}>
          <audio controls src={mediaItem.url} style={{ height: '32px', width: '240px' }} />
        </div>
      );
    } else if (isVideo) {
      return (
        <motion.div key={mediaItem.url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: isMediaOnly ? '2px' : '8px', cursor: 'pointer', backgroundColor: '#000', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }} onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Video', fileType: 'video', fileSize: mediaItem.fileSize })}>
          <video src={mediaItem.url} style={{ maxWidth: '320px', maxHeight: '300px', borderRadius: '2px', backgroundColor: '#000', display: 'block' }} />
        </motion.div>
      );
    } else {
      return (
        <div
          key={mediaItem.url}
          onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Document', fileType: 'document', fileSize: mediaItem.fileSize })}
          style={{ marginTop: isMediaOnly ? '2px' : '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border-color)', maxWidth: '320px' }}
        >
          <div style={{ background: 'var(--bg-darkest)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
            <RiFileTextFill size={24} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{mediaItem.fileName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(mediaItem.fileSize / 1024).toFixed(1)} KB</div>
          </div>
          <RiDownload2Line size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
      );
    }
  };

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
      try { contactData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content; }
      catch (e) { contactData = { name: message.content }; }

      return (
        <div style={{ marginTop: '6px', width: '280px', backgroundColor: 'var(--bg-darker)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <img src={contactData.avatar || `https://ui-avatars.com/api/?name=${contactData.name || 'Contact'}`} alt={contactData.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contactData.name || 'Shared Contact'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><RiPhoneFill size={14} /> {contactData.phone || contactData.email || 'Contact Info'}</div>
            </div>
          </div>
          {contactData.userId && contactData.userId !== user.id && (
            <button
              onClick={async () => {
                try {
                  const dm = await api.getOrCreateDM(token, contactData.userId);
                  refreshChannels();
                  setChannelId(dm.id);
                } catch (err) { alert('Failed to start DM with contact'); }
              }}
              style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RiMessage3Fill size={16} /> Message Contact
            </button>
          )}
        </div>
      );
    }

    if (message.type === 'poll') return <PollMessage message={message} />;
    return null;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: isOwn ? 'flex-end' : 'flex-start', width: '100%', marginBottom: '8px', padding: isSelected ? '4px 0' : '0', backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderRadius: '8px', transition: 'background-color 0.2s ease' }}>
      {selectionMode && (
        <div 
          onClick={() => onToggleSelect && onToggleSelect(message.id)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', flexShrink: 0, cursor: 'pointer', color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          {isSelected ? <RiCheckboxCircleLine size={24} /> : <RiCheckboxBlankCircleLine size={24} />}
        </div>
      )}
    <motion.div
      className={`message-item-container ${isGrouped ? 'grouped' : ''}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        gap: '8px',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        maxWidth: selectionMode ? 'calc(75% - 40px)' : '75%',
        position: 'relative'
      }}
      onClick={(e) => {
        if (selectionMode && onToggleSelect) {
          onToggleSelect(message.id);
        }
      }}
      onMouseEnter={() => {
        if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
          setShowActions(true);
        }
      }}
      onMouseLeave={() => {
        if (!showEmojiPicker) setShowActions(false);
      }}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          touchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          touchTimerRef.current = setTimeout(() => {
            setShowActions(true);
            try { navigator.vibrate && navigator.vibrate(50); } catch (e) {}
          }, 450);
        }
      }}
      onTouchMove={(e) => {
        if (touchTimerRef.current && touchPosRef.current) {
          const dx = Math.abs(e.touches[0].clientX - touchPosRef.current.x);
          const dy = Math.abs(e.touches[0].clientY - touchPosRef.current.y);
          if (dx > 15 || dy > 15) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
          }
        }
      }}
      onTouchEnd={() => {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
      }}
      onTouchCancel={() => {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
      }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="message-avatar"
        style={{ width: '32px', height: '32px', flexShrink: 0, position: 'relative' }}
      >
        <img src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`} alt="avatar" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }} />
      </motion.div>

      <div className="message-bubble" style={{ 
        flex: '0 1 auto', 
        minWidth: 0, 
        position: 'relative',
        padding: isMediaOnly ? '4px' : '8px 12px',
        backgroundColor: isMediaOnly ? 'transparent' : (isOwn ? 'var(--msg-card-bg)' : 'var(--bg-card)'),
        border: isMediaOnly ? 'none' : '1px solid var(--border-color)',
        borderRadius: isOwn ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: isMediaOnly ? '0' : '4px', padding: isMediaOnly ? '4px 4px 0 4px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
            {!isMediaOnly && (
              <>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {message.sender.username}
                </span>
                {message.sender.role === 'admin' && (
                  <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 600 }}>ADMIN</span>
                )}
              </>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeString}</span>
          </div>
          {isOwn && (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '6px' }}>
              {receiptIcon}
            </div>
          )}
        </div>

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

        {renderSpecialMessage()}

        {message.content && !['poll', 'contact', 'sticker'].includes(message.type) && (
          <div 
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{ __html: formatMessageText(message.content) }}
          />
        )}

        {message.media && message.media.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {message.media.map(renderMedia)}
          </div>
        )}

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
      {showActions && !showEmojiPicker && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
          onTouchStart={(e) => { setShowActions(false); }} 
          onMouseDown={(e) => { setShowActions(false); }} 
        />
      )}
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
          pointerEvents: showActions ? 'auto' : 'none',
          zIndex: 50
        }}
      >
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('👍')}>
          <span>👍</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={() => handleReaction('❤️')}>
          <span>❤️</span>
        </motion.button>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(true); }} title="Add Reaction">
            <RiAddLine size={18} />
          </motion.button>
          {showEmojiPicker && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(false); setShowActions(false); }} 
              />
              <div style={{ position: 'absolute', bottom: '100%', right: '-50px', zIndex: 100, marginBottom: '8px' }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <EmojiPicker 
                  onEmojiClick={(emojiObj) => {
                    handleReaction(emojiObj.emoji);
                    setTimeout(() => {
                      setShowEmojiPicker(false);
                      setShowActions(false);
                    }, 10);
                  }} 
                  theme="dark" 
                  lazyLoadEmojis={true}
                />
              </div>
            </>
          )}
        </div>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); setReplyingTo(message); setShowActions(false); }} title="Reply">
          <RiReplyFill size={18} />
        </motion.button>
        {!isOwn && currentChannel?.isGroup && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={async () => {
            try {
              setShowActions(false);
              const dm = await api.getOrCreateDM(token, message.sender.id);
              refreshChannels();
              setChannelId(dm.id);
              setTimeout(() => setReplyingTo(message), 0);
            } catch (err) {
              alert('Failed to start DM');
            }
          }} title="Reply Privately">
            <RiChatQuoteFill size={18} />
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); setActiveThread(message); setShowActions(false); }} title="Reply in Thread">
          <RiChat1Fill size={18} />
        </motion.button>
        
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(message.id); setShowActions(false); }} title="Select Message">
          <RiCheckboxCircleLine size={18} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); pinMessage(activeChannelId, message); setShowActions(false); }} title="Pin Message">
          <RiPushpinLine size={18} />
        </motion.button>

        {(isOwn || currentChannel?.admins?.includes(user?.id) || currentChannel?.owner === user?.id) && (
          <motion.button
            whileHover={{ scale: 1.1, color: '#ff4d4f' }}
            whileTap={{ scale: 0.9 }}
            className="btn-icon"
            style={{ padding: '6px', color: 'rgba(239,68,68,0.85)' }}
            onClick={() => {
              setShowActions(false);
              setConfirmConfig({
                title: 'Delete Message',
                message: 'Are you sure you want to delete this message? This action cannot be undone.',
                confirmText: 'Delete',
                isDanger: true,
                onConfirm: () => removeMessage(message.id)
              });
            }}
            title="Delete Message"
          >
            <RiDeleteBin6Line size={18} />
          </motion.button>
        )}
      </motion.div>
      <ConfirmModal 
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        isDanger={confirmConfig?.isDanger}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => setConfirmConfig(null)}
      />
    </motion.div>
    </div>
  );
}


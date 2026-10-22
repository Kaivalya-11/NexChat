import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  RiPushpinLine,
  RiThumbUpLine,
  RiHeartLine,
  RiBarChart2Fill,
  RiUser3Fill,
  RiStickyNoteFill,
  RiImage2Fill
} from 'react-icons/ri';
import PollMessage from './PollMessage';
import { RiPhoneFill, RiMessage3Fill } from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';
import { getOptimizedImageUrl, getOptimizedAttachmentUrl } from '../../utils/imageOptimizer';
import { parseQuotedContent } from '../../utils/quoteHelper';

const formatMessageText = (text, markdownEnabled = true) => {
  if (typeof text !== 'string') return text;
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  if (!markdownEnabled) return html;

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
  const [showMediaCollapsed, setShowMediaCollapsed] = useState(false);
  
  const touchTimerRef = useRef(null);
  const touchPosRef = useRef(null);

  const currentChannel = channels.find(c => c.id === activeChannelId);
  const totalChannelMembers = currentChannel?.members?.length || 2;

  const [clockFormat, setClockFormat] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('nexchat_clock_format') || '12h') : '12h';
  });
  const [markdownEnabled, setMarkdownEnabled] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('nexchat_markdown_enabled') !== 'false' : true;
  });
  const [autoPreview, setAutoPreview] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('nexchat_auto_preview') !== 'false' : true;
  });

  useEffect(() => {
    const handleSettingsChanged = (e) => {
      const { key } = e.detail || {};
      if (!key || key === 'nexchat_clock_format') {
        setClockFormat(typeof window !== 'undefined' ? (localStorage.getItem('nexchat_clock_format') || '12h') : '12h');
      }
      if (!key || key === 'nexchat_markdown_enabled') {
        setMarkdownEnabled(typeof window !== 'undefined' ? localStorage.getItem('nexchat_markdown_enabled') !== 'false' : true);
      }
      if (!key || key === 'nexchat_auto_preview') {
        setAutoPreview(typeof window !== 'undefined' ? localStorage.getItem('nexchat_auto_preview') !== 'false' : true);
      }
    };
    window.addEventListener('nexchat_settings_changed', handleSettingsChanged);
    return () => window.removeEventListener('nexchat_settings_changed', handleSettingsChanged);
  }, []);

  const timeString = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: clockFormat === '12h'
  });

  const hasText = !!message.content && !['poll', 'contact', 'sticker'].includes(message.type);
  const isMediaOnly = !hasText && message.media?.length > 0 && !message.quote;

  let receiptIcon = null;
  if (isOwn) {
    const isReadByAll = message.readBy?.length >= totalChannelMembers;
    const isReadBySome = message.readBy?.length > 1;
    const isDeliveredBySome = message.deliveredTo?.length > 1;

    if (isReadByAll || isReadBySome) {
      receiptIcon = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><RiCheckDoubleLine size={16} style={{ color: '#06B6D4' }} /></motion.span>;
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
          <img
            src={getOptimizedAttachmentUrl(mediaItem.url, { maxWidth: 800 })}
            alt={mediaItem.fileName || 'Image attachment'}
            width="400"
            height="300"
            loading="lazy"
            decoding="async"
            style={{ maxWidth: '100%', maxHeight: '400px', width: 'auto', height: 'auto', borderRadius: '2px', display: 'block', objectFit: 'contain' }}
          />
        </motion.div>
      );
    } else if (mediaItem.fileType === 'audio') {
      return (
        <div key={mediaItem.url} style={{ marginTop: isMediaOnly ? '2px' : '8px', padding: '4px', background: 'var(--bg-card)', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}>
          <audio controls src={mediaItem.url} style={{ height: '54px', width: '100%', minWidth: '200px', maxWidth: '100%', borderRadius: '24px' }} />
        </div>
      );
    } else if (isVideo) {
      return (
        <motion.div key={mediaItem.url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: isMediaOnly ? '2px' : '8px', cursor: 'pointer', backgroundColor: '#000', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }} onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Video', fileType: 'video', fileSize: mediaItem.fileSize })}>
          <video
            src={mediaItem.url}
            playsInline
            controls
            preload="metadata"
            aria-label={mediaItem.fileName || 'Chat video attachment'}
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '2px', backgroundColor: '#000', display: 'block' }}
          >
            <track kind="captions" srcLang="en" label="English captions" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      );
    } else {
      return (
        <div
          key={mediaItem.url}
          onClick={() => setPreviewMedia({ url: mediaItem.url, fileName: mediaItem.fileName || 'Document', fileType: 'document', fileSize: mediaItem.fileSize })}
          style={{ marginTop: isMediaOnly ? '2px' : '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border-color)', maxWidth: '100%' }}
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
          <img
            src={message.content}
            alt="Sticker"
            width="130"
            height="130"
            loading="lazy"
            decoding="async"
            style={{ width: '130px', height: '130px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          />
        </motion.div>
      );
    }

    if (message.type === 'contact') {
      let contactData = {};
      try { contactData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content; }
      catch (e) { contactData = { name: message.content }; }

      return (
        <div style={{ marginTop: '6px', maxWidth: '280px', width: '100%', backgroundColor: 'var(--bg-darker)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <img
              src={getOptimizedImageUrl(contactData.avatar || `https://ui-avatars.com/api/?name=${contactData.name || 'Contact'}`, { width: 88, height: 88 })}
              alt={contactData.name || 'Contact avatar'}
              width="44"
              height="44"
              loading="lazy"
              decoding="async"
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
            />
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
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
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
    <div id={`message-${message.id}`} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: isOwn ? 'flex-end' : 'flex-start', width: '100%', marginBottom: '8px', padding: isSelected ? '4px 0' : '0', backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderRadius: '8px', transition: 'background-color 0.2s ease' }}>
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
        maxWidth: selectionMode ? 'calc(85% - 40px)' : '85%',
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
        <img
          src={getOptimizedImageUrl(message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}`, { width: 64, height: 64 })}
          alt={`${message.sender.username}'s avatar`}
          width="32"
          height="32"
          loading="lazy"
          decoding="async"
          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%', backgroundColor: 'var(--bg-card)' }}
        />
      </motion.div>

      <div className="message-bubble" style={{ 
        flex: '0 1 auto', 
        minWidth: 0, 
        position: 'relative',
        padding: isMediaOnly ? '4px' : 'var(--msg-bubble-padding, 8px 12px)',
        backgroundColor: isMediaOnly ? 'transparent' : (isOwn ? 'var(--msg-own-bg)' : 'var(--msg-peer-bg)'),
        border: isMediaOnly ? 'none' : (isOwn ? '1px solid var(--msg-own-border)' : '1px solid var(--msg-peer-border)'),
        borderRight: isOwn && !isMediaOnly ? '2px solid var(--msg-own-accent)' : undefined,
        borderRadius: isOwn ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.15s ease, opacity 0.15s ease'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: isMediaOnly ? '0' : '4px', padding: isMediaOnly ? '4px 4px 0 4px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
            {!isMediaOnly && (
              <>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {message.sender.username}
                </span>
                {message.sender.role === 'admin' && (
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ADMIN</span>
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

        {message.quote && (() => {
          const parsed = parseQuotedContent(message.quote.content);
          return (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                if (message.quote.messageId) {
                  const target = document.getElementById(`message-${message.quote.messageId}`);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.transition = 'background-color 0.3s ease';
                    target.style.backgroundColor = 'var(--bg-active)';
                    setTimeout(() => {
                      target.style.backgroundColor = 'transparent';
                    }, 1200);
                  }
                }
              }}
              style={{
                backgroundColor: 'var(--msg-quote-bg)',
                borderLeft: '3px solid var(--accent-primary)',
                padding: '6px 10px',
                marginBottom: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
              title="Click to jump to quoted message"
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RiReplyFill size={12} />
                <span>{message.quote.senderName}</span>
              </div>
              <div style={{ 
                fontSize: '0.82rem', 
                color: 'var(--text-secondary, var(--text-main))', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {parsed.type === 'poll' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)', fontWeight: 600 }}>
                    <RiBarChart2Fill size={14} /> Poll:
                  </span>
                )}
                {parsed.type === 'contact' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    <RiUser3Fill size={14} /> Contact:
                  </span>
                )}
                {parsed.type === 'sticker' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                    <RiStickyNoteFill size={14} /> Sticker
                  </span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{parsed.text}</span>
              </div>
            </motion.div>
          );
        })()}

        {renderSpecialMessage()}

        {message.content && !['poll', 'contact', 'sticker'].includes(message.type) && (
          <div 
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--chat-font-size, 14px)',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: formatMessageText(message.content, markdownEnabled) }}
          />
        )}

        {message.media && message.media.length > 0 && (
          autoPreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {message.media.map(renderMedia)}
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowMediaCollapsed(prev => !prev)}
                style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RiImage2Fill size={14} />
                <span>{showMediaCollapsed ? 'Hide Media' : `Show ${message.media.length} Media Attachment(s)`}</span>
              </button>
              {showMediaCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {message.media.map(renderMedia)}
                </div>
              )}
            </div>
          )
        )}

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="message-reactions-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', minHeight: '26px' }}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              const hasReacted = users.includes(user.id);
              return (
                <motion.button
                  type="button"
                  key={emoji}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleReaction(emoji)}
                  aria-label={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction (${users.length})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: hasReacted ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                    border: `1px solid ${hasReacted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'inherit'
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ color: hasReacted ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>{users.length}</span>
                </motion.button>
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
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); handleReaction('👍'); setShowActions(false); }} aria-label="React with thumbs up">
          <RiThumbUpLine size={16} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); handleReaction('❤️'); setShowActions(false); }} aria-label="React with heart">
          <RiHeartLine size={16} style={{ color: '#F43F5E' }} />
        </motion.button>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(true); }} title="Add Reaction" aria-label="Add reaction">
            <RiAddLine size={18} />
          </motion.button>
          {showEmojiPicker && typeof document !== 'undefined' && createPortal(
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowEmojiPicker(false);
                  setShowActions(false);
                }
              }}
            >
              <div 
                style={{
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <EmojiPicker 
                  onEmojiClick={(emojiObj) => {
                    const emojiChar = emojiObj?.emoji || emojiObj;
                    if (emojiChar) {
                      handleReaction(emojiChar);
                    }
                    setShowEmojiPicker(false);
                    setShowActions(false);
                  }} 
                  theme={typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'} 
                  lazyLoadEmojis={false}
                  previewConfig={{ showPreview: false }}
                  width={320}
                  height={400}
                />
              </div>
            </div>,
            document.body
          )}
        </div>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); setReplyingTo(message); setShowActions(false); }} title="Reply" aria-label="Reply to message">
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
          }} title="Reply Privately" aria-label="Reply privately">
            <RiChatQuoteFill size={18} />
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); setActiveThread(message); setShowActions(false); }} title="Reply in Thread" aria-label="Reply in thread">
          <RiChat1Fill size={18} />
        </motion.button>
        
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(message.id); setShowActions(false); }} title="Select Message" aria-label="Select message">
          <RiCheckboxCircleLine size={18} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); pinMessage(activeChannelId, message); setShowActions(false); }} title="Pin Message" aria-label="Pin message">
          <RiPushpinLine size={18} />
        </motion.button>

        {(isOwn || currentChannel?.admins?.includes(user?.id) || currentChannel?.owner === user?.id) && (
          <motion.button
            whileHover={{ scale: 1.1, color: '#ff4d4f' }}
            whileTap={{ scale: 0.9 }}
            className="btn-icon"
            style={{ padding: '6px', color: 'rgba(239,68,68,0.85)' }}
            onClick={(e) => {
              e.stopPropagation();
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
            aria-label="Delete message"
          >
            <RiDeleteBin6Line size={16} />
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


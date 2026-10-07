import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageItem from './MessageItem';
import { 
  RiMessage3Fill,
  RiDeleteBin6Line,
  RiFileCopyLine,
  RiShareForwardLine,
  RiCloseLine,
  RiPushpinFill
} from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';
import ForwardModal from '../UI/ForwardModal';

export default function MessageList() {
  const { messages, loadingMessages, loadMessages, activeChannelId, removeMessage, channels, sendMessage, pinnedMessages, unpinMessage } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const containerRef = useRef(null);
  
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const prevScrollHeightRef = useRef(0);
  
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const selectionMode = selectedMessages.size > 0;

  const toggleSelect = (id) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedMessages(new Set());

  const handleCopy = () => {
    const textsToCopy = messages
      .filter(m => selectedMessages.has(m.id))
      .map(m => `[${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${m.sender.username}: ${m.content || '(Media)'}`)
      .join('\n');
    
    navigator.clipboard.writeText(textsToCopy).then(() => {
      alert('Messages copied to clipboard');
      clearSelection();
    });
  };

  const handleForward = () => {
    setShowForwardModal(true);
  };

  const confirmForward = (targetChannelId) => {
    const msgsToForward = messages.filter(m => selectedMessages.has(m.id));
    
    msgsToForward.forEach(m => {
      let forwardedContent = m.content || '';
      
      // If it's a text message or has text, we can append a Forwarded prefix.
      if (m.type !== 'poll' && m.type !== 'contact' && m.type !== 'sticker') {
         forwardedContent = `> **Forwarded from ${m.sender.username}**\n${m.content || ''}`;
      }
      
      const messageData = {
        channelId: targetChannelId,
        content: forwardedContent,
        media: m.media || [],
        type: m.type || 'text',
      };
      
      // Only copy quote if it exists, though usually forwards don't keep quotes.
      // We'll omit it to avoid clutter.
      
      sendMessage(messageData);
    });
    
    setShowForwardModal(false);
    clearSelection();
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    // Note: If deleting many messages, we might want to do it in batches or parallel
    for (const id of selectedMessages) {
      await removeMessage(id);
    }
    setShowConfirmDelete(false);
    clearSelection();
  };

  // Reset hasMore when changing channels
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMore(true);
    setSelectedMessages(new Set());
  }, [activeChannelId]);

  useEffect(() => {
    if (!isFetchingOlder) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isFetchingOlder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMessages && hasMore && messages.length > 0) {
          setIsFetchingOlder(true);
          prevScrollHeightRef.current = containerRef.current.scrollHeight;
          
          loadMessages(activeChannelId, messages[0].createdAt).then((newMsgsCount) => {
            if (newMsgsCount === 0 || newMsgsCount < 40) {
              setHasMore(false); // 40 is the backend limit per page
            }
            
            setTimeout(() => {
              if (containerRef.current) {
                const newScrollHeight = containerRef.current.scrollHeight;
                containerRef.current.scrollTop += (newScrollHeight - prevScrollHeightRef.current);
              }
              setIsFetchingOlder(false);
            }, 0);
          }).catch(() => {
             setIsFetchingOlder(false);
          });
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    const currentTop = topRef.current;
    if (currentTop) {
      observer.observe(currentTop);
    }
    return () => {
      if (currentTop) observer.unobserve(currentTop);
    };
  }, [loadingMessages, hasMore, messages, activeChannelId, loadMessages]);

  if (loadingMessages && messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-darkest)' }}>
      
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              zIndex: 50,
              border: '1px solid var(--accent-primary)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              {selectedMessages.size} selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-icon" onClick={handleCopy} title="Copy" style={{ padding: '6px' }}>
                <RiFileCopyLine size={18} />
              </button>
              <button className="btn-icon" onClick={handleForward} title="Forward" style={{ padding: '6px' }}>
                <RiShareForwardLine size={18} />
              </button>
              <button className="btn-icon" onClick={handleDelete} title="Delete" style={{ padding: '6px', color: '#ef4444' }}>
                <RiDeleteBin6Line size={18} />
              </button>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
            <button className="btn-icon" onClick={clearSelection} title="Cancel" style={{ padding: '6px' }}>
              <RiCloseLine size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pinnedMessages[activeChannelId] && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
              <RiPushpinFill size={20} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>
                Pinned Message • {pinnedMessages[activeChannelId].sender.username}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pinnedMessages[activeChannelId].content || '(Media Message)'}
              </div>
            </div>
            <button 
              className="btn-icon" 
              onClick={() => unpinMessage(activeChannelId)} 
              title="Unpin"
              style={{ padding: '6px' }}
            >
              <RiCloseLine size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 8px 0 8px', 
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 1
        }}
      >
      <div ref={topRef} style={{ height: '1px' }} />



      {messages.length === 0 && !loadingMessages && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 2, position: 'relative' }}>
          <div style={{ width: '100%', maxWidth: '320px', padding: '32px', textAlign: 'center' }}>
            <RiMessage3Fill size={48} color="var(--border-highlight)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>No messages yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Send a message to start the conversation in this channel.
            </p>
          </div>
        </div>
      )}

      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isGrouped = prevMsg && 
                          prevMsg.sender.id === msg.sender.id && 
                          new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 300000;

        return (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            isGrouped={isGrouped} 
            isOwn={msg.sender.id === user.id}
            isSelected={selectedMessages.has(msg.id)}
            onToggleSelect={toggleSelect}
            selectionMode={selectionMode}
          />
        );
      })}
      <div ref={bottomRef} style={{ height: '20px' }} />
      </div>

      <ConfirmModal 
        isOpen={showConfirmDelete}
        title="Delete Messages"
        message={`Are you sure you want to delete ${selectedMessages.size} message(s)?`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={confirmForward}
        channels={channels}
        user={user}
      />
    </div>
  );
}

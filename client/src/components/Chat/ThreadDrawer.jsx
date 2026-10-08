import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as api from '../../services/api';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { RiCloseLine } from 'react-icons/ri';

export default function ThreadDrawer() {
  const { activeThread, setActiveThread, activeChannelId } = useChat();
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeThread) return;
    
    let isMounted = true;
    const loadReplies = async () => {
      setLoading(true);
      try {
        const data = await api.getThreadReplies(token, activeThread.id);
        if (isMounted) setReplies(data);
      } catch (err) {
        console.error('Failed to load replies:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadReplies();
    
    return () => { isMounted = false; };
  }, [activeThread, token]);

  useEffect(() => {
    if (!socket || !activeThread) return;

    const handleNewReply = (msg) => {
      if (msg.parentId === activeThread.id) {
        setReplies(prev => [...prev, msg]);
      }
    };

    socket.on('new-message', handleNewReply);
    return () => {
      socket.off('new-message', handleNewReply);
    };
  }, [socket, activeThread]);

  if (!activeThread) return null;

  return (
    <motion.div 
      className="thread-drawer"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 240 }}
      style={{ 
        width: '360px', 
        backgroundColor: 'var(--bg-card)', 
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20
      }}
    >
      <div style={{ 
        height: '60px', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-darker)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>Thread</h2>
           <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeChannelId}</span>
        </div>
        <button className="btn-icon" onClick={() => setActiveThread(null)}>
          <RiCloseLine size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
           <MessageItem message={activeThread} isGrouped={false} isOwn={activeThread.sender.id === user.id} />
        </div>
        
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
           <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{replies.length} replies</span>
           <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading replies...</div>
        ) : replies.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '8px' }}>No replies yet</span>
            <span style={{ fontSize: '0.85rem' }}>Be the first to reply to this thread!</span>
          </div>
        ) : (
          <div style={{ paddingBottom: '20px' }}>
            {replies.map((reply, i) => {
               const prev = i > 0 ? replies[i - 1] : null;
               const isGrouped = prev && prev.sender.id === reply.sender.id && new Date(reply.createdAt) - new Date(prev.createdAt) < 300000;
               return <MessageItem key={reply.id} message={reply} isGrouped={isGrouped} isOwn={reply.sender.id === user.id} />;
            })}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-darker)', paddingTop: '12px' }}>
         <MessageInput isThread={true} threadParentId={activeThread.id} />
      </div>
    </motion.div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { RiSearch2Line, RiCloseLine } from 'react-icons/ri';

export default function SearchModal({ onClose }) {
  const { token } = useAuth();
  const { setActiveChannelId } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await api.searchMessages(token, query);
          setResults(res);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  const handleSelect = (channelId) => {
    setActiveChannelId(channelId);
    onClose();
  };

  return (
    <motion.div 
      className="modal-overlay" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content" 
        style={{ padding: 0, maxWidth: '560px', width: '92%' }} 
        initial={{ scale: 0.95, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
           <RiSearch2Line size={20} style={{ color: 'var(--accent-primary)', marginRight: '12px' }} />
           <input 
             ref={inputRef}
             type="text"
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder="Search all messages..."
             style={{
               flex: 1,
               border: 'none',
               backgroundColor: 'transparent',
               color: 'var(--text-main)',
               fontSize: '1.1rem',
               outline: 'none'
             }}
           />
           <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: 'var(--bg-darkest)' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>}
          {!loading && query.length > 1 && results.length === 0 && (
             <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
               <RiSearch2Line size={48} style={{ color: 'var(--border-highlight)', marginBottom: '16px' }} />
               <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>No results found</h3>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>We couldn't find anything matching "{query}"</p>
             </div>
          )}
          
          {results.map((msg, idx) => (
             <motion.div 
               key={msg.id} 
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.03 }}
               whileHover={{ x: 4, backgroundColor: 'var(--bg-hover)' }}
               onClick={() => handleSelect(msg.channelId)}
               className="hover-item"
               style={{ 
                 padding: '16px', 
                 borderBottom: '1px solid var(--border-color)', 
                 cursor: 'pointer'
               }}
             >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                   <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{msg.sender.username}</span>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                   {msg.content}
                </div>
             </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}


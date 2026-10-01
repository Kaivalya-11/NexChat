import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { X, Search, MessageSquare, Hash } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ padding: 0, marginTop: '-20vh', maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
           <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
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
           <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: 'var(--bg-darkest)' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>}
          {!loading && query.length > 1 && results.length === 0 && (
             <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No results found for "{query}"</div>
          )}
          
          {results.map(msg => (
             <div 
               key={msg.id} 
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
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

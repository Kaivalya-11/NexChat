import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { RiCloseLine, RiMessage3Fill } from 'react-icons/ri';

export default function StartDMModal({ onClose }) {
  const { token, user } = useAuth();
  const { setActiveChannelId, refreshChannels } = useChat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllUsers(token)
      .then(data => {
        setUsers(data.filter(u => u.id !== user.id));
      })
      .finally(() => setLoading(false));
  }, [token, user.id]);

  const handleStartDM = async (targetUserId) => {
    try {
      const dm = await api.getOrCreateDM(token, targetUserId);
      await refreshChannels();
      setActiveChannelId(dm.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to start conversation');
    }
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
        style={{ padding: '24px' }} 
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Direct Message</h2>
           <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading users...</div>}
          
          {!loading && users.length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No other users found.</div>
          )}

          {users.map((u, i) => (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="hover-item"
              onClick={() => handleStartDM(u.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <img src={u.avatar} alt={u.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.username}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.statusText}</span>
              </div>
              <RiMessage3Fill size={18} style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}


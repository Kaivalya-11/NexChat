import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { X, MessageSquare } from 'lucide-react';

export default function StartDMModal({ onClose }) {
  const { token, user } = useAuth();
  const { setActiveChannelId, refreshChannels } = useChat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllUsers(token)
      .then(data => {
        // Exclude current user from the list
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Direct Message</h2>
           <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading users...</div>}
          
          {!loading && users.length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No other users found.</div>
          )}

          {users.map(u => (
            <div 
              key={u.id}
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
              <MessageSquare size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

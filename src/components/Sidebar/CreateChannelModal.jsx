import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import * as api from '../../services/api';
import { RiCloseLine, RiHashtag, RiCheckLine } from 'react-icons/ri';

export default function CreateChannelModal({ onClose }) {
  const { token, user } = useAuth();
  const { setActiveChannelId, refreshChannels } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAllUsers(token)
      .then(data => setUsers(data.filter(u => u.id !== user.id)))
      .finally(() => setLoading(false));
  }, [token, user.id]);

  const toggleUser = (id) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSubmitting(true);
    try {
      const newChan = await api.createChannel(token, {
        name,
        description,
        members: Array.from(selectedUsers)
      });
      await refreshChannels();
      setActiveChannelId(newChan.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create channel');
    } finally {
      setSubmitting(false);
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
           <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create Channel</h2>
           <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Channel Name</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', paddingLeft: '12px' }}>
              <RiHashtag size={18} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required
                style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', padding: '10px' }}
                placeholder="e.g. engineering"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Description (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What's this channel about?"
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Add Members</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              {loading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
              ) : users.map(u => (
                <motion.div 
                  key={u.id}
                  whileHover={{ x: 3 }}
                  className="hover-item"
                  onClick={() => toggleUser(u.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                >
                  <motion.div 
                    animate={{ scale: selectedUsers.has(u.id) ? 1.05 : 1 }}
                    style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedUsers.has(u.id) ? 'var(--accent-primary)' : 'transparent', transition: 'background-color 0.2s' }}
                  >
                    {selectedUsers.has(u.id) && <RiCheckLine size={14} color="white" />}
                  </motion.div>
                  <img src={u.avatar} alt={u.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.username}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary" disabled={!name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create Channel'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


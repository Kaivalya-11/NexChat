import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { RiCloseLine, RiDeleteBin6Line, RiHashtag, RiShieldStarLine } from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';

export default function ChannelSettingsModal({ channel, onClose }) {
  const { removeChannel, refreshChannels } = useChat();
  const { user, token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const isAdmin = channel.admins?.includes(user.id) || channel.owner === user.id;

  useEffect(() => {
    async function loadMembers() {
      try {
        const users = await api.getAllUsers(token);
        const channelMembers = users.filter(u => channel.members.includes(u.id));
        
        // Also include the current user if they are in the channel, because getAllUsers might filter out the current user
        if (channel.members.includes(user.id)) {
           const isAlreadyIncluded = channelMembers.some(u => u.id === user.id);
           if (!isAlreadyIncluded) {
              channelMembers.unshift(user);
           }
        }
        setMembers(channelMembers);
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [channel.members, token, user]);

  const handleDelete = () => {
    const isOwner = channel.owner === user.id;
    const actionText = (channel.isGroup && !isAdmin && !isOwner) ? 'leave' : 'delete';
    
    setConfirmConfig({
      title: `${actionText === 'leave' ? 'Leave' : 'Delete'} Channel`,
      message: `Are you sure you want to ${actionText} #${channel.name}?`,
      confirmText: actionText === 'leave' ? 'Leave' : 'Delete',
      isDanger: true,
      onConfirm: async () => {
        await removeChannel(channel.id);
        onClose();
      }
    });
  };

  const handleToggleAdmin = async (targetUserId, currentlyAdmin) => {
    try {
      if (currentlyAdmin) {
        await api.removeChannelAdmin(token, channel.id, targetUserId);
      } else {
        await api.addChannelAdmin(token, channel.id, targetUserId);
      }
      await refreshChannels();
    } catch (err) {
      alert(err.message || 'Failed to update admin status');
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
        style={{ padding: '24px', maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} 
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <RiHashtag size={20} color="var(--accent-primary)" />
             Channel Settings
           </h2>
           <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
            #{channel.name}
          </p>
          {channel.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {channel.description}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '12px' }}>Members</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading members...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(m => {
                const isMemberAdmin = channel.admins?.includes(m.id);
                const isMemberOwner = channel.owner === m.id;
                
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-darkest)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={m.avatar} alt={m.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {m.username} {m.id === user.id && '(You)'}
                      </span>
                      {isMemberAdmin && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                          <RiShieldStarLine size={12} /> {isMemberOwner ? 'Owner' : 'Admin'}
                        </span>
                      )}
                    </div>
                    
                    {isAdmin && m.id !== user.id && !isMemberOwner && (
                      <button 
                        className="btn-icon" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: isMemberAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(20, 184, 166, 0.1)', color: isMemberAdmin ? '#ef4444' : 'var(--accent-primary)' }}
                        onClick={() => handleToggleAdmin(m.id, isMemberAdmin)}
                      >
                        {isMemberAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '12px' }}>Danger Zone</h3>
          <button 
            className="btn" 
            style={{ 
              width: '100%', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px'
            }}
            onClick={handleDelete}
          >
            <RiDeleteBin6Line size={18} />
            {(channel.isGroup && !isAdmin && channel.owner !== user.id) ? 'Leave Channel' : 'Delete Channel'}
          </button>
        </div>
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
  );
}

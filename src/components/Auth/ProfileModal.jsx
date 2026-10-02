import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as api from '../../services/api';
import { RiCloseLine, RiSave3Fill } from 'react-icons/ri';

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, token } = useAuth();
  const { socket } = useSocket();
  const [status, setStatus] = useState(user.status || 'online');
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [presets, setPresets] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    api.getPresetAvatars().then(data => {
      setPresets(data.avatars);
    });
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await api.uploadFile(token, file);
      setAvatar(result.url);
    } catch (err) {
      alert('Failed to upload custom avatar: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ status, statusText, avatar });
      if (socket) {
         socket.emit('update-status', { status, statusText });
      }
      onClose();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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
           <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Profile</h2>
           <button className="btn-icon" onClick={onClose}><RiCloseLine size={22}/></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
             <motion.img 
               whileHover={{ scale: 1.06 }}
               whileTap={{ scale: 0.95 }}
               src={avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
               alt="Avatar preview" 
               style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid var(--accent-primary)`, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }} 
               onClick={() => fileInputRef.current?.click()}
             />
             <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Click image to upload custom avatar</div>
          </div>

          <div className="form-group">
            <label className="form-label">Status Text</label>
            <input 
              type="text" 
              className="form-input" 
              value={statusText} 
              onChange={e => setStatusText(e.target.value)} 
              placeholder="What's on your mind?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Presence</label>
            <select 
               className="form-input" 
               value={status} 
               onChange={e => setStatus(e.target.value)}
               style={{ backgroundColor: 'var(--bg-darkest)' }}
            >
               <option value="online">🟢 Online</option>
               <option value="away">🟠 Away</option>
               <option value="dnd">🔴 Do Not Disturb</option>
               <option value="offline">⚪ Offline (Invisible)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar</label>
            <input 
              type="text" 
              className="form-input" 
              value={avatar} 
              onChange={e => setAvatar(e.target.value)} 
              placeholder="Custom image URL..."
            />
            <div className="avatar-grid">
               {presets.map((url, i) => (
                 <motion.img 
                   key={i} 
                   whileHover={{ scale: 1.15 }}
                   whileTap={{ scale: 0.9 }}
                   src={url} 
                   alt={`Preset ${i}`} 
                   className={`avatar-option ${url === avatar ? 'selected' : ''}`}
                   onClick={() => setAvatar(url)}
                 />
               ))}
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <RiSave3Fill size={18}/> {saving ? 'Saving...' : 'Save Changes'}
             </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


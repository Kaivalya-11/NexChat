import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as api from '../../services/api';
import { X, Save } from 'lucide-react';

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, token } = useAuth();
  const { socket } = useSocket();
  const [status, setStatus] = useState(user.status || 'online');
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [presets, setPresets] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getPresetAvatars().then(data => {
      setPresets(data.avatars);
    });
  }, []);

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
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h2 style={{ margin: 0 }}>Edit Profile</h2>
           <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ alignItems: 'center', marginBottom: '24px' }}>
             <img src={avatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="Avatar preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid var(--accent-primary)` }} />
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
                 <img 
                   key={i} 
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
             <button type="submit" className="btn btn-primary" disabled={saving}>
               <Save size={16}/> {saving ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

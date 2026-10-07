import React, { useState, useEffect } from 'react';
import { RiUser3Fill, RiCloseLine, RiSearch2Line } from 'react-icons/ri';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ContactModal({ onClose, onSendContact }) {
  const { token, user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [customContactName, setCustomContactName] = useState('');
  const [customContactPhone, setCustomContactPhone] = useState('');

  useEffect(() => {
    if (token) {
      api.getAllUsers(token)
        .then(data => setUsersList(data || []))
        .catch(err => console.error('Error fetching users:', err));
    }
  }, [token]);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '440px',
        padding: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiUser3Fill size={20} style={{ color: '#34c759' }} /> Share Contact
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
          <RiSearch2Line size={18} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={contactSearch}
            onChange={e => setContactSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }}
          />
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {usersList
            .filter(u => u.id !== user.id && u.username.toLowerCase().includes(contactSearch.toLowerCase()))
            .map(u => (
              <div
                key={u.id}
                onClick={() => onSendContact({ name: u.username, email: u.email, avatar: u.avatar, userId: u.id, phone: u.phone || '+1 (555) 019-2834' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
              >
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} alt={u.username} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.username}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
              </div>
            ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>OR CUSTOM CONTACT:</div>
          <input
            type="text"
            placeholder="Full Name"
            value={customContactName}
            onChange={e => setCustomContactName(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', marginBottom: '8px', outline: 'none' }}
          />
          <input
            type="text"
            placeholder="Phone Number / Email"
            value={customContactPhone}
            onChange={e => setCustomContactPhone(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', marginBottom: '12px', outline: 'none' }}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!customContactName.trim()}
            onClick={() => onSendContact({ name: customContactName.trim(), phone: customContactPhone.trim() || '+1 (555) 000-0000' })}
          >
            Send Custom Contact
          </button>
        </div>
      </div>
    </div>
  );
}

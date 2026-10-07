import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiHashtag, RiSearch2Line, RiShareForwardLine } from 'react-icons/ri';

export default function ForwardModal({ isOpen, onClose, onForward, channels, user }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredChannels = channels.filter(c => {
    let name = c.name;
    if (!c.isGroup) {
      const otherUser = c.members?.find(m => m.id !== user?.id) || {};
      name = otherUser.username || 'Unknown';
    }
    return name?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div 
          className="modal-content" 
          style={{ 
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: 0, 
            maxWidth: '460px', 
            width: '92%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            overflow: 'hidden'
          }} 
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RiShareForwardLine /> Forward Messages
            </h3>
            <button className="btn-icon" onClick={onClose}><RiCloseLine size={24}/></button>
          </div>

          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-darkest)' }}>
             <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
               <RiSearch2Line size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
               <input 
                 type="text"
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 placeholder="Search channels or contacts..."
                 style={{
                   width: '100%',
                   padding: '12px 16px 12px 40px',
                   borderRadius: '12px',
                   border: '1px solid var(--border-color)',
                   backgroundColor: 'var(--bg-card)',
                   color: 'var(--text-main)',
                   fontSize: '0.95rem',
                   outline: 'none',
                   transition: 'border-color 0.2s ease'
                 }}
                 onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                 onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
               />
             </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '12px', backgroundColor: 'var(--bg-darkest)' }}>
            {filteredChannels.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No chats found.
              </div>
            )}
            
            {filteredChannels.map(c => {
              const isGroup = c.isGroup;
              let name = c.name;
              let avatar = null;

              if (!isGroup) {
                const otherUser = c.members?.find(m => m.id !== user?.id) || {};
                name = otherUser.username || 'Unknown';
                avatar = otherUser.avatar || `https://ui-avatars.com/api/?name=${name}`;
              }

              return (
                 <motion.div 
                   key={c.id} 
                   whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                   onClick={() => onForward(c.id)}
                   style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '12px', 
                     padding: '12px 16px', 
                     borderRadius: '12px',
                     cursor: 'pointer',
                     marginBottom: '4px',
                     transition: 'background-color 0.2s ease'
                   }}
                 >
                    {isGroup ? (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <RiHashtag size={20} />
                      </div>
                    ) : (
                      <img src={avatar} alt={name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {isGroup ? `# ${name}` : name}
                    </span>
                 </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { X, UserPlus, UserMinus, Crown, Shield } from 'lucide-react';

export default function MemberDrawer({ onClose }) {
  const { channels, activeChannelId } = useChat();
  const { onlineUsers } = useSocket();
  const { token, user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);

  const channel = channels.find(c => c.id === activeChannelId);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getAllUsers(token);
        setAllUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [token]);

  if (!channel) return null;

  const isAdmin = channel.admins?.includes(currentUser.id);
  const membersData = allUsers.filter(u => channel.members?.includes(u.id));

  return (
    <div style={{ 
      width: '320px', 
      backgroundColor: 'var(--bg-card)', 
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{ 
        height: '60px', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>Members</h2>
        <button className="btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
        
        {isAdmin && (
           <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
             <UserPlus size={16}/> Add Member
           </button>
        )}

        <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '8px' }}>
          Channel Members — {membersData.length}
        </div>

        {membersData.map(member => {
          const presence = onlineUsers.get(member.id);
          const status = presence ? presence.status : member.status;
          
          let statusColor = 'var(--text-dim)';
          if (status === 'online') statusColor = 'var(--accent-success)';
          if (status === 'away') statusColor = 'var(--accent-warning)';
          if (status === 'dnd') statusColor = 'var(--accent-danger)';

          return (
            <div key={member.id} className="hover-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: 'var(--radius-md)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <div style={{ position: 'relative' }}>
                   <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}`} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, border: '2px solid var(--bg-card)' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>{member.username}</span>
                       {channel.owner === member.id && <Crown size={12} style={{ color: 'var(--accent-warning)' }} title="Owner"/>}
                       {channel.admins?.includes(member.id) && channel.owner !== member.id && <Shield size={12} style={{ color: 'var(--accent-primary)' }} title="Admin"/>}
                    </div>
                    {member.statusText && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.statusText}</span>}
                 </div>
               </div>
               
               {isAdmin && member.id !== currentUser.id && member.id !== channel.owner && (
                 <button className="btn-icon" style={{ padding: '6px', color: 'var(--accent-danger)' }} title="Kick Member">
                   <UserMinus size={14} />
                 </button>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

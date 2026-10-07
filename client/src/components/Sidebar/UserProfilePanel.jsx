import React from 'react';
import { 
  RiSettings4Fill, 
  RiSunFill, 
  RiMoonClearFill, 
  RiLogoutBoxRFill,
  RiUser3Fill,
  RiBookmarkFill,
  RiSearch2Line,
  RiArrowRightSLine
} from 'react-icons/ri';

export default function UserProfilePanel({ user, theme, onOpenProfile, onOpenSearch, onToggleTheme, logout, getStatusColor }) {
  return (
    <div style={{ padding: '12px' }}>
      <div style={{
        backgroundColor: 'var(--bg-darkest, #0a0a0a)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 0 12px rgba(16, 185, 129, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative'
      }}>
        {/* Top: Avatar and Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', marginBottom: '12px', cursor: 'pointer' }} onClick={onOpenProfile}>
            <div style={{
              padding: '3px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(16, 185, 129, 0.1) 100%)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}>
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                alt={user.username}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--bg-darkest, #0a0a0a)',
                  display: 'block'
                }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(user.status || 'online'),
              border: '2.5px solid var(--bg-darkest, #0a0a0a)',
              boxShadow: `0 0 8px ${getStatusColor(user.status || 'online')}`
            }} />
          </div>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.username}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(user.status || 'online')
              }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {user.statusText || (user.status === 'online' ? 'Active now' : user.status === 'away' ? 'Away' : user.status === 'dnd' ? 'Do not disturb' : 'Offline')}
              </span>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Profile Shortcut */}
          <button
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)';
            }}
          >
            <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
              <RiUser3Fill size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Profile</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View & edit profile</div>
            </div>
          </button>

          {/* Quick Search Shortcut */}
          <button
            onClick={onOpenSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
          >
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <RiSearch2Line size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quick Search</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search channels, users...</div>
            </div>
          </button>
        </div>

        {/* Bottom: Appearance & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Appearance Control */}
          <button
            onClick={onToggleTheme}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              borderRadius: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <RiSunFill size={18} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <RiMoonClearFill size={18} style={{ color: 'var(--text-muted)' }} />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1, textAlign: 'left' }}>Appearance</span>
            <RiArrowRightSLine size={16} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Logout Control */}
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
            }}
            title="Logout"
          >
            <RiLogoutBoxRFill size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

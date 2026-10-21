import React from 'react';
import Link from 'next/link';
import {
  RiSettings4Fill,
  RiSunFill,
  RiMoonClearFill,
  RiLogoutBoxRFill,
  RiUser3Fill,
  RiBookmarkFill,
  RiSearch2Line,
  RiArrowRightSLine,
  RiShieldCheckFill
} from 'react-icons/ri';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export default function UserProfilePanel({ user, theme, onOpenProfile, onOpenSearch, onToggleTheme, logout, getStatusColor }) {
  return (
    <div style={{ padding: '12px', flexShrink: 0 }}>
      <div style={{
        backgroundColor: '#11181C',
        borderRadius: '16px',
        border: '1px solid #1F2E35',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.05) 100%)',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)'
            }}>
              <img
                src={getOptimizedImageUrl(user.avatar || `https://ui-avatars.com/api/?name=${user.username}`, { width: 128, height: 128 })}
                alt={user.username}
                width="64"
                height="64"
                decoding="async"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0B1013',
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
              border: '2.5px solid #11181C',
              boxShadow: `0 0 8px ${getStatusColor(user.status || 'online')}`
            }} />
          </div>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {user.username}
              {user.isAdmin && (
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#F59E0B',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <RiShieldCheckFill size={10} /> ADMIN
                </span>
              )}
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
              backgroundColor: '#162026',
              border: '1px solid #1F2E35',
              borderRadius: '10px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1E2B33';
              e.currentTarget.style.borderColor = '#2C3F49';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#162026';
              e.currentTarget.style.borderColor = '#1F2E35';
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

          {/* Admin Dashboard Shortcut (Only visible for Admins) */}
          {(user.isAdmin || user.role === 'admin') && (
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.16)';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              }}
            >
              <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                <RiShieldCheckFill size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Admin Dashboard
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Bottom: Appearance & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid #1F2E35'
        }}>
          {/* Appearance Control */}
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#162026'}
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
            aria-label="Log out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '8px',
              color: '#F43F5E',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.16)';
              e.currentTarget.style.borderColor = '#F43F5E';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
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

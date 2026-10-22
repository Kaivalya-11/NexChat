"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import {
  RiDashboardLine,
  RiGroupLine,
  RiHashtag,
  RiShieldCheckLine,
  RiBarChartLine,
  RiPulseLine,
  RiMegaphoneLine,
  RiSettings4Line,
  RiCloudLine,
  RiFileList3Line,
  RiArrowLeftLine,
  RiCloseLine,
  RiShieldFlashFill
} from 'react-icons/ri';

export const ADMIN_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: RiDashboardLine,
    description: 'System platform summary and database metrics'
  },
  {
    id: 'users',
    label: 'Users',
    icon: RiGroupLine,
    description: 'Account directory, role assignments, and statuses',
    features: ['Search and filter accounts', 'Promote to moderator/admin', 'Account suspension controls']
  },
  {
    id: 'channels',
    label: 'Channels',
    icon: RiHashtag,
    description: 'Channel inspection, admin roles, and member controls',
    features: ['Public and private group management', 'Archive inactive channels', 'Channel member audit']
  },
  {
    id: 'moderation',
    label: 'Moderation',
    icon: RiShieldCheckLine,
    description: 'User report queue, policy enforcement, and review logs',
    features: ['Review incoming flagged reports', 'Assign reports to moderators', 'Record moderation resolutions']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: RiBarChartLine,
    description: 'Growth trends, daily active users, and message velocity',
    features: ['Message volume breakdown', 'Active user retention graphs', 'Peak chat activity hours']
  },
  {
    id: 'system_health',
    label: 'System Health',
    icon: RiPulseLine,
    description: 'MongoDB connectivity, latency, memory and uptime telemetry'
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: RiMegaphoneLine,
    description: 'Broadcast system updates and maintenance banners',
    features: ['Author and schedule broadcasts', 'Target general, maintenance or security categories', 'Live banner delivery']
  },
  {
    id: 'storage',
    label: 'Storage & Media',
    icon: RiCloudLine,
    description: 'Cloudinary storage metrics, media assets, and orphan scans',
    features: ['Storage capacity telemetry', 'Media asset browser', 'Safe orphan cleanup']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: RiSettings4Line,
    description: 'Platform defaults, rate limits, and registration rules',
    features: ['Maintenance mode with zero admin lockout', 'Toggle public registration', 'File upload size ceilings', 'Feature flags']
  },
  {
    id: 'audit_logs',
    label: 'Audit Logs',
    icon: RiFileList3Line,
    description: 'Immutable security log of administrative operations',
    features: ['Role change audit trail', 'Account suspension history', 'Admin session tracking']
  }
];

export default function AdminSidebar({
  activeNav,
  onSelectNav,
  isOpen,
  onClose,
  adminUser
}) {
  // Close drawer on Escape key when open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
          className="admin-mobile-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: '#11181C',
          borderRight: '1px solid #1F2E35',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'translateX(0)' : undefined
        }}
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Admin Navigation"
      >
        {/* Header / Brand */}
        <div style={{
          padding: '18px 16px',
          borderBottom: '1px solid #1F2E35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#11181C'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#162026',
              border: '1px solid #1F2E35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)'
            }}>
              <RiShieldFlashFill size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#F1F5F9',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                NexChat
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em'
                }}>
                  ADMIN
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: '#94A3B8',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600
              }}>
                Admin Console
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="mobile-only-btn"
            aria-label="Close admin menu"
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748B',
            padding: '4px 10px 8px',
            fontWeight: 700
          }}>
            CONSOLE MODULES
          </div>

          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                  if (onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#162026' : 'transparent',
                  border: isActive ? '1px solid #1F2E35' : '1px solid transparent',
                  borderLeft: isActive ? '3px solid #10B981' : '3px solid transparent',
                  color: isActive ? '#F1F5F9' : '#94A3B8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#162026';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <Icon size={17} style={{ color: isActive ? '#10B981' : '#64748B', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>

                {item.badge && item.badge !== 'Live' && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#94A3B8',
                    border: '1px solid #1F2E35'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '14px 10px',
          borderTop: '1px solid #1F2E35',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#0B1013'
        }}>
          {/* Admin Identity Card */}
          {adminUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#162026',
              border: '1px solid #1F2E35'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOptimizedImageUrl(adminUser.avatar || `https://ui-avatars.com/api/?name=${adminUser.username}`, { width: 68, height: 68 })}
                alt={adminUser.username}
                width="32"
                height="32"
                loading="lazy"
                decoding="async"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #10B981'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#F1F5F9',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {adminUser.username}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#10B981',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <RiShieldCheckLine size={12} style={{ flexShrink: 0 }} />
                  <span>ADMINISTRATOR</span>
                </div>
              </div>
            </div>
          )}

          {/* Return to Chat Button (Ghost per DESIGN.md) */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#162026',
              border: '1px solid #1F2E35',
              borderRadius: '8px',
              color: '#F1F5F9',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
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
            <RiArrowLeftLine size={16} />
            Return to NexChat
          </Link>
        </div>
      </aside>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
            width: 260px !important;
            position: fixed !important;
            transform: translateX(0) !important;
          }
          .admin-mobile-backdrop {
            display: none !important;
          }
          .mobile-only-btn {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .admin-sidebar {
            width: min(260px, 85vw) !important;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}


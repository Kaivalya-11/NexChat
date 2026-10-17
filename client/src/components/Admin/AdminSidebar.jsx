"use client";
import React from 'react';
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
        />
      )}

      {/* Sidebar Aside */}
      <aside
        style={{
          width: '280px',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'transform 0.25s ease',
          transform: isOpen ? 'translateX(0)' : undefined
        }}
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* Header / Brand */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid var(--accent-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-success)',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
            }}>
              <RiShieldFlashFill size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                NexChat
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(211, 255, 234, 0.1)',
                  padding: '2px 5px',
                  borderRadius: '4px'
                }}>
                  ADMIN
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Management Console
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="mobile-only-btn"
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '4px 10px 8px'
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
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>

                {item.badge && item.badge !== 'Live' && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-dim)'
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
          padding: '16px 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          {/* Admin Identity Card */}
          {adminUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOptimizedImageUrl(adminUser.avatar || `https://ui-avatars.com/api/?name=${adminUser.username}`, { width: 68, height: 68 })}
                alt={adminUser.username}
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid var(--accent-success)'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {adminUser.username}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--accent-success)',
                  fontWeight: 600
                }}>
                  👑 Administrator
                </div>
              </div>
            </div>
          )}

          {/* Clear Return to Chat Button */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(211, 255, 234, 0.08)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(211, 255, 234, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(211, 255, 234, 0.08)';
            }}
          >
            <RiArrowLeftLine size={18} />
            Return to NexChat
          </Link>
        </div>
      </aside>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
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
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}


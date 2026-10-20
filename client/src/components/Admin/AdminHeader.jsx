"use client";
import React from 'react';
import Link from 'next/link';
import {
  RiMenuLine,
  RiArrowLeftLine,
  RiShieldCheckFill
} from 'react-icons/ri';

export default function AdminHeader({
  activeNav,
  navItem,
  onToggleSidebar,
  adminUser
}) {
  return (
    <header 
      className="admin-header"
      style={{
        height: '74px',
        backgroundColor: '#11181C',
        borderBottom: '1px solid #1F2E35',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '8px',
            backgroundColor: '#162026',
            border: '1px solid #1F2E35',
            borderRadius: '8px',
            color: '#F1F5F9',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          className="admin-hamburger"
          title="Open Admin Navigation"
          aria-label="Open admin navigation menu"
        >
          <RiMenuLine size={19} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, marginBottom: '2px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94A3B8',
              whiteSpace: 'nowrap'
            }}>
              NexChat Admin
            </span>
            <span style={{ color: '#475569', fontSize: '11px' }}>/</span>
            <span style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#F1F5F9',
              fontFamily: 'var(--font-heading)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {navItem?.label || 'Dashboard'}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#94A3B8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.35
          }} className="admin-header-subtitle">
            {navItem?.description || 'Admin management console'}
          </div>
        </div>
      </div>

      {/* Right: Telemetry pill & Return button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Status Pill (DESIGN.md Status Pills & Telemetry Badges) */}
        

        {/* Clear Return to NexChat Link (Secondary/Ghost button per DESIGN.md) */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            backgroundColor: '#162026',
            border: '1px solid #1F2E35',
            borderRadius: '8px',
            color: '#F1F5F9',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1E2B33';
            e.currentTarget.style.borderColor = '#2C3F49';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#162026';
            e.currentTarget.style.borderColor = '#1F2E35';
          }}
          title="Return to NexChat"
          aria-label="Return to NexChat"
        >
          <RiArrowLeftLine size={16} />
          <span className="admin-return-text">Return to NexChat</span>
        </Link>
      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-hamburger {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .admin-header {
            padding: 0 16px !important;
            height: 68px !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header {
            padding: 0 12px !important;
            height: 64px !important;
          }
          .admin-status-pill,
          .admin-header-subtitle {
            display: none !important;
          }
          .admin-return-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}


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
        height: '68px',
        backgroundColor: 'var(--header-bg, #0A1514)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
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
          <RiMenuLine size={20} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              NexChat Admin
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>/</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {navItem?.label || 'Dashboard'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="admin-header-subtitle">
            {navItem?.description || 'Admin management console'}
          </div>
        </div>
      </div>

      {/* Right: Telemetry pill & Return button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Live Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.75rem',
          color: 'var(--accent-success)',
          fontWeight: 600
        }} className="admin-status-pill">
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-success)',
            boxShadow: '0 0 6px var(--accent-success)'
          }} />
          System Operational
        </div>

        {/* Clear Return to NexChat Link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-main)';
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
            height: 60px !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header {
            padding: 0 12px !important;
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


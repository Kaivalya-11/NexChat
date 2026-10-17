"use client";
import React from 'react';
import Link from 'next/link';
import {
  RiShieldCrossFill,
  RiArrowLeftLine,
  RiRefreshLine,
  RiInformationLine,
  RiInboxLine,
  RiTimeLine,
  RiMagicFill
} from 'react-icons/ri';

/**
 * Loading state with NexChat emerald theme spinner and skeleton preview
 */
export function AdminLoadingState({ message = 'Verifying admin authorization...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '48px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        marginBottom: '24px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderBottomColor: 'var(--accent-secondary)',
          animation: 'spin 1.5s linear infinite reverse'
        }} />
      </div>
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: 600,
        color: 'var(--text-main)',
        marginBottom: '8px',
        fontFamily: 'var(--font-heading)'
      }}>
        {message}
      </h3>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)'
      }}>
        Connecting securely to NexChat admin services...
      </p>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Access-Denied state when logged-in user is not an admin
 */
export function AdminAccessDeniedState({ username }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-darkest)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 28px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Amber/Red Alert Glow */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: '#ef4444'
        }}>
          <RiShieldCrossFill size={36} />
        </div>

        <span style={{
          display: 'inline-block',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '4px 10px',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          403 Forbidden
        </span>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '12px',
          fontFamily: 'var(--font-heading)'
        }}>
          Access Denied
        </h2>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          {username ? (
            <>User <strong style={{ color: 'var(--text-main)' }}>@{username}</strong> does not have administrator privileges.</>
          ) : (
            <>Your account does not have administrator privileges.</>
          )}
          <br />
          This area is strictly restricted to authorized NexChat staff.
        </p>

        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-darkest)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          textAlign: 'left',
          marginBottom: '24px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <RiInformationLine size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            If you are an administrator, use the secure bootstrap CLI script on the backend or verify your account credentials.
          </span>
        </div>

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px 20px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--btn-primary-text)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <RiArrowLeftLine size={18} />
          Return to NexChat
        </Link>
      </div>
    </div>
  );
}

/**
 * Error state with retry callback
 */
export function AdminErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      maxWidth: '520px',
      margin: '40px auto'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        marginBottom: '16px'
      }}>
        <RiShieldCrossFill size={28} />
      </div>

      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-main)',
        marginBottom: '8px'
      }}>
        Unable to Load Admin Data
      </h3>

      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        marginBottom: '24px',
        maxWidth: '400px'
      }}>
        {message || 'An unexpected server error occurred while contacting the admin API.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.15s ease'
          }}
        >
          <RiRefreshLine size={16} />
          Retry Request
        </button>
      )}
    </div>
  );
}

/**
 * Generic Empty State component
 */
export function AdminEmptyState({ title = 'No records found', description = 'There is currently no data in this section.', icon: Icon = RiInboxLine }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-dim)',
        marginBottom: '16px'
      }}>
        <Icon size={26} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
        {description}
      </p>
    </div>
  );
}

/**
 * Professional Coming Soon state for future modules (Phase 2 Roadmap)
 */
export function AdminComingSoonState({
  title,
  description,
  icon: Icon = RiTimeLine,
  plannedFeatures = []
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '56px 24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      maxWidth: '680px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: 'rgba(211, 255, 234, 0.08)',
        border: '1px solid var(--border-highlight)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-primary)',
        marginBottom: '20px'
      }}>
        <Icon size={32} />
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        backgroundColor: 'rgba(211, 255, 234, 0.06)',
        border: '1px solid var(--border-color)',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--accent-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '14px'
      }}>
        <RiMagicFill size={13} />
        Phase 2 Roadmap
      </div>

      <h2 style={{
        fontSize: '1.6rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '10px',
        fontFamily: 'var(--font-heading)'
      }}>
        {title} Module
      </h2>

      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        maxWidth: '520px',
        marginBottom: '28px'
      }}>
        {description || `The ${title} management controls are part of the upcoming phase and will be available soon.`}
      </p>

      {plannedFeatures.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'left',
          backgroundColor: 'var(--bg-darkest)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)',
            marginBottom: '12px'
          }}>
            Planned Capabilities:
          </div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {plannedFeatures.map((feat, i) => (
              <li key={i} style={{
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)'
                }} />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

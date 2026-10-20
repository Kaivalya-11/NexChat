"use client";
import React, { useEffect, useState } from 'react';
import {
  RiGroupLine,
  RiHashtag,
  RiMessage3Line,
  RiMessage2Line,
  RiServerLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiPulseLine,
  RiArrowRightLine,
  RiTimeLine,
  RiBarChartLine,
  RiUserAddLine,
  RiFolderAddLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiArrowUpLine,
  RiScales3Line,
  RiShieldUserLine,
  RiShieldLine,
  RiUserLine,
  RiLockLine,
  RiFlashlightLine,
  RiCheckLine,
  RiShieldFlashLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState } from '../AdminStates';

function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.slice(0, 3).join(' ');
}

function formatDateRelative(dateStr) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

const QUICK_NAV_ITEMS = [
  {
    id: 'analytics',
    label: 'Analytics & Trends',
    desc: 'Registration curves, daily message velocity, and channel metrics.',
    icon: RiBarChartLine
  },
  {
    id: 'system_health',
    label: 'System Health',
    desc: 'Monitor database latency, RAM usage, sockets, and server runtime.',
    icon: RiPulseLine
  },
  {
    id: 'users',
    label: 'Users Directory',
    desc: 'Review registered accounts, role privileges, and active statuses.',
    icon: RiGroupLine
  },
  {
    id: 'channels',
    label: 'Channel Management',
    desc: 'Inspect public channels, member quotas, and room settings.',
    icon: RiHashtag
  },
  {
    id: 'moderation',
    label: 'Moderation Queue',
    desc: 'Handle user reports, policy violations, and account suspensions.',
    icon: RiShieldCheckLine
  }
];

export default function OverviewView({ token, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    api.getAdminOverview(token)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load overview data', err);
          setError(err.message || 'Failed to load overview data');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await api.getAdminOverview(token);
      setData(res);
    } catch (err) {
      console.error('Failed to refresh overview data', err);
      setError(err.message || 'Failed to refresh overview data');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading dashboard statistics..." />;
  }

  if (error) {
    return <AdminErrorState message={error} onRetry={handleRefresh} />;
  }

  const { stats, server } = data || { stats: {}, server: {} };
  const users = stats.users || { total: 0, active: 0, suspended: 0, deactivated: 0, admins: 0, moderators: 0, regular: 0 };
  const channels = stats.channels || { total: 0, groups: 0, dms: 0 };
  const messages = stats.messages || { total: 0 };
  const velocity = stats.velocity || { newUsers: 0, newMessages: 0, newChannels: 0, windowDays: 7 };
  const moderation = stats.moderation || { pendingReports: 0, pendingAppeals: 0, resolvedReports: 0 };
  const recent = stats.recentActivity || { users: [], channels: [], auditLogs: [] };

  return (
    <div className="overview-container">
      {/* Executive Command Header */}
      <div className="overview-header-banner">
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-primary)',
            backgroundColor: 'rgba(211, 255, 234, 0.08)',
            border: '1px solid rgba(211, 255, 234, 0.2)',
            padding: '3px 10px',
            borderRadius: '999px',
            marginBottom: '10px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-success)',
              boxShadow: '0 0 8px var(--accent-success)'
            }} />
            Live Platform Telemetry
          </div>

          <h1 style={{
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 6px 0',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em'
          }}>
            System Platform Overview
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: 0,
            maxWidth: '600px',
            lineHeight: 1.45
          }}>
            Real-time aggregate database metrics, rolling 7-day velocity curves, and platform security events.
          </p>

          {/* Subsystem Health Ribbons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '14px',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <RiTimeLine size={13} style={{ color: 'var(--accent-primary)' }} />
              Uptime: <strong style={{ color: 'var(--text-main)' }}>{formatUptime(server?.uptime)}</strong>
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <RiServerLine size={13} style={{ color: 'var(--accent-secondary)' }} />
              Node: <strong style={{ color: 'var(--text-main)' }}>{server?.nodeVersion || 'v20.x'}</strong>
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
              Database: <strong style={{ color: 'var(--accent-success)' }}>Connected</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="overview-header-actions">
          <button
            onClick={() => onNavigate && onNavigate('analytics')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 16px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.18)';
              e.currentTarget.style.borderColor = '#60a5fa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
          >
            <RiBarChartLine size={16} />
            Platform Analytics
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 16px',
              backgroundColor: 'var(--bg-darkest)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = 'var(--border-highlight)';
              }
            }}
            onMouseOut={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = 'var(--bg-darkest)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
          >
            <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="overview-kpi-grid">
        {/* Total Users Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Accounts
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(211, 255, 234, 0.08)',
                border: '1px solid rgba(211, 255, 234, 0.2)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RiGroupLine size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: 'clamp(1.9rem, 2.5vw, 2.35rem)',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {users.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-success)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '2px 7px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <RiArrowUpLine size={11} />
                +{velocity.newUsers} 7d
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px 8px' }}>
              <span style={{ color: 'var(--accent-success)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
                {users.active} Active
              </span>

              <span style={{
                color: users.suspended > 0 ? '#ef4444' : 'var(--text-dim)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {users.suspended > 0 ? (
                  <>
                    <RiAlertLine size={12} />
                    <span>{users.suspended} Suspended</span>
                  </>
                ) : (
                  <span>0 Suspended</span>
                )}
              </span>

              {users.deactivated > 0 && (
                <span style={{ whiteSpace: 'nowrap', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--text-dim)' }} />
                  {users.deactivated} Deact
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '4px 8px',
              color: 'var(--text-muted)',
              fontSize: '0.7rem'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>{users.admins} Admins</span>
              <span style={{ whiteSpace: 'nowrap' }}>{users.moderators} Mods</span>
              <span style={{ whiteSpace: 'nowrap' }}>{users.regular} Users</span>
            </div>
          </div>
        </div>

        {/* Total Channels Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Channels
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RiHashtag size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: 'clamp(1.9rem, 2.5vw, 2.35rem)',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {channels.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: '#60a5fa',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '2px 7px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <RiArrowUpLine size={11} />
                +{velocity.newChannels} 7d
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiHashtag size={12} style={{ color: 'var(--accent-secondary)' }} />
              {channels.groups} Public Groups
            </span>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiMessage2Line size={12} style={{ color: 'var(--accent-primary)' }} />
              {channels.dms} Direct Chats
            </span>
          </div>
        </div>

        {/* Total Messages Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Messages
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RiMessage3Line size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: 'clamp(1.9rem, 2.5vw, 2.35rem)',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {messages.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: '#fbbf24',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '2px 7px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <RiArrowUpLine size={11} />
                +{velocity.newMessages} 7d
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px 8px'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiLockLine size={12} style={{ color: 'var(--accent-primary)' }} />
              Encrypted in-transit
            </span>
            <span
              style={{ cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}
              onClick={() => onNavigate && onNavigate('analytics')}
            >
              Trends →
            </span>
          </div>
        </div>

        {/* Moderation Queue Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Moderation Queue
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: moderation.pendingReports > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: moderation.pendingReports > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                color: moderation.pendingReports > 0 ? '#ef4444' : 'var(--accent-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RiShieldCheckLine size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: 'clamp(1.9rem, 2.5vw, 2.35rem)',
                fontWeight: 800,
                color: moderation.pendingReports > 0 ? '#ef4444' : 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {moderation.pendingReports}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                pending {moderation.pendingReports === 1 ? 'report' : 'reports'}
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px 8px'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiScales3Line size={13} style={{ color: '#c084fc' }} />
              {moderation.pendingAppeals} Appeals
            </span>
            <button
              onClick={() => onNavigate && onNavigate('moderation')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Review Queue →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Platform Activity Feeds (Real Database-derived) */}
      <div className="overview-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Recent Platform Activity
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Real-time administrative audit trail, newly registered users, and channel creations.
            </p>
          </div>
        </div>

        <div className="overview-activity-grid">
          {/* Recent Accounts */}
          <div className="activity-subcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiUserAddLine color="var(--accent-primary)" size={16} />
                <span>New Accounts</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(211, 255, 234, 0.08)',
                  color: 'var(--accent-primary)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {recent.users?.length || 0}
                </span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('users')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                All Users →
              </button>
            </div>

            {(!recent.users || recent.users.length === 0) ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No recent user registrations</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recent.users.map(u => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        @{u.username}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        textTransform: 'uppercase',
                        backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.12)' : (u.role === 'moderator' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.05)'),
                        color: u.role === 'admin' ? '#ef4444' : (u.role === 'moderator' ? '#60a5fa' : 'var(--text-dim)'),
                        border: u.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.25)' : (u.role === 'moderator' ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-color)'),
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Channels */}
          <div className="activity-subcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiFolderAddLine color="#60a5fa" size={16} />
                <span>New Channels</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  color: '#60a5fa',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {recent.channels?.length || 0}
                </span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('channels')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                All Channels →
              </button>
            </div>

            {(!recent.channels || recent.channels.length === 0) ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No recent channels</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recent.channels.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', color: c.isGroup ? 'var(--accent-primary)' : '#60a5fa', flexShrink: 0 }}>
                        {c.isGroup ? <RiHashtag size={13} /> : <RiMessage2Line size={13} />}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-dim)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(c.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit / Security Events */}
          <div className="activity-subcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiShieldCheckLine color="var(--accent-success)" size={16} />
                <span>Security & Actions</span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('audit_logs')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Audit Trail →
              </button>
            </div>

            {(!recent.auditLogs || recent.auditLogs.length === 0) ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No administrative events recorded</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recent.auditLogs.map(a => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: a.result === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: a.result === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                        color: a.result === 'success' ? 'var(--accent-success)' : '#ef4444',
                        maxWidth: '135px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }} title={a.action}>
                        {a.action}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        by @{a.actorUsername}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Administrative Modules Hub */}
      <div className="overview-panel">
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 4px 0',
            fontFamily: 'var(--font-heading)'
          }}>
            Administrative Control Center
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Direct access to dedicated configuration, moderation workflows, and platform telemetry.
          </p>
        </div>

        <div className="overview-control-grid">
          {QUICK_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate && onNavigate(item.id)}
                className="control-card"
                style={{
                  padding: '16px 18px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-highlight)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-darkest)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(211, 255, 234, 0.05)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.label}
                    </span>
                    {item.badge && item.badge !== 'Live' && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--accent-success)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                    {item.desc}
                  </p>
                </div>

                <RiArrowRightLine size={18} color="var(--text-dim)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .overview-container {
          display: flex;
          flex-direction: column;
          gap: 22px;
          width: 100%;
          box-sizing: border-box;
        }

        .overview-header-banner {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding: 22px 26px;
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .overview-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* 4 KPI cards: 4 columns on desktop (>=1200px), 2 on tablet/laptop, 1 on mobile */
        .overview-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .overview-kpi-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 22px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          min-width: 0;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .overview-kpi-card:hover {
          border-color: var(--border-highlight);
        }

        /* Recent Activity: 3 columns on desktop, responsive wrap below */
        .overview-activity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .activity-subcard {
          background-color: var(--bg-darkest);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 18px;
          min-width: 0;
        }

        /* Control Center Grid */
        .overview-control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .overview-panel {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 1200px) {
          .overview-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .overview-activity-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .overview-container {
            gap: 16px;
          }
          .overview-header-banner {
            padding: 18px 16px;
          }
          .overview-header-actions {
            width: 100%;
          }
          .overview-header-actions button {
            flex: 1;
            justify-content: center;
          }
          .overview-activity-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .overview-panel {
            padding: 18px 16px;
          }
        }

        @media (max-width: 600px) {
          .overview-kpi-grid {
            grid-template-columns: 1fr;
          }
          .overview-control-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

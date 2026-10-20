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
  RiArrowUpLine,
  RiScales3Line,
  RiLockLine
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
      {/* Executive Command Header (DESIGN.md: Surface Layer 1 #11181C with sharp hairline 1px stroke #1F2E35) */}
      <div className="overview-header-banner">
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          {/* Status Pill (DESIGN.md: Height 24px, pill-shaped radius 9999px, 1px stroke at 20% opacity) */}

          {/* Title in display-lg (DESIGN.md: Geist 32px/24px mobile, weight 600, color #F1F5F9) */}
          <h1 style={{
            fontSize: 'clamp(1.35rem, 2vw, 1.75rem)',
            fontWeight: 600,
            color: '#F1F5F9',
            margin: '0 0 6px 0',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            System Platform Overview
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#94A3B8',
            margin: 0,
            maxWidth: '620px',
            lineHeight: 1.45,
            fontFamily: 'var(--font-heading)'
          }}>
            Real-time aggregate database metrics, rolling 7-day velocity curves, and platform security events.
          </p>

          {/* Subsystem Telemetry Indicators (DESIGN.md: strictly JetBrains Mono mono-tag/mono-data) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '14px',
            flexWrap: 'wrap',
            fontSize: '11px',
            color: '#64748B',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <RiTimeLine size={13} style={{ color: '#10B981' }} />
              UPTIME: <strong style={{ color: '#F1F5F9', fontWeight: 600 }}>{formatUptime(server?.uptime)}</strong>
            </span>
            <span style={{ color: '#1F2E35' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <RiServerLine size={13} style={{ color: '#06B6D4' }} />
              NODE: <strong style={{ color: '#F1F5F9', fontWeight: 600 }}>{server?.nodeVersion || 'v20.x'}</strong>
            </span>
            <span style={{ color: '#1F2E35' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              DATABASE: <strong style={{ color: '#10B981', fontWeight: 600 }}>CONNECTED</strong>
            </span>
          </div>
        </div>

        {/* Action Controls (DESIGN.md Buttons: Primary emerald and Secondary ghost) */}
        <div className="overview-header-actions">
          <button
            onClick={() => onNavigate && onNavigate('analytics')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: '#0B1013',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#34D399';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.boxShadow = 'none';
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
              padding: '8px 16px',
              backgroundColor: '#162026',
              color: '#F1F5F9',
              border: '1px solid #1F2E35',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = '#1E2B33';
                e.currentTarget.style.borderColor = '#2C3F49';
              }
            }}
            onMouseOut={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = '#162026';
                e.currentTarget.style.borderColor = '#1F2E35';
              }
            }}
          >
            <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid (DESIGN.md: 4 Metric Overview Cards on 12-column grid, 3 cols each) */}
      <div className="overview-kpi-grid">
        {/* 1. Total Accounts Card */}
        <div className="overview-kpi-card">
          <div>
            {/* Top Row: label-caps in uppercase */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-heading)'
              }}>
                Total Accounts
              </span>
            </div>

            {/* Value Cluster: headline-metric (36px, weight 600, tabular figures) + delta pill (mono-tag) */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: '34px',
                fontWeight: 600,
                color: '#F1F5F9',
                fontFamily: 'var(--font-heading)',
                lineHeight: '40px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {users.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '2px 7px',
                borderRadius: '9999px',
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

          {/* Footer: Subtle hairline separator #1F2E35 leading to metadata attributes */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #1F2E35',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px 8px' }}>
              <span style={{ color: '#10B981', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                {users.active} Active
              </span>

              <span style={{
                color: users.suspended > 0 ? '#F43F5E' : '#64748B',
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
                <span style={{ whiteSpace: 'nowrap', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#475569' }} />
                  {users.deactivated} Deact
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '4px 8px',
              color: '#64748B',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>{users.admins} Admins</span>
              <span style={{ whiteSpace: 'nowrap' }}>{users.moderators} Mods</span>
              <span style={{ whiteSpace: 'nowrap' }}>{users.regular} Users</span>
            </div>
          </div>
        </div>

        {/* 2. Total Channels Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-heading)'
              }}>
                Total Channels
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: '34px',
                fontWeight: 600,
                color: '#F1F5F9',
                fontFamily: 'var(--font-heading)',
                lineHeight: '40px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {channels.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: '#06B6D4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '2px 7px',
                borderRadius: '9999px',
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
            borderTop: '1px solid #1F2E35',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '12px',
            color: '#94A3B8'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiHashtag size={12} style={{ color: '#06B6D4' }} />
              {channels.groups} Public Groups
            </span>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiMessage2Line size={12} style={{ color: '#10B981' }} />
              {channels.dms} Direct Chats
            </span>
          </div>
        </div>

        {/* 3. Total Messages Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-heading)'
              }}>
                Total Messages
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: '34px',
                fontWeight: 600,
                color: '#F1F5F9',
                fontFamily: 'var(--font-heading)',
                lineHeight: '40px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {messages.total.toLocaleString()}
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '2px 7px',
                borderRadius: '9999px',
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
            borderTop: '1px solid #1F2E35',
            fontSize: '12px',
            color: '#94A3B8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px 8px'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiLockLine size={12} style={{ color: '#10B981' }} />
              Encrypted In-Transit
            </span>
            <span
              style={{ cursor: 'pointer', color: '#10B981', fontWeight: 600, whiteSpace: 'nowrap' }}
              onClick={() => onNavigate && onNavigate('analytics')}
            >
              Trends →
            </span>
          </div>
        </div>

        {/* 4. Moderation Queue Card */}
        <div className="overview-kpi-card">
          <div>
            <div style={{ marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-heading)'
              }}>
                Moderation Queue
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: '34px',
                fontWeight: 600,
                color: moderation.pendingReports > 0 ? '#F43F5E' : '#F1F5F9',
                fontFamily: 'var(--font-heading)',
                lineHeight: '40px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {moderation.pendingReports}
              </div>
              <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                pending {moderation.pendingReports === 1 ? 'report' : 'reports'}
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #1F2E35',
            fontSize: '12px',
            color: '#94A3B8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px 8px'
          }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiScales3Line size={13} style={{ color: '#F59E0B' }} />
              {moderation.pendingAppeals} Appeals
            </span>
            <button
              onClick={() => onNavigate && onNavigate('moderation')}
              style={{
                background: 'none',
                border: 'none',
                color: '#10B981',
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

      {/* Recent Platform Activity Feeds (DESIGN.md: Surface Layer 1 #11181C, subcards #162026, hairline dividers #1F2E35) */}
      <div className="overview-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#F1F5F9',
              margin: 0,
              fontFamily: 'var(--font-heading)'
            }}>
              Recent Platform Activity
            </h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0', fontFamily: 'var(--font-heading)' }}>
              Real-time administrative audit trail, newly registered users, and channel creations.
            </p>
          </div>
        </div>

        <div className="overview-activity-grid">
          {/* Recent Accounts */}
          <div className="activity-subcard">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid #1F2E35',
              paddingBottom: '10px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <RiUserAddLine color="#10B981" size={15} />
                <span>New Accounts</span>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}>
                  {recent.users?.length || 0}
                </span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('users')}
                style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                All Users →
              </button>
            </div>

            {(!recent.users || recent.users.length === 0) ? (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>NO RECENT REGISTRATIONS</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {recent.users.map(u => (
                  <div
                    key={u.id}
                    className="activity-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        @{u.username}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        backgroundColor: u.role === 'admin' ? 'rgba(244, 63, 94, 0.12)' : (u.role === 'moderator' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.05)'),
                        color: u.role === 'admin' ? '#F43F5E' : (u.role === 'moderator' ? '#06B6D4' : '#94A3B8'),
                        border: u.role === 'admin' ? '1px solid rgba(244, 63, 94, 0.25)' : (u.role === 'moderator' ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid #1F2E35'),
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <span style={{ color: '#64748B', fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Channels */}
          <div className="activity-subcard">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid #1F2E35',
              paddingBottom: '10px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <RiFolderAddLine color="#06B6D4" size={15} />
                <span>New Channels</span>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  color: '#06B6D4',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  padding: '1px 6px',
                  borderRadius: '9999px'
                }}>
                  {recent.channels?.length || 0}
                </span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('channels')}
                style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                All Channels →
              </button>
            </div>

            {(!recent.channels || recent.channels.length === 0) ? (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>NO RECENT CHANNELS</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {recent.channels.map(c => (
                  <div
                    key={c.id}
                    className="activity-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', color: c.isGroup ? '#10B981' : '#06B6D4', flexShrink: 0 }}>
                        {c.isGroup ? <RiHashtag size={13} /> : <RiMessage2Line size={13} />}
                      </span>
                      <span style={{ fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid #1F2E35',
                        color: '#94A3B8',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}>
                        {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <span style={{ color: '#64748B', fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(c.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit / Security Events */}
          <div className="activity-subcard">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid #1F2E35',
              paddingBottom: '10px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <RiShieldCheckLine color="#10B981" size={15} />
                <span>Security & Actions</span>
              </span>
              <button
                onClick={() => onNavigate && onNavigate('audit_logs')}
                style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Audit Trail →
              </button>
            </div>

            {(!recent.auditLogs || recent.auditLogs.length === 0) ? (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>NO AUDIT EVENTS RECORDED</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {recent.auditLogs.map(a => (
                  <div
                    key={a.id}
                    className="activity-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: a.result === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        border: a.result === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                        color: a.result === 'success' ? '#10B981' : '#F43F5E',
                        maxWidth: '135px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }} title={a.action}>
                        {a.action}
                      </span>
                      <span style={{ color: '#94A3B8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        by @{a.actorUsername}
                      </span>
                    </div>
                    <span style={{ color: '#64748B', fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatDateRelative(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Administrative Modules Hub (DESIGN.md: Surface Layer 1 #11181C, control cards #162026, hover #1E2B33) */}
      <div className="overview-panel">
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#F1F5F9',
            margin: '0 0 4px 0',
            fontFamily: 'var(--font-heading)'
          }}>
            Administrative Control Center
          </h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontFamily: 'var(--font-heading)' }}>
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
                  padding: '14px 16px',
                  backgroundColor: '#162026',
                  border: '1px solid #1F2E35',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#2C3F49';
                  e.currentTarget.style.backgroundColor = '#1E2B33';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(52, 211, 153, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#1F2E35';
                  e.currentTarget.style.backgroundColor = '#162026';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#11181C',
                  border: '1px solid #1F2E35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  flexShrink: 0
                }}>
                  <Icon size={19} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9' }}>
                      {item.label}
                    </span>
                    {item.badge && item.badge !== 'Live' && (
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#10B981'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.35 }}>
                    {item.desc}
                  </p>
                </div>

                <RiArrowRightLine size={16} color="#64748B" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .overview-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .overview-header-banner {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding: 20px 24px;
          background-color: #11181C;
          border-radius: 12px;
          border: 1px solid #1F2E35;
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
          gap: 1.25rem;
        }

        .overview-kpi-card {
          background-color: #11181C;
          border: 1px solid #1F2E35;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          min-width: 0;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .overview-kpi-card:hover {
          border-color: #2C3F49;
          box-shadow: inset 0 1px 0 rgba(52, 211, 153, 0.15);
        }

        /* Recent Activity: 3 columns on desktop, responsive wrap below */
        .overview-activity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
        }

        .activity-subcard {
          background-color: #162026;
          border-radius: 8px;
          border: 1px solid #1F2E35;
          padding: 1rem;
          min-width: 0;
        }

        .activity-row:hover {
          background-color: #1E2B33 !important;
        }

        /* Control Center Grid */
        .overview-control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 10px;
        }

        .overview-panel {
          background-color: #11181C;
          border-radius: 12px;
          border: 1px solid #1F2E35;
          padding: 1.25rem;
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
            gap: 14px;
          }
          .overview-header-banner {
            padding: 16px;
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
            gap: 10px;
          }
          .overview-panel {
            padding: 16px;
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

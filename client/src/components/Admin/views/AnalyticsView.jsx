"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  RiBarChartLine,
  RiGroupLine,
  RiMessage3Line,
  RiHashtag,
  RiRefreshLine,
  RiCalendarLine,
  RiShieldCheckLine,
  RiLockLine,
  RiArrowRightUpLine,
  RiAttachmentLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminStates';

export default function AnalyticsView({ token, onNavigate }) {
  const [range, setRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Initialize custom dates with sensible defaults
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 14);
    setCustomEnd(end.toISOString().slice(0, 10));
    setCustomStart(start.toISOString().slice(0, 10));
  }, []);

  const fetchAnalytics = async (selectedRange, start, end, isManualRefresh = false) => {
    if (!token) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (!start || !end) {
          throw new Error('Please select both a start date and an end date.');
        }
        params.startDate = start;
        params.endDate = end;
      }
      const res = await api.getAdminAnalytics(token, params);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom') {
      fetchAnalytics(range);
    }
  }, [range, token]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    fetchAnalytics('custom', customStart, customEnd);
  };

  const handleRefresh = () => {
    fetchAnalytics(range, customStart, customEnd, true);
  };

  const summary = data?.summary || {
    totalNewUsers: 0,
    avgNewUsersPerDay: 0,
    totalMessagesSent: 0,
    totalMessagesWithAttachments: 0,
    avgMessagesPerDay: 0,
    peakMessageDay: { date: 'N/A', count: 0 },
    totalChannelsCreated: 0,
    totalGroupChannelsCreated: 0,
    totalDmChannelsCreated: 0,
    totalReportsSubmitted: 0
  };

  const trends = data?.trends || {
    users: [],
    messages: [],
    channels: [],
    reports: []
  };

  // Compute maximum values for scaling SVG charts
  const maxMessages = useMemo(() => {
    if (!trends.messages.length) return 10;
    const max = Math.max(...trends.messages.map(m => m.count));
    return max > 0 ? max : 10;
  }, [trends.messages]);

  const maxUsers = useMemo(() => {
    if (!trends.users.length) return 5;
    const max = Math.max(...trends.users.map(u => u.count));
    return max > 0 ? max : 5;
  }, [trends.users]);

  const maxChannels = useMemo(() => {
    if (!trends.channels.length) return 5;
    const max = Math.max(...trends.channels.map(c => c.count));
    return max > 0 ? max : 5;
  }, [trends.channels]);

  if (loading) {
    return <AdminLoadingState message="Aggregating platform growth trends..." />;
  }

  if (error && !data) {
    return <AdminErrorState message={error} onRetry={handleRefresh} />;
  }

  const hasAnyData = (summary.totalNewUsers > 0 || summary.totalMessagesSent > 0 || summary.totalChannelsCreated > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Analytics Header & Date Range Controls */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RiBarChartLine size={16} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Platform Analytics & Growth Trends
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Continuous time-series aggregation of active conversations, account signups, and channels.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: 'var(--bg-darkest)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Range Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px', fontWeight: 600 }}>
              Time Range:
            </span>
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'custom', label: 'Custom Range' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: range === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  backgroundColor: range === tab.id ? 'rgba(211, 255, 234, 0.1)' : 'var(--bg-darkest)',
                  color: range === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {data?.startDate && data?.endDate ? (
              <span>
                📅 {new Date(data.startDate).toLocaleDateString()} — {new Date(data.endDate).toLocaleDateString()} ({data.daysCount} {data.daysCount === 1 ? 'day' : 'days'})
              </span>
            ) : null}
          </div>
        </div>

        {/* Custom Date Form (Shown when custom is selected) */}
        {range === 'custom' && (
          <form
            onSubmit={handleApplyCustom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-darkest)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Start Date:</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: '0.8rem'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>End Date:</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: '0.8rem'
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent-primary)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '16px'
      }}>
        {/* Messages Volume Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Messages in Period
              </span>
              <RiMessage3Line size={18} color="#fbbf24" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {summary.totalMessagesSent}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>~{summary.avgMessagesPerDay}/day avg</span>
            <span>📎 {summary.totalMessagesWithAttachments} attachments</span>
          </div>
        </div>

        {/* User Registrations Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                New Registrations
              </span>
              <RiGroupLine size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {summary.totalNewUsers}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>~{summary.avgNewUsersPerDay}/day avg</span>
            <span>Total Accounts: {summary.platformTotalUsers}</span>
          </div>
        </div>

        {/* Channels Created Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Channels Created
              </span>
              <RiHashtag size={18} color="#60a5fa" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {summary.totalChannelsCreated}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>📢 {summary.totalGroupChannelsCreated} Groups</span>
            <span>💬 {summary.totalDmChannelsCreated} DMs</span>
          </div>
        </div>

        {/* Moderation Reports Filed Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Reports Submitted
              </span>
              <RiShieldCheckLine size={18} color={summary.totalReportsSubmitted > 0 ? '#ef4444' : 'var(--accent-success)'} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {summary.totalReportsSubmitted}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Compliance queue</span>
            {onNavigate && (
              <span style={{ cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 }} onClick={() => onNavigate('moderation')}>
                Moderation →
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(211, 255, 234, 0.05)',
        border: '1px solid var(--border-color)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <RiLockLine size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Data Privacy & Security Guarantee:</strong> Analytics metrics are calculated using anonymous aggregate MongoDB pipelines. Message contents, chat media, and private communications are never extracted or stored for analytics.
        </span>
      </div>

      {/* Chart 1: Daily Message Volume Trend */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Daily Message Volume Trend
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Messages dispatched across all active channels over the selected time window.
            </p>
          </div>
          {summary.peakMessageDay?.count > 0 && (
            <div style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              ⭐ Peak Day: {summary.peakMessageDay.date} ({summary.peakMessageDay.count} msgs)
            </div>
          )}
        </div>

        {trends.messages.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No message activity recorded in this period.
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
            <div style={{ minWidth: '400px', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingTop: '30px' }}>
              {trends.messages.map((item, idx) => {
                const heightPercent = Math.max(4, Math.round((item.count / maxMessages) * 100));
                const isHovered = hoveredPoint?.type === 'msg' && hoveredPoint?.index === idx;
                return (
                  <div
                    key={item.date}
                    onMouseEnter={() => setHoveredPoint({ type: 'msg', index: idx, ...item })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: `calc(${heightPercent}% + 8px)`,
                        backgroundColor: 'var(--bg-darkest)',
                        border: '1px solid var(--border-highlight)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        fontSize: '0.72rem',
                        pointerEvents: 'none'
                      }}>
                        <div style={{ fontWeight: 700, color: '#fbbf24' }}>{item.count} messages</div>
                        {item.withAttachments > 0 && (
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                            {item.withAttachments} with files
                          </div>
                        )}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{item.date}</div>
                      </div>
                    )}

                    {/* Bar */}
                    <div style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      backgroundColor: isHovered ? '#f59e0b' : 'rgba(245, 158, 11, 0.45)',
                      borderTop: '2px solid #fbbf24',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.15s ease'
                    }} />

                    {/* X-axis Date label (sampled if many days) */}
                    {(trends.messages.length <= 14 || idx % Math.ceil(trends.messages.length / 10) === 0) ? (
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-dim)',
                        marginTop: '8px',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.date.slice(5)}
                      </span>
                    ) : (
                      <span style={{ height: '14px', marginTop: '8px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: User Registration Curve & Channel Creation Trend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '20px'
      }}>
        {/* User Signups Trend */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              New User Registrations
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Daily account creations on the platform.
            </p>
          </div>

          {trends.users.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No registrations in this range.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: '300px', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '24px' }}>
                {trends.users.map((item, idx) => {
                  const heightPercent = Math.max(4, Math.round((item.count / maxUsers) * 100));
                  const isHovered = hoveredPoint?.type === 'user' && hoveredPoint?.index === idx;
                  return (
                    <div
                      key={item.date}
                      onMouseEnter={() => setHoveredPoint({ type: 'user', index: idx, ...item })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: `calc(${heightPercent}% + 8px)`,
                          backgroundColor: 'var(--bg-darkest)',
                          border: '1px solid var(--border-highlight)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap',
                          zIndex: 10
                        }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>+{item.count} users</span>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>{item.date}</div>
                        </div>
                      )}

                      <div style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${heightPercent}%`,
                        backgroundColor: isHovered ? 'var(--accent-primary)' : 'rgba(211, 255, 234, 0.4)',
                        borderTop: '2px solid var(--accent-primary)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 0.15s ease'
                      }} />

                      {(trends.users.length <= 10 || idx % Math.ceil(trends.users.length / 7) === 0) && (
                        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '6px' }}>
                          {item.date.slice(5)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Channel Creation Breakdown */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Channel Creations Breakdown
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Public group channels vs direct conversation pairs.
            </p>
          </div>

          {trends.channels.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No channels created in this range.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: '300px', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '24px' }}>
                {trends.channels.map((item, idx) => {
                  const heightPercent = Math.max(4, Math.round((item.count / maxChannels) * 100));
                  const isHovered = hoveredPoint?.type === 'chan' && hoveredPoint?.index === idx;
                  return (
                    <div
                      key={item.date}
                      onMouseEnter={() => setHoveredPoint({ type: 'chan', index: idx, ...item })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: `calc(${heightPercent}% + 8px)`,
                          backgroundColor: 'var(--bg-darkest)',
                          border: '1px solid var(--border-highlight)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap',
                          zIndex: 10
                        }}>
                          <div style={{ fontWeight: 700, color: '#60a5fa' }}>{item.count} total</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                            {item.groups || 0} groups, {item.dms || 0} DMs
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{item.date}</div>
                        </div>
                      )}

                      <div style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${heightPercent}%`,
                        backgroundColor: isHovered ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)',
                        borderTop: '2px solid #60a5fa',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 0.15s ease'
                      }} />

                      {(trends.channels.length <= 10 || idx % Math.ceil(trends.channels.length / 7) === 0) && (
                        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '6px' }}>
                          {item.date.slice(5)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


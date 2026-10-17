"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  RiFileList3Line,
  RiSearchLine,
  RiFilterLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiUserLine,
  RiHashtag,
  RiSettings4Line,
  RiMegaphoneLine,
  RiCloudLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiTimeLine,
  RiInformationLine,
  RiEyeLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminStates';

const ACTION_GROUPS = [
  { value: 'all', label: 'All Actions' },
  { value: 'ROLE_CHANGED', label: 'Role Changes' },
  { value: 'USER_SUSPENDED', label: 'User Suspensions' },
  { value: 'USER_RESTORED', label: 'User Restorations' },
  { value: 'USER_DEACTIVATE', label: 'Account Deactivations' },
  { value: 'CHANNEL_ARCHIVED', label: 'Channel Archived' },
  { value: 'CHANNEL_RESTORED', label: 'Channel Restored' },
  { value: 'CHANNEL_DELETED', label: 'Channel Deleted' },
  { value: 'MODERATION_ACTION', label: 'Moderation Enforcement' },
  { value: 'REPORT_STATUS_CHANGED', label: 'Report Status' },
  { value: 'REPORT_MESSAGE_INSPECTED', label: 'Flagged Message Context' },
  { value: 'APPEAL_RESOLVED', label: 'Appeals' },
  { value: 'SETTINGS_UPDATED', label: 'Platform Settings' },
  { value: 'ANNOUNCEMENT_CREATED', label: 'Announcement Created' },
  { value: 'ANNOUNCEMENT_PUBLISHED', label: 'Announcement Published' },
  { value: 'ANNOUNCEMENT_DELETED', label: 'Announcement Deleted' },
  { value: 'STORAGE_CLEANUP', label: 'Storage Cleanup' }
];

const TARGET_TYPES = [
  { value: 'all', label: 'All Targets' },
  { value: 'user', label: 'User Accounts' },
  { value: 'channel', label: 'Channels' },
  { value: 'message', label: 'Messages' },
  { value: 'report', label: 'Moderation Reports' },
  { value: 'setting', label: 'Platform Settings' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'media_file', label: 'Storage Media' }
];

function getActionBadgeStyle(action) {
  if (action.includes('SUSPEND') || action.includes('DEACTIVATE') || action.includes('DELETE')) {
    return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
  }
  if (action.includes('RESTORE') || action.includes('REACTIVATE') || action.includes('RESOLVED')) {
    return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
  }
  if (action.includes('ROLE') || action.includes('PERMISSION')) {
    return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
  }
  if (action.includes('SETTING')) {
    return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  }
  if (action.includes('ANNOUNCEMENT')) {
    return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
  }
  return { bg: 'rgba(211, 255, 234, 0.1)', color: 'var(--accent-primary)', border: 'rgba(211, 255, 234, 0.3)' };
}

function getTargetIcon(targetType) {
  switch (targetType) {
    case 'user': return <RiUserLine size={14} />;
    case 'channel': return <RiHashtag size={14} />;
    case 'message': return <RiFileList3Line size={14} />;
    case 'report': return <RiShieldCheckLine size={14} />;
    case 'setting': return <RiSettings4Line size={14} />;
    case 'announcement': return <RiMegaphoneLine size={14} />;
    case 'media_file': return <RiCloudLine size={14} />;
    default: return <RiInformationLine size={14} />;
  }
}

export default function AuditLogsView({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 25 });

  // Inspector Modal
  const [inspectLog, setInspectLog] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = {
        page,
        limit: 25,
        search: debouncedSearch || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
        result: resultFilter !== 'all' ? resultFilter : undefined
      };

      const res = await api.getAdminAuditLogs(token, params);
      setLogs(res.logs || []);
      setPagination(res.pagination || { total: 0, totalPages: 1, limit: 25 });
    } catch (err) {
      console.error('Audit logs fetch error:', err);
      setError(err.message || 'Failed to load administrative audit trail');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page, debouncedSearch, actionFilter, targetTypeFilter, resultFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Heading */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-success)'
            }}>
              <RiShieldCheckLine size={20} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Administrative Audit Logs
            </h1>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-success)',
              fontFamily: 'var(--font-mono)'
            }}>
              IMMUTABLE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Tamper-evident trail of administrative and moderation actions. All entries are cryptographically tied to authenticated server sessions and strictly read-only.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => fetchLogs(true)}
            disabled={loading || refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: (loading || refreshing) ? 'not-allowed' : 'pointer'
            }}
          >
            <RiRefreshLine size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 260px',
          minWidth: '220px'
        }}>
          <RiSearchLine size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search by action, actor, target or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Action Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RiFilterLine size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {ACTION_GROUPS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Target Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {TARGET_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Result Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success Only</option>
            <option value="failure">Failure Only</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(search || actionFilter !== 'all' || targetTypeFilter !== 'all' || resultFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setActionFilter('all');
              setTargetTypeFilter('all');
              setResultFilter('all');
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table Content */}
      {loading ? (
        <AdminLoadingState message="Querying immutable audit log database..." />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchLogs()} />
      ) : logs.length === 0 ? (
        <AdminEmptyState
          icon={RiFileList3Line}
          title="No Audit Records Found"
          description={
            search || actionFilter !== 'all' || targetTypeFilter !== 'all'
              ? 'No audit log entries match your active search filters.'
              : 'No administrative actions have been recorded yet.'
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setActionFilter('all');
            setTargetTypeFilter('all');
            setResultFilter('all');
          }}
        />
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card-secondary)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '12px 18px' }}>Timestamp</th>
                  <th style={{ padding: '12px 18px' }}>Administrator</th>
                  <th style={{ padding: '12px 18px' }}>Action</th>
                  <th style={{ padding: '12px 18px' }}>Target</th>
                  <th style={{ padding: '12px 18px' }}>Outcome</th>
                  <th style={{ padding: '12px 18px' }}>Reason / Notes</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badgeStyle = getActionBadgeStyle(log.action);
                  const isSuccess = log.result === 'success';

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          <RiTimeLine size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Actor */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getOptimizedImageUrl(log.actor?.avatar || `https://ui-avatars.com/api/?name=${log.actor?.username || 'Admin'}`, { width: 52, height: 52 })}
                            alt={log.actor?.username}
                            width="26"
                            height="26"
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              @{log.actor?.username || 'System'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: 500 }}>
                              {log.actor?.role || 'admin'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`
                        }}>
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {getTargetIcon(log.targetType)}
                          </span>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {log.targetLabel || log.targetId || log.targetType}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {log.targetType}
                        </div>
                      </td>

                      {/* Outcome */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isSuccess ? 'var(--accent-success)' : '#ef4444'
                        }}>
                          {isSuccess ? <RiCheckLine size={13} /> : <RiAlertLine size={13} />}
                          {log.result}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '14px 18px', maxWidth: '300px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem'
                        }}>
                          {log.reason || '—'}
                        </div>
                      </td>

                      {/* Details button */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setInspectLog(log)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-card-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RiEyeLine size={14} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-secondary)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              Showing {Math.min(pagination.total, (page - 1) * pagination.limit + 1)} - {Math.min(pagination.total, page * pagination.limit)} of {pagination.total} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: page <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: page >= pagination.totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Inspector Modal */}
      {inspectLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Audit Record Details
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {inspectLog.id}
                </span>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: 'var(--bg-darkest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Administrator</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>@{inspectLog.actor?.username || 'System'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ID: {inspectLog.actor?.id || 'system'}</div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-darkest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{new Date(inspectLog.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ISO: {inspectLog.createdAt}</div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-darkest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action Performed</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{inspectLog.action}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Target: {inspectLog.targetType}</div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-darkest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Entity</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{inspectLog.targetLabel || inspectLog.targetId || '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ID: {inspectLog.targetId || 'N/A'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Reason / Explanation</div>
                <div style={{ backgroundColor: 'var(--bg-darkest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                  {inspectLog.reason || 'No specific explanation provided.'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Safe Metadata & Operation Payload</div>
                <pre style={{
                  backgroundColor: 'var(--bg-darkest)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  margin: 0
                }}>
                  {JSON.stringify(inspectLog.meta || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'var(--bg-card-secondary)'
            }}>
              <button
                onClick={() => setInspectLog(null)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--bg-darkest)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


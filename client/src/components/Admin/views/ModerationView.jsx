"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  RiShieldCheckLine,
  RiAlertFill,
  RiSearchLine,
  RiFilter3Line,
  RiRefreshLine,
  RiUserLine,
  RiHashtag,
  RiMessage3Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import ReportDetailsDrawer from './ReportDetailsDrawer';
import AppealsModal from '../modals/AppealsModal';

export default function ModerationView({ token, currentAdminId }) {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Selected report for drawer
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Appeals modal
  const [isAppealsOpen, setIsAppealsOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ type, message }) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.getAdminReports(token, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        category: categoryFilter,
        targetType: targetTypeFilter,
        priority: priorityFilter,
        search: search.trim()
      });

      setReports(res.reports || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch moderation reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, pagination.page, pagination.limit, statusFilter, categoryFilter, targetTypeFilter, priorityFilter, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'pending':
      case 'open':
        return { label: 'Pending', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308' };
      case 'under_review':
        return { label: 'Under Review', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'resolved':
        return { label: 'Resolved', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'dismissed':
        return { label: 'Dismissed', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
      case 'appealed':
        return { label: 'Appealed', bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' };
      default:
        return { label: st, bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return { label: 'URGENT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'high':
        return { label: 'HIGH', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
      case 'medium':
        return { label: 'MEDIUM', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
      default:
        return { label: 'LOW', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Banner */}
      {toast && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease'
        }}>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px' }}
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      )}

      {/* Header & Appeals Shortcut */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            Moderation & Reports Queue
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Investigate reported content, user disputes, and enforce community safety guidelines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsAppealsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RiShieldCheckLine size={16} />
            Review Appeals
          </button>

          <button
            onClick={() => fetchReports(true)}
            disabled={loading || refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RiRefreshLine size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: '220px'
        }}>
          <RiSearchLine
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            placeholder="Search report reason, target user, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-darkest)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="appealed">Appealed</option>
        </select>

        {/* Target Type Filter */}
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-darkest)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Targets</option>
          <option value="user">Users</option>
          <option value="message">Messages</option>
          <option value="channel">Channels</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-darkest)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-darkest)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          <option value="spam">Spam</option>
          <option value="harassment">Harassment</option>
          <option value="impersonation">Impersonation</option>
          <option value="threats">Threats</option>
          <option value="inappropriate">Inappropriate</option>
          <option value="malicious_links">Malicious Links</option>
          <option value="suspicious">Suspicious</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Reports Table Container */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading moderation queue...
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', color: '#ef4444', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <RiShieldCheckLine size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Moderation Queue is Clear
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              No reports match your current filter settings.
            </div>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-darkest)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-dim)',
                  fontWeight: 600
                }}>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Target</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Reporter</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Assignee</th>
                  <th style={{ padding: '12px 16px' }}>Reported At</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const statusInfo = getStatusBadge(r.status);
                  const prioInfo = getPriorityBadge(r.priority);
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Priority */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: prioInfo.bg,
                          color: prioInfo.color
                        }}>
                          {prioInfo.label}
                        </span>
                      </td>

                      {/* Target */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {r.targetType === 'user' && <RiUserLine size={16} style={{ color: 'var(--accent-primary)' }} />}
                          {r.targetType === 'message' && <RiMessage3Line size={16} style={{ color: '#3b82f6' }} />}
                          {r.targetType === 'channel' && <RiHashtag size={16} style={{ color: '#10b981' }} />}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {r.targetType === 'user' && `@${r.reportedUser?.username || r.snapshot?.targetUsername || 'User'}`}
                              {r.targetType === 'message' && `Message from @${r.reportedUser?.username || r.snapshot?.senderUsername || 'Author'}`}
                              {r.targetType === 'channel' && `#${r.reportedChannel?.name || r.snapshot?.channelName || 'Channel'}`}
                            </div>
                            {r.targetType === 'message' && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                &quot;{r.snapshot?.messageContent || r.reportedMessage?.content || ''}&quot;
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {r.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                        @{r.reportedBy?.username || 'Confidential'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                        {r.assignedUsername ? `@${r.assignedUsername}` : <span style={{ opacity: 0.5 }}>Unassigned</span>}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReportId(r.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--btn-primary-text)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && reports.length > 0 && (
          <div style={{
            padding: '14px 20px',
            backgroundColor: 'var(--bg-darkest)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-dim)'
          }}>
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: pagination.page <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page <= 1 ? 0.5 : 1
                }}
              >
                <RiArrowLeftLine size={14} />
              </button>

              <span style={{ padding: '0 6px', fontWeight: 600, color: 'var(--text-main)' }}>
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: pagination.page >= pagination.totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page >= pagination.totalPages ? 0.5 : 1
                }}
              >
                <RiArrowRightLine size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Details Drawer */}
      <ReportDetailsDrawer
        isOpen={Boolean(selectedReportId)}
        reportId={selectedReportId}
        token={token}
        currentAdminId={currentAdminId}
        onClose={() => setSelectedReportId(null)}
        onReportUpdated={() => fetchReports(true)}
        onShowToast={showToast}
      />

      {/* Appeals Review Modal */}
      <AppealsModal
        isOpen={isAppealsOpen}
        token={token}
        onClose={() => setIsAppealsOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}


"use client";
import React, { useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiShieldCheckLine,
  RiAlertFill,
  RiInformationLine,
  RiUserLine,
  RiHashtag,
  RiMessage3Line,
  RiTimeLine,
  RiLockLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiErrorWarningLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import AdminConfirmModal from '../modals/AdminConfirmModal';

export default function ReportDetailsDrawer({
  isOpen,
  reportId,
  token,
  currentAdminId,
  onClose,
  onReportUpdated,
  onShowToast
}) {
  const [reportData, setReportData] = useState(null);
  const [targetHistory, setTargetHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modals state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'warn', 'suspend', 'restore', 'restrict_message', 'restrict_channel', 'resolve', 'dismiss'
    title: '',
    description: '',
    confirmText: '',
    confirmVariant: 'danger',
    requireReason: false,
    reasonPlaceholder: '',
    durationHours: 24,
    data: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportId || !token) {
      setReportData(null);
      setTargetHistory(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getAdminReportDetails(token, reportId)
      .then(res => {
        if (isMounted) {
          setReportData(res.report);
          setTargetHistory(res.targetHistory || null);
          setNotes(res.report?.notes || '');
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Failed to load report details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, reportId, token]);

  if (!isOpen) return null;

  const report = reportData;

  const handleClaim = async () => {
    try {
      setActionLoading(true);
      const res = await api.assignAdminReport(token, report.id, { assignToMe: true });
      setReportData(res.report);
      onShowToast && onShowToast({ type: 'success', message: 'Report claimed successfully' });
      onReportUpdated && onReportUpdated(res.report);
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const res = await api.updateAdminReportStatus(token, report.id, {
        status: report.status,
        notes: notes
      });
      setReportData(res.report);
      onShowToast && onShowToast({ type: 'success', message: 'Investigation notes saved' });
      onReportUpdated && onReportUpdated(res.report);
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', message: err.message });
    } finally {
      setSavingNotes(false);
    }
  };

  const openActionModal = (type, customConfig = {}) => {
    let title = '';
    let description = '';
    let confirmText = 'Confirm';
    let confirmVariant = 'danger';
    let requireReason = true;
    let reasonPlaceholder = 'State policy violation or rationale...';

    if (type === 'warn') {
      title = 'Issue Official User Warning';
      description = `Issue a formal recorded warning to @${report.reportedUser?.username || 'user'}. The warning count will increment and a real-time warning notice will be dispatched.`;
      confirmText = 'Issue Warning';
      confirmVariant = 'warning';
      reasonPlaceholder = 'Reason for official warning...';
    } else if (type === 'suspend') {
      title = 'Suspend User Account';
      description = `Suspend @${report.reportedUser?.username || 'user'}. The user will be immediately logged out and blocked from logging in during suspension.`;
      confirmText = 'Suspend Account';
      confirmVariant = 'danger';
      reasonPlaceholder = 'Reason for account suspension...';
    } else if (type === 'restore') {
      title = 'Restore Suspended Account';
      description = `Lift the suspension for @${report.reportedUser?.username || 'user'}, restoring their normal access.`;
      confirmText = 'Restore Account';
      confirmVariant = 'primary';
      requireReason = false;
    } else if (type === 'restrict_message') {
      title = 'Restrict & Mask Message Content';
      description = 'Mask this message in chat with "[Message removed by moderator]". Normal users will no longer see the original content.';
      confirmText = 'Restrict Message';
      confirmVariant = 'danger';
      reasonPlaceholder = 'Reason for restricting content...';
    } else if (type === 'restrict_channel') {
      title = 'Restrict / Archive Channel';
      description = `Restrict #${report.reportedChannel?.name || 'channel'}. Members will no longer be able to send new messages.`;
      confirmText = 'Restrict Channel';
      confirmVariant = 'danger';
      reasonPlaceholder = 'Reason for channel restriction...';
    } else if (type === 'resolve') {
      title = 'Mark Report as Resolved';
      description = 'Close this moderation report as resolved with an outcome record.';
      confirmText = 'Mark Resolved';
      confirmVariant = 'primary';
      requireReason = false;
    } else if (type === 'dismiss') {
      title = 'Dismiss Report';
      description = 'Dismiss this report if no violation was identified.';
      confirmText = 'Dismiss Report';
      confirmVariant = 'warning';
      requireReason = false;
    }

    setConfirmModal({
      isOpen: true,
      type,
      title,
      description,
      confirmText,
      confirmVariant,
      requireReason,
      reasonPlaceholder,
      durationHours: customConfig.durationHours || 24,
      ...customConfig
    });
  };

  const handleModalConfirm = async ({ reason }) => {
    const { type, durationHours } = confirmModal;
    try {
      setActionLoading(true);

      if (type === 'warn') {
        const targetUserId = report.reportedUser?.id || report.reportedUser?._id;
        await api.warnAdminUser(token, {
          userId: targetUserId,
          reason: reason || 'Violation of community guidelines',
          reportId: report.id
        });
        onShowToast && onShowToast({ type: 'success', message: 'Warning issued successfully' });
      } else if (type === 'suspend') {
        const targetUserId = report.reportedUser?.id || report.reportedUser?._id;
        await api.suspendAdminUser(token, {
          userId: targetUserId,
          reason: reason || 'Account suspended for rule violations',
          durationHours: durationHours || null,
          reportId: report.id
        });
        onShowToast && onShowToast({ type: 'success', message: 'Account suspended successfully' });
      } else if (type === 'restore') {
        const targetUserId = report.reportedUser?.id || report.reportedUser?._id;
        await api.restoreAdminUser(token, {
          userId: targetUserId,
          reason: reason || 'Restored by moderator',
          reportId: report.id
        });
        onShowToast && onShowToast({ type: 'success', message: 'Account restored successfully' });
      } else if (type === 'restrict_message') {
        const messageId = report.reportedMessage?.id || report.reportedMessage?._id;
        await api.restrictAdminMessage(token, {
          messageId,
          reason: reason || 'Content violated community rules',
          reportId: report.id
        });
        onShowToast && onShowToast({ type: 'success', message: 'Message restricted from chat' });
      } else if (type === 'restrict_channel') {
        const channelId = report.reportedChannel?.id || report.reportedChannel?._id;
        await api.restrictAdminChannel(token, {
          channelId,
          reason: reason || 'Channel restricted by moderation team',
          reportId: report.id
        });
        onShowToast && onShowToast({ type: 'success', message: 'Channel restricted successfully' });
      } else if (type === 'resolve') {
        await api.updateAdminReportStatus(token, report.id, {
          status: 'resolved',
          resolution: reason || 'Investigation completed',
          outcome: 'reviewed'
        });
        onShowToast && onShowToast({ type: 'success', message: 'Report marked as resolved' });
      } else if (type === 'dismiss') {
        await api.updateAdminReportStatus(token, report.id, {
          status: 'dismissed',
          resolution: reason || 'No violation found',
          outcome: 'dismissed_no_violation'
        });
        onShowToast && onShowToast({ type: 'info', message: 'Report dismissed' });
      }

      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      // Refresh report details
      const refreshed = await api.getAdminReportDetails(token, report.id);
      setReportData(refreshed.report);
      setTargetHistory(refreshed.targetHistory || null);
      onReportUpdated && onReportUpdated(refreshed.report);
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'pending':
      case 'open':
        return { label: 'Pending', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      case 'under_review':
        return { label: 'Under Review', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'resolved':
        return { label: 'Resolved', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'dismissed':
        return { label: 'Dismissed', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      case 'appealed':
        return { label: 'Appealed', bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { label: st, bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'transparent' };
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9998,
          backdropFilter: 'blur(3px)'
        }}
      />

      {/* Drawer Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.05em'
              }}>
                REPORT #{reportId ? reportId.slice(-6).toUpperCase() : ''}
              </span>
              {report && (
                <>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: getStatusBadge(report.status).bg,
                    color: getStatusBadge(report.status).color,
                    border: `1px solid ${getStatusBadge(report.status).border}`
                  }}>
                    {getStatusBadge(report.status).label}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: getPriorityBadge(report.priority).bg,
                    color: getPriorityBadge(report.priority).color
                  }}>
                    {getPriorityBadge(report.priority).label}
                  </span>
                </>
              )}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Moderation Investigation
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading report telemetry & investigation context...
            </div>
          )}

          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444'
            }}>
              {error}
            </div>
          )}

          {!loading && report && (
            <>
              {/* Target Section */}
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Target Information ({report.targetType})
                </div>

                {/* Target Type: User */}
                {report.targetType === 'user' && report.reportedUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={report.reportedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        @{report.reportedUser.username}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--border-color)',
                          color: 'var(--text-dim)'
                        }}>
                          Role: {report.reportedUser.role}
                        </span>
                        {report.reportedUser.warningCount > 0 && (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(234, 179, 8, 0.15)',
                            color: '#eab308'
                          }}>
                            {report.reportedUser.warningCount} {report.reportedUser.warningCount === 1 ? 'warning' : 'warnings'}
                          </span>
                        )}
                        {report.reportedUser.isSuspended && (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444'
                          }}>
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Type: Message */}
                {report.targetType === 'message' && (
                  <div>
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderLeft: '3px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      marginBottom: '8px',
                      fontStyle: 'italic'
                    }}>
                      &quot;{report.snapshot?.messageContent || report.reportedMessage?.content || '[Message Content]'}&quot;
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Author: @{report.snapshot?.senderUsername || report.reportedUser?.username || 'Unknown'} •
                      Channel ID: {report.snapshot?.channelId || report.reportedChannel?.id || 'Direct'}
                    </div>
                  </div>
                )}

                {/* Target Type: Channel */}
                {report.targetType === 'channel' && report.reportedChannel && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      #{report.reportedChannel.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Type: {report.reportedChannel.isGroup ? 'Group Channel' : 'Direct Message'} •
                      Status: {report.reportedChannel.isArchived ? 'Archived' : 'Active'}
                    </div>
                  </div>
                )}
              </div>

              {/* Report Statement / Description */}
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Report Reason & Category
                </div>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--border-color)', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                  {report.category}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {report.description || <span style={{ color: 'var(--text-dim)' }}>No additional written description provided.</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                  Submitted on {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Confidential Reporter Section */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <RiShieldCheckLine size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    Reporter: @{report.reportedBy?.username || 'Confidential'}
                  </span>
                  <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                    Reporter identity is strictly shielded and never exposed to the reported party.
                  </div>
                </div>
              </div>

              {/* Target History & Past Sanctions */}
              {targetHistory && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-darkest)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Target Account History
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Other Reports</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {targetHistory.previousReports?.length || 0}
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Recorded Audit Actions</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {targetHistory.auditLogs?.length || 0}
                      </div>
                    </div>
                  </div>

                  {targetHistory.auditLogs && targetHistory.auditLogs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {targetHistory.auditLogs.slice(0, 3).map(log => (
                        <div key={log.id} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{log.action}: {log.reason}</span>
                          <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Investigation Assignment & Status */}
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Moderator Workflow
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    Assigned: <strong style={{ color: 'var(--text-main)' }}>{report.assignedUsername ? `@${report.assignedUsername}` : 'Unassigned'}</strong>
                  </div>
                  {!report.assignedUsername && (
                    <button
                      onClick={handleClaim}
                      disabled={actionLoading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--btn-primary-text)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Claim Report
                    </button>
                  )}
                </div>

                {/* Resolution controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {report.status !== 'under_review' && (
                    <button
                      onClick={() => handleModalConfirm({ reason: 'Investigation started' })}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Mark Under Review
                    </button>
                  )}
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => openActionModal('resolve')}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>
                  )}
                  {report.status !== 'dismissed' && (
                    <button
                      onClick={() => openActionModal('dismiss')}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        color: '#94a3b8',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>

                {/* Moderator Notes */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Staff Investigation Notes
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter confidential notes, rationale, or investigation findings..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'var(--border-color)',
                        color: 'var(--text-main)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Enforcement Sanction Buttons */}
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Enforcement Actions
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Issue Warning (if user target) */}
                  {report.reportedUser && (
                    <button
                      onClick={() => openActionModal('warn')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RiAlertFill size={16} />
                      Issue Official Warning
                    </button>
                  )}

                  {/* Suspend or Restore (if user target) */}
                  {report.reportedUser && !report.reportedUser.isSuspended && (
                    <button
                      onClick={() => openActionModal('suspend')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RiLockLine size={16} />
                      Suspend Account (24h / Indefinite)
                    </button>
                  )}

                  {report.reportedUser && report.reportedUser.isSuspended && (
                    <button
                      onClick={() => openActionModal('restore')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RiCheckLine size={16} />
                      Restore Suspended Account
                    </button>
                  )}

                  {/* Restrict Message */}
                  {report.targetType === 'message' && !report.reportedMessage?.isRestricted && (
                    <button
                      onClick={() => openActionModal('restrict_message')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RiCloseCircleLine size={16} />
                      Restrict & Mask Message
                    </button>
                  )}

                  {/* Restrict Channel */}
                  {report.targetType === 'channel' && !report.reportedChannel?.isRestricted && (
                    <button
                      onClick={() => openActionModal('restrict_channel')}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RiLockLine size={16} />
                      Restrict & Archive Channel
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        requireReason={confirmModal.requireReason}
        reasonPlaceholder={confirmModal.reasonPlaceholder}
        onConfirm={handleModalConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={actionLoading}
      />
    </>
  );
}


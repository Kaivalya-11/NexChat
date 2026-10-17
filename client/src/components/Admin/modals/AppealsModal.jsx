"use client";
import React, { useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiAlertFill
} from 'react-icons/ri';
import * as api from '../../../services/api';
import AdminConfirmModal from './AdminConfirmModal';

export default function AppealsModal({
  isOpen,
  token,
  onClose,
  onShowToast
}) {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [activeDecision, setActiveDecision] = useState(null); // { userId, appealId, decision: 'approved' | 'rejected' }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppeals = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.getAdminAppeals(token, { status: filter });
      setAppeals(res.appeals || []);
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAppeals();
    }
  }, [isOpen, filter, token]);

  if (!isOpen) return null;

  const handleConfirmDecision = async ({ reason }) => {
    if (!activeDecision) return;
    try {
      setActionLoading(true);
      const res = await api.decideAdminAppeal(token, activeDecision.userId, activeDecision.appealId, {
        decision: activeDecision.decision,
        notes: reason || ''
      });
      onShowToast && onShowToast({ type: 'success', message: res.message });
      setActiveDecision(null);
      await fetchAppeals();
    } catch (err) {
      onShowToast && onShowToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden'
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Suspension Appeals Review
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Review statements from suspended users requesting account reinstatement
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Appeals' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filter === t.id ? 'var(--accent-primary)' : 'transparent',
                color: filter === t.id ? 'var(--btn-primary-text)' : 'var(--text-dim)'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              Loading user appeals...
            </div>
          )}

          {!loading && appeals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
              <RiShieldCheckLine size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                No appeals found
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                There are currently no {filter !== 'all' ? filter : ''} appeals in the queue.
              </div>
            </div>
          )}

          {!loading && appeals.map(a => (
            <div
              key={a.appealId}
              style={{
                padding: '18px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    @{a.username}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                    ({a.email})
                  </span>
                </div>

                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor:
                    a.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' :
                    a.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' :
                    'rgba(234, 179, 8, 0.15)',
                  color:
                    a.status === 'approved' ? '#22c55e' :
                    a.status === 'rejected' ? '#ef4444' :
                    '#eab308'
                }}>
                  {a.status.toUpperCase()}
                </span>
              </div>

              {/* Suspension Context */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Suspension Reason: <strong style={{ color: 'var(--text-main)' }}>{a.suspendedReason || 'Administrative action'}</strong>
                {a.suspendedUntil && (
                  <span> • Expires: {new Date(a.suspendedUntil).toLocaleString()}</span>
                )}
              </div>

              {/* Appeal Statement */}
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.5,
                borderLeft: '3px solid var(--accent-primary)'
              }}>
                &quot;{a.statement}&quot;
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Submitted on {new Date(a.submittedAt).toLocaleString()}
                </span>

                {/* Actions for pending appeals */}
                {a.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setActiveDecision({
                        userId: a.userId,
                        appealId: a.appealId,
                        username: a.username,
                        decision: 'rejected'
                      })}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reject Appeal
                    </button>
                    <button
                      onClick={() => setActiveDecision({
                        userId: a.userId,
                        appealId: a.appealId,
                        username: a.username,
                        decision: 'approved'
                      })}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Approve & Reinstate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(activeDecision)}
        title={activeDecision?.decision === 'approved' ? 'Approve Appeal & Lift Suspension' : 'Reject Appeal'}
        description={
          activeDecision?.decision === 'approved'
            ? `Approving this appeal will immediately restore account access for @${activeDecision?.username}.`
            : `Rejecting this appeal will keep the suspension active for @${activeDecision?.username}.`
        }
        confirmText={activeDecision?.decision === 'approved' ? 'Approve & Restore' : 'Reject Appeal'}
        confirmVariant={activeDecision?.decision === 'approved' ? 'primary' : 'danger'}
        requireReason={false}
        reasonPlaceholder="Optional staff notes on this decision..."
        onConfirm={handleConfirmDecision}
        onClose={() => setActiveDecision(null)}
        isLoading={actionLoading}
      />
    </>
  );
}


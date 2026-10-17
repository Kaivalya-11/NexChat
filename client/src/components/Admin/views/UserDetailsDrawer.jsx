"use client";
import React, { useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiShieldUserFill,
  RiTimeLine,
  RiHashtag,
  RiMessage3Line,
  RiUserFollowLine,
  RiShieldFlashLine,
  RiForbidLine,
  RiCheckDoubleLine,
  RiAlertFill,
  RiInformationLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import { AdminLoadingState } from '../AdminStates';

export default function UserDetailsDrawer({
  userId,
  currentAdminId,
  token,
  onClose,
  onUserUpdated,
  showNotification
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSelf = Boolean(currentAdminId && user && currentAdminId.toString() === user.id.toString());

  useEffect(() => {
    let isMounted = true;
    if (userId && token) {
      api.getAdminUserDetails(token, userId)
        .then(res => {
          if (isMounted) {
            setUser(res.user);
            setSelectedRole(res.user.role || (res.user.isAdmin ? 'admin' : 'user'));
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to load user profile');
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [userId, token]);

  const handleRoleChangeConfirm = async (reason) => {
    setIsSubmitting(true);
    try {
      const res = await api.updateAdminUserRole(token, user.id, selectedRole, reason);
      setUser(prev => ({ ...prev, role: res.user.role, isAdmin: res.user.isAdmin }));
      setRoleModalOpen(false);
      showNotification(`Role for @${user.username} updated to ${selectedRole}`, 'success');
      if (onUserUpdated) onUserUpdated(res.user);
    } catch (err) {
      showNotification(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusActionConfirm = async (reason) => {
    if (!pendingStatusAction) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateAdminUserStatus(token, user.id, pendingStatusAction, reason);
      setUser(prev => ({
        ...prev,
        isSuspended: res.user.isSuspended,
        suspendedAt: res.user.suspendedAt,
        suspendedReason: res.user.suspendedReason,
        isDeactivated: res.user.isDeactivated,
        deactivatedAt: res.user.deactivatedAt
      }));
      setStatusModalOpen(false);
      setPendingStatusAction(null);
      showNotification(`User @${user.username} status updated (${pendingStatusAction})`, 'success');
      if (onUserUpdated) onUserUpdated(res.user);
    } catch (err) {
      showNotification(err.message || 'Failed to update status', 'error');
    } finally {
      setIsSubmitting(false);
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 110
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
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiShieldUserFill size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              User Profile & Audit
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <AdminLoadingState message="Fetching user records..." />
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
              <RiAlertFill size={32} style={{ marginBottom: '12px' }} />
              <p>{error}</p>
            </div>
          ) : user && (
            <>
              {/* Profile Card */}
              <div style={{
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <img
                  src={getOptimizedImageUrl(user.avatar || `https://ui-avatars.com/api/?name=${user.username}`, { width: 128, height: 128 })}
                  alt={user.username}
                  width="64"
                  height="64"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--border-highlight)'
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      @{user.username}
                    </h4>
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      backgroundColor: user.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : user.role === 'moderator' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: user.role === 'admin' ? 'var(--accent-warning)' : user.role === 'moderator' ? '#60a5fa' : 'var(--text-dim)'
                    }}>
                      {user.role}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      color: user.isSuspended ? '#ef4444' : user.isDeactivated ? 'var(--accent-warning)' : 'var(--accent-success)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: user.isSuspended ? '#ef4444' : user.isDeactivated ? 'var(--accent-warning)' : 'var(--accent-success)'
                      }} />
                      {user.isSuspended ? 'Suspended' : user.isDeactivated ? 'Deactivated' : 'Active Account'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      Status: {user.status || 'offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Self-lockout alert if editing own account */}
              {isSelf && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <RiInformationLine size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>This is your current administrator account.</strong>
                    <br />
                    Self-demotion and self-suspension are locked to prevent administrative lockout.
                  </div>
                </div>
              )}

              {/* Suspension Banner if Suspended */}
              {user.isSuspended && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                  color: '#fca5a5'
                }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <RiForbidLine size={16} /> Account Suspended
                  </div>
                  <div>Reason: {user.suspendedReason || 'Administrative decision'}</div>
                  {user.suspendedAt && (
                    <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                      Suspended on {new Date(user.suspendedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Activity Metadata Grid */}
              <div>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Platform Telemetry
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiHashtag size={18} color="var(--accent-secondary)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.channelCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Channels</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiMessage3Line size={18} color="var(--accent-warning)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.messageCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Messages</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiUserFollowLine size={18} color="var(--accent-primary)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.friendsCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Friends</div>
                  </div>
                </div>
              </div>

              {/* Account Timestamps */}
              <div style={{
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.825rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.75rem' }}>{user.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered:</span>
                  <span style={{ color: 'var(--text-main)' }}>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Activity:</span>
                  <span style={{ color: 'var(--text-main)' }}>{user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</span>
                </div>
              </div>

              {/* Administrative Actions */}
              <div style={{
                marginTop: 'auto',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Administrative Controls
                </h5>

                {/* Role Switcher */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Assigned Role
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={selectedRole}
                      disabled={isSelf}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        backgroundColor: 'var(--bg-darkest)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        cursor: isSelf ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="user">Regular User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                    </select>

                    <button
                      onClick={() => setRoleModalOpen(true)}
                      disabled={isSelf || selectedRole === user.role}
                      style={{
                        padding: '9px 16px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--btn-primary-text)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: isSelf || selectedRole === user.role ? 'not-allowed' : 'pointer',
                        opacity: isSelf || selectedRole === user.role ? 0.5 : 1
                      }}
                    >
                      Apply Role
                    </button>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {user.isSuspended ? (
                    <button
                      onClick={() => {
                        setPendingStatusAction('restore');
                        setStatusModalOpen(true);
                      }}
                      disabled={isSelf}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--accent-success)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: isSelf ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <RiCheckDoubleLine size={16} />
                      Restore Account
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPendingStatusAction('suspend');
                        setStatusModalOpen(true);
                      }}
                      disabled={isSelf}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.5 : 1
                      }}
                    >
                      <RiForbidLine size={16} />
                      Suspend Account
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPendingStatusAction(user.isDeactivated ? 'reactivate' : 'deactivate');
                      setStatusModalOpen(true);
                    }}
                    disabled={isSelf}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-darkest)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                      opacity: isSelf ? 0.5 : 1
                    }}
                  >
                    {user.isDeactivated ? 'Reactivate' : 'Deactivate'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      <AdminConfirmModal
        isOpen={roleModalOpen}
        title="Confirm Role Modification"
        description={`Are you sure you want to change @${user?.username}'s role to "${selectedRole}"? This will modify their administrative permissions immediately.`}
        confirmText="Update Role"
        confirmVariant={selectedRole === 'admin' ? 'warning' : 'primary'}
        requireReason={true}
        reasonPlaceholder="Reason for changing user permissions..."
        isLoading={isSubmitting}
        onConfirm={handleRoleChangeConfirm}
        onClose={() => setRoleModalOpen(false)}
      />

      {/* Account Status Confirmation Modal */}
      <AdminConfirmModal
        isOpen={statusModalOpen}
        title={`Confirm Account ${pendingStatusAction ? pendingStatusAction.charAt(0).toUpperCase() + pendingStatusAction.slice(1) : ''}`}
        description={
          pendingStatusAction === 'suspend'
            ? `Suspending @${user?.username} will immediately revoke their ability to log in and participate in channels.`
            : pendingStatusAction === 'restore'
            ? `Restoring @${user?.username} will reactivate their login and messaging privileges.`
            : `Are you sure you want to ${pendingStatusAction} @${user?.username}'s account?`
        }
        confirmText={pendingStatusAction ? pendingStatusAction.charAt(0).toUpperCase() + pendingStatusAction.slice(1) : 'Confirm'}
        confirmVariant={pendingStatusAction === 'suspend' ? 'danger' : 'warning'}
        requireReason={pendingStatusAction === 'suspend'}
        reasonPlaceholder="State the policy violation or reason..."
        isLoading={isSubmitting}
        onConfirm={handleStatusActionConfirm}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatusAction(null);
        }}
      />
    </>
  );
}


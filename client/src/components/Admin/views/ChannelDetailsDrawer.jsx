"use client";
import React, { useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiHashtag,
  RiMessage3Line,
  RiGroupLine,
  RiShieldCheckLine,
  RiArchiveLine,
  RiDeleteBin6Line,
  RiTimeLine,
  RiInformationLine,
  RiAlertFill
} from 'react-icons/ri';
import * as api from '../../../services/api';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import { AdminLoadingState } from '../AdminStates';

export default function ChannelDetailsDrawer({
  channelId,
  token,
  onClose,
  onChannelUpdated,
  onChannelDeleted,
  showNotification
}) {
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (channelId && token) {
      api.getAdminChannelDetails(token, channelId)
        .then(res => {
          if (isMounted) {
            setChannel(res.channel);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to load channel details');
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [channelId, token]);

  const handleArchiveConfirm = async (reason) => {
    setIsSubmitting(true);
    const targetState = !channel.isArchived;
    try {
      const res = await api.archiveAdminChannel(token, channel.id, targetState, reason);
      setChannel(prev => ({ ...prev, isArchived: targetState }));
      setArchiveModalOpen(false);
      showNotification(`Channel #${channel.name} has been ${targetState ? 'archived' : 'restored'}`, 'success');
      if (onChannelUpdated) onChannelUpdated(res.channel);
    } catch (err) {
      showNotification(err.message || 'Failed to update channel archive state', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (reason) => {
    setIsSubmitting(true);
    try {
      await api.deleteAdminChannel(token, channel.id, channel.name, reason);
      setDeleteModalOpen(false);
      showNotification(`Channel #${channel.name} was permanently deleted`, 'success');
      if (onChannelDeleted) onChannelDeleted(channel.id);
      onClose();
    } catch (err) {
      showNotification(err.message || 'Failed to delete channel', 'error');
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
          maxWidth: '480px',
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
            <RiHashtag size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Channel Inspection
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
            <AdminLoadingState message="Fetching channel structure..." />
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
              <RiAlertFill size={32} style={{ marginBottom: '12px' }} />
              <p>{error}</p>
            </div>
          ) : channel && (
            <>
              {/* Channel Summary Card */}
              <div style={{
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                        {channel.isGroup ? `#${channel.name}` : channel.name}
                      </h4>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor: channel.isGroup ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: channel.isGroup ? 'var(--accent-success)' : '#60a5fa'
                      }}>
                        {channel.isGroup ? 'Group Channel' : 'Direct Message'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                      {channel.description || 'No description provided.'}
                    </p>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: channel.isArchived ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: channel.isArchived ? 'var(--accent-warning)' : 'var(--accent-success)',
                    whiteSpace: 'nowrap'
                  }}>
                    {channel.isArchived ? 'Archived' : 'Active'}
                  </span>
                </div>

                {channel.isArchived && (
                  <div style={{
                    marginTop: '14px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: '#fcd34d'
                  }}>
                    This channel is archived. Regular chat posting is disabled.
                  </div>
                )}
              </div>

              {/* Telemetry Stats */}
              <div>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Channel Telemetry
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiGroupLine size={18} color="var(--accent-primary)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{channel.memberCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Members</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiShieldCheckLine size={18} color="var(--accent-secondary)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{channel.adminCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admins</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                    <RiMessage3Line size={18} color="var(--accent-warning)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{channel.messageCount || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Messages</div>
                  </div>
                </div>
              </div>

              {/* Ownership & Details */}
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
                  <span style={{ color: 'var(--text-muted)' }}>Channel ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.75rem' }}>{channel.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Created By / Owner:</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {channel.owner ? `@${channel.owner.username}` : 'System / Auto-created'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Created Date:</span>
                  <span style={{ color: 'var(--text-main)' }}>{new Date(channel.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Activity:</span>
                  <span style={{ color: 'var(--text-main)' }}>{new Date(channel.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Members Listing */}
              <div>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Channel Members ({channel.members ? channel.members.length : 0})
                </h5>

                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-darkest)'
                }}>
                  {channel.members && channel.members.length > 0 ? (
                    channel.members.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          fontSize: '0.825rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={m.avatar || `https://ui-avatars.com/api/?name=${m.username}`}
                            alt={m.username}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            @{m.username}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase'
                        }}>
                          {m.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No members registered in this room.
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Actions */}
              <div style={{
                marginTop: 'auto',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Administrative Actions
                </h5>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setArchiveModalOpen(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      backgroundColor: channel.isArchived ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${channel.isArchived ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: channel.isArchived ? 'var(--accent-success)' : 'var(--accent-warning)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RiArchiveLine size={16} />
                    {channel.isArchived ? 'Unarchive Channel' : 'Archive Channel'}
                  </button>

                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RiDeleteBin6Line size={16} />
                    Delete Channel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Archive Modal */}
      <AdminConfirmModal
        isOpen={archiveModalOpen}
        title={channel?.isArchived ? 'Unarchive Channel' : 'Archive Channel'}
        description={
          channel?.isArchived
            ? `Restoring #${channel?.name} will allow members to post messages again.`
            : `Archiving #${channel?.name} will make it read-only for all members. Existing messages are preserved.`
        }
        confirmText={channel?.isArchived ? 'Unarchive' : 'Archive'}
        confirmVariant={channel?.isArchived ? 'primary' : 'warning'}
        requireReason={true}
        reasonPlaceholder="Optional reason for audit records..."
        isLoading={isSubmitting}
        onConfirm={handleArchiveConfirm}
        onClose={() => setArchiveModalOpen(false)}
      />

      {/* Delete Modal with Exact Keyword Confirmation */}
      <AdminConfirmModal
        isOpen={deleteModalOpen}
        title="Permanently Delete Channel"
        description={`This action CANNOT be undone. Channel #${channel?.name} and all associated messages will be permanently deleted from the database.`}
        confirmText="Permanently Delete"
        confirmVariant="danger"
        requiresInputText={channel?.name}
        requireReason={true}
        reasonPlaceholder="Reason for deleting channel..."
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </>
  );
}


"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as api from '../../services/api';
import {
  RiCloseLine,
  RiDeleteBin6Line,
  RiHashtag,
  RiMessage3Fill,
  RiShieldStarLine,
  RiUserAddLine,
  RiUserMinusLine,
  RiEditLine,
  RiCheckLine,
  RiShieldCheckFill,
  RiUser3Line
} from 'react-icons/ri';
import ConfirmModal from '../UI/ConfirmModal';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export default function ChannelSettingsModal({ channel, onClose }) {
  const { removeChannel, refreshChannels } = useChat();
  const { user, token } = useAuth();
  const { onlineUsers, socket } = useSocket() || {};

  const isGroup = Boolean(channel?.isGroup);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'members'

  // Channel details state
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit channel state
  const [channelName, setChannelName] = useState(channel?.name || '');
  const [channelDesc, setChannelDesc] = useState(channel?.description || '');
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add member state
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Ownership & Admin rights
  const isOwner = details ? details.owner === user.id : channel.owner === user.id;
  const isAdmin = details ? (details.admins?.includes(user.id) || isOwner) : (channel.admins?.includes(user.id) || isOwner);

  // Load channel details from backend
  const loadChannelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getChannelDetails(token, channel.id);
      setDetails(data);
      setChannelName(data.name || '');
      setChannelDesc(data.description || '');

      // If group, load potential users to add
      if (data.isGroup) {
        try {
          const allUsers = await api.getAllUsers(token);
          const currentMemberIds = new Set(data.members.map(m => m.id));
          const notInChannel = (allUsers || []).filter(u => !currentMemberIds.has(u.id));
          setAvailableUsers(notInChannel);
        } catch (uErr) {
          console.warn('Could not load non-members list:', uErr);
        }
      }
    } catch (err) {
      console.error('Failed to load channel details:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token, channel.id]);

  useEffect(() => {
    loadChannelData();
  }, [loadChannelData]);

  // Handle Save Channel Details
  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    if (!channelName.trim()) return;

    try {
      setSavingDetails(true);
      await api.updateChannel(token, channel.id, {
        name: channelName.trim(),
        description: channelDesc.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await refreshChannels();
      if (socket && typeof socket.emit === 'function') {
        socket.emit('channel-updated', { channelId: channel.id });
      }
    } catch (err) {
      alert(err.message || 'Failed to save channel details');
    } finally {
      setSavingDetails(false);
    }
  };

  // Handle Add Member
  const handleAddMember = async () => {
    if (!selectedAddUserId) return;
    try {
      setAddingMember(true);
      await api.addChannelMember(token, channel.id, selectedAddUserId);
      setSelectedAddUserId('');
      await loadChannelData();
      await refreshChannels();
      if (socket && typeof socket.emit === 'function') {
        socket.emit('channel-updated', { channelId: channel.id });
      }
    } catch (err) {
      alert(err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (targetUserId, targetUsername) => {
    setConfirmConfig({
      title: 'Remove Member',
      message: `Are you sure you want to remove @${targetUsername} from #${details?.name || channel.name}?`,
      confirmText: 'Remove',
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.removeChannelMember(token, channel.id, targetUserId);
          await loadChannelData();
          await refreshChannels();
          if (socket && typeof socket.emit === 'function') {
            socket.emit('channel-updated', { channelId: channel.id });
          }
        } catch (err) {
          alert(err.message || 'Failed to remove member');
        }
      }
    });
  };

  // Handle Toggle Admin Status
  const handleToggleAdmin = async (targetUserId, currentlyAdmin) => {
    try {
      if (currentlyAdmin) {
        await api.removeChannelAdmin(token, channel.id, targetUserId);
      } else {
        await api.addChannelAdmin(token, channel.id, targetUserId);
      }
      await loadChannelData();
      await refreshChannels();
      if (socket && typeof socket.emit === 'function') {
        socket.emit('channel-updated', { channelId: channel.id });
      }
    } catch (err) {
      alert(err.message || 'Failed to update admin status');
    }
  };

  // Handle Leave or Delete
  const handleDeleteOrLeave = () => {
    const actionText = (!isGroup || isOwner) ? 'delete' : 'leave';
    const title = actionText === 'leave' ? 'Leave Channel' : (!isGroup ? 'Delete Conversation' : 'Delete Channel');
    const message = actionText === 'leave'
      ? `Are you sure you want to leave #${details?.name || channel.name}?`
      : `Are you sure you want to permanently delete this ${!isGroup ? 'chat conversation' : `channel (#${details?.name || channel.name})`}?`;

    setConfirmConfig({
      title,
      message,
      confirmText: actionText === 'leave' ? 'Leave' : 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await removeChannel(channel.id);
          onClose();
        } catch (err) {
          alert(err.message || 'Action failed');
        }
      }
    });
  };

  // Find DM other user if this is a direct message
  const otherMember = !isGroup && details?.members
    ? details.members.find(m => m.id !== user.id) || details.members[0]
    : null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <motion.div
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color)',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              {isGroup ? <RiHashtag size={20} /> : <RiMessage3Fill size={18} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {isGroup ? 'Channel Settings' : 'Chat Settings'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isGroup ? `#${details?.name || channel.name}` : `Direct Message with @${otherMember?.username || 'User'}`}
              </span>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close settings modal"
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

        {/* Tab Selector for Group Channels */}
        {isGroup && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-darkest)'
          }}>
            <button
              onClick={() => setActiveTab('general')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'general' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'general' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'general' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              General Info
            </button>
            <button
              onClick={() => setActiveTab('members')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'members' ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'members' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              Members ({details?.members?.length || channel.members?.length || 0})
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading conversation settings...
            </div>
          ) : error ? (
            <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem' }}>
              {error}
            </div>
          ) : !isGroup ? (
            /* ─── DIRECT MESSAGE (CHAT SETTINGS) VIEW ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {otherMember ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-darkest)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getOptimizedImageUrl(otherMember.avatar || `https://ui-avatars.com/api/?name=${otherMember.username}`, { width: 112, height: 112 })}
                      alt={otherMember.username}
                      width="56"
                      height="56"
                      loading="lazy"
                      decoding="async"
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: otherMember.status === 'online' ? 'var(--accent-success)' : otherMember.status === 'away' ? 'var(--accent-warning)' : 'var(--text-dim)',
                      border: '2px solid var(--bg-darkest)'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        @{otherMember.username}
                      </span>
                      {otherMember.isAdmin && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)', fontWeight: 700 }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {otherMember.statusText || (otherMember.status === 'online' ? 'Available' : 'Offline')}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Direct conversation with user.
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  Conversation Options
                </h4>
                <button
                  onClick={handleDeleteOrLeave}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <RiDeleteBin6Line size={18} />
                  Delete Direct Message Chat
                </button>
              </div>
            </div>
          ) : activeTab === 'general' ? (
            /* ─── GROUP CHANNEL GENERAL TAB ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Channel Name
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>#</span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isAdmin}
                    value={channelDesc}
                    onChange={(e) => setChannelDesc(e.target.value)}
                    placeholder="Add channel topic or description..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-darkest)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={savingDetails}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--bg-darkest)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: savingDetails ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RiEditLine size={16} />
                      {savingDetails ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saveSuccess && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RiCheckLine size={16} /> Saved!
                      </span>
                    )}
                  </div>
                )}
              </form>

              {/* Danger Zone */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#ef4444', fontWeight: 700 }}>
                  Danger Zone
                </h4>
                <button
                  onClick={handleDeleteOrLeave}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <RiDeleteBin6Line size={18} />
                  {isOwner ? 'Delete Channel' : 'Leave Channel'}
                </button>
              </div>
            </div>
          ) : (
            /* ─── GROUP CHANNEL MEMBERS TAB ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Add Member Form (Admins only) */}
              {isAdmin && availableUsers.length > 0 && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-darkest)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <select
                    value={selectedAddUserId}
                    onChange={(e) => setSelectedAddUserId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select a user to add...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>@{u.username}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedAddUserId || addingMember}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--bg-darkest)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (!selectedAddUserId || addingMember) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RiUserAddLine size={16} />
                    Add
                  </button>
                </div>
              )}

              {/* Members List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(details?.members || []).map(m => {
                  const memberIsOwner = details.owner === m.id;
                  const memberIsAdmin = details.admins?.includes(m.id) || memberIsOwner;
                  const isCurrent = m.id === user.id;

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-darkest)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <img
                          src={getOptimizedImageUrl(m.avatar || `https://ui-avatars.com/api/?name=${m.username}`, { width: 64, height: 64 })}
                          alt={m.username}
                          width="32"
                          height="32"
                          loading="lazy"
                          decoding="async"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              @{m.username} {isCurrent && '(You)'}
                            </span>
                            {memberIsOwner ? (
                              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                                OWNER
                              </span>
                            ) : memberIsAdmin ? (
                              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 700 }}>
                                ADMIN
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.statusText || (m.status === 'online' ? 'Active' : 'Offline')}
                          </div>
                        </div>
                      </div>

                      {/* Admin Controls */}
                      {isAdmin && !isCurrent && !memberIsOwner && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleAdmin(m.id, memberIsAdmin)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: memberIsAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: memberIsAdmin ? '#ef4444' : '#60a5fa',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {memberIsAdmin ? 'Demote' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id, m.username)}
                            title="Remove Member"
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                          >
                            <RiUserMinusLine size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        isDanger={confirmConfig?.isDanger}
        onConfirm={() => {
          if (confirmConfig?.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig(null);
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </motion.div>
  );
}

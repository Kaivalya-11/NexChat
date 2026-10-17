"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  RiSearch2Line,
  RiRefreshLine,
  RiHashtag,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArchiveLine,
  RiCheckLine,
  RiAlertFill,
  RiCloseLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminEmptyState, AdminErrorState } from '../AdminStates';
import ChannelDetailsDrawer from './ChannelDetailsDrawer';

export default function ChannelsView({ token }) {
  const [channels, setChannels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Selected Channel for details drawer
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchChannels = useCallback(async (pageToLoad = 1, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getAdminChannels(token, {
        page: pageToLoad,
        limit: 10,
        search,
        type: typeFilter,
        status: statusFilter
      });
      setChannels(res.channels);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load channels:', err);
      setError(err.message || 'Failed to retrieve channels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, search, typeFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      api.getAdminChannels(token, {
        page: 1,
        limit: 10,
        search,
        type: typeFilter,
        status: statusFilter
      })
        .then(res => {
          if (isMounted) {
            setChannels(res.channels);
            setPagination(res.pagination);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to retrieve channels');
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [token, search, typeFilter, statusFilter]);

  const handleChannelUpdated = (updatedChannel) => {
    setChannels(prev => prev.map(c => c.id === updatedChannel.id ? { ...c, ...updatedChannel } : c));
  };

  const handleChannelDeleted = (deletedId) => {
    setChannels(prev => prev.filter(c => c.id !== deletedId));
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${toast.type === 'error' ? '#ef4444' : 'var(--accent-success)'}`,
          color: toast.type === 'error' ? '#fca5a5' : 'var(--accent-primary)',
          fontSize: '0.875rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? <RiAlertFill size={18} /> : <RiCheckLine size={18} />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left: Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--bg-darkest)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          flex: '1 1 260px',
          maxWidth: '380px'
        }}>
          <RiSearch2Line size={18} style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels by name..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              width: '100%'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <RiCloseLine size={16} />
            </button>
          )}
        </div>

        {/* Right: Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '8px 10px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Channels</option>
              <option value="group">Group Channels</option>
              <option value="dm">Direct Messages</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '8px 10px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchChannels(pagination.page, true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <AdminLoadingState message="Loading channels directory..." />
        ) : error ? (
          <AdminErrorState message={error} onRetry={() => fetchChannels(1)} />
        ) : channels.length === 0 ? (
          <AdminEmptyState
            title="No Channels Found"
            description="No channels match the active search and filter conditions."
            icon={RiHashtag}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-darkest)',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  <th style={{ padding: '14px 20px' }}>Channel</th>
                  <th style={{ padding: '14px 16px' }}>Type</th>
                  <th style={{ padding: '14px 16px' }}>Owner</th>
                  <th style={{ padding: '14px 16px' }}>Members</th>
                  <th style={{ padding: '14px 16px' }}>Messages</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Created</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((chan) => (
                  <tr
                    key={chan.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => setSelectedChannelId(chan.id)}
                  >
                    {/* Name & description */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: chan.isGroup ? 'var(--accent-primary)' : '#60a5fa' }}>
                          {chan.isGroup ? '#' : '💬'}
                        </span>
                        {chan.name}
                      </div>
                      {chan.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chan.description}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: chan.isGroup ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: chan.isGroup ? 'var(--accent-success)' : '#60a5fa'
                      }}>
                        {chan.isGroup ? 'Group' : 'DM'}
                      </span>
                    </td>

                    {/* Owner */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {chan.owner ? `@${chan.owner.username}` : 'Auto-created'}
                    </td>

                    {/* Members */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {chan.memberCount}
                    </td>

                    {/* Messages */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {chan.messageCount}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: chan.isArchived ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: chan.isArchived ? 'var(--accent-warning)' : 'var(--accent-success)'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: chan.isArchived ? 'var(--accent-warning)' : 'var(--accent-success)'
                        }} />
                        {chan.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>

                    {/* Created */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(chan.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChannelId(chan.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--bg-darkest)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--accent-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-highlight)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-darkest)';
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && channels.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-darkest)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} channels
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => fetchChannels(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasPrev ? 1 : 0.4
                }}
              >
                <RiArrowLeftSLine size={16} /> Previous
              </button>

              <span style={{ padding: '0 8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                Page {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => fetchChannels(pagination.page + 1)}
                disabled={!pagination.hasNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNext ? 1 : 0.4
                }}
              >
                Next <RiArrowRightSLine size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Channel Details Drawer Modal */}
      {selectedChannelId && (
        <ChannelDetailsDrawer
          channelId={selectedChannelId}
          token={token}
          onClose={() => setSelectedChannelId(null)}
          onChannelUpdated={handleChannelUpdated}
          onChannelDeleted={handleChannelDeleted}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}


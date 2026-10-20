"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  RiSearch2Line,
  RiFilter3Line,
  RiRefreshLine,
  RiShieldUserFill,
  RiShieldCheckLine,
  RiShieldLine,
  RiUserLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiForbidLine,
  RiCheckLine,
  RiAlertFill,
  RiCloseLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { getOptimizedImageUrl } from '../../../utils/imageOptimizer';
import { AdminLoadingState, AdminEmptyState, AdminErrorState } from '../AdminStates';
import UserDetailsDrawer from './UserDetailsDrawer';

export default function UsersView({ token, currentAdminId }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Selected User for details drawer
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchUsers = useCallback(async (pageToLoad = 1, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getAdminUsers(token, {
        page: pageToLoad,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to retrieve user accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, search, roleFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      api.getAdminUsers(token, {
        page: 1,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      })
        .then(res => {
          if (isMounted) {
            setUsers(res.users);
            setPagination(res.pagination);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to retrieve user accounts');
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [token, search, roleFilter, statusFilter]);

  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
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

      {/* Top Filter and Search Bar */}
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
            placeholder="Search by username or email..."
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

        {/* Right: Filters and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
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
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="moderator">Moderators</option>
              <option value="user">Users</option>
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
              <option value="suspended">Suspended Only</option>
              <option value="deactivated">Deactivated Only</option>
              <option value="online">Online Now</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchUsers(pagination.page, true)}
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
          <AdminLoadingState message="Loading accounts list..." />
        ) : error ? (
          <AdminErrorState message={error} onRetry={() => fetchUsers(1)} />
        ) : users.length === 0 ? (
          <AdminEmptyState
            title="No Users Found"
            description="No user accounts match the current filter and search criteria."
            icon={RiShieldUserFill}
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
                  <th style={{ padding: '14px 20px' }}>User</th>
                  <th style={{ padding: '14px 16px' }}>Role</th>
                  <th style={{ padding: '14px 16px' }}>Account Status</th>
                  <th style={{ padding: '14px 16px' }}>Presence</th>
                  <th style={{ padding: '14px 16px' }}>Joined Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentAdmin = Boolean(currentAdminId && currentAdminId.toString() === user.id.toString());
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      {/* Identity */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={getOptimizedImageUrl(user.avatar || `https://ui-avatars.com/api/?name=${user.username}`, { width: 72, height: 72 })}
                            alt={user.username}
                            width="36"
                            height="36"
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid var(--border-color)'
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              @{user.username}
                              {isCurrentAdmin && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60a5fa',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: user.role === 'admin' ? 'rgba(244, 63, 94, 0.12)' : user.role === 'moderator' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          border: user.role === 'admin' ? '1px solid rgba(244, 63, 94, 0.25)' : user.role === 'moderator' ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid #1F2E35',
                          color: user.role === 'admin' ? '#F43F5E' : user.role === 'moderator' ? '#06B6D4' : '#94A3B8'
                        }}>
                          {user.role === 'admin' ? (
                            <>
                              <RiShieldCheckLine size={13} />
                              <span>Admin</span>
                            </>
                          ) : user.role === 'moderator' ? (
                            <>
                              <RiShieldLine size={13} />
                              <span>Moderator</span>
                            </>
                          ) : (
                            <>
                              <RiUserLine size={13} />
                              <span>User</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: user.isSuspended ? 'rgba(244, 63, 94, 0.1)' : user.isDeactivated ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          border: user.isSuspended ? '1px solid rgba(244, 63, 94, 0.25)' : user.isDeactivated ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                          color: user.isSuspended ? '#F43F5E' : user.isDeactivated ? '#F59E0B' : '#10B981'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: user.isSuspended ? '#F43F5E' : user.isDeactivated ? '#F59E0B' : '#10B981'
                          }} />
                          {user.isSuspended ? 'Suspended' : user.isDeactivated ? 'Deactivated' : 'Active'}
                        </span>
                      </td>

                      {/* Presence */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize'
                        }}>
                          {user.status || 'offline'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.id);
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
                          View Profile
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
        {!loading && !error && users.length > 0 && (
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} accounts
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
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
                onClick={() => fetchUsers(pagination.page + 1)}
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

      {/* User Details Drawer Modal */}
      {selectedUserId && (
        <UserDetailsDrawer
          userId={selectedUserId}
          currentAdminId={currentAdminId}
          token={token}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={handleUserUpdated}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}


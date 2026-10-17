"use client";
import React, { useState, useEffect } from 'react';
import {
  RiMegaphoneLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiRefreshLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiInformationLine,
  RiTimeLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminStates';

const CATEGORIES = [
  { id: 'general', label: 'General', color: 'var(--accent-primary)', icon: RiMegaphoneLine },
  { id: 'maintenance', label: 'Maintenance', color: '#fbbf24', icon: RiAlertLine },
  { id: 'security', label: 'Security', color: '#ef4444', icon: RiShieldCheckLine },
  { id: 'feature', label: 'New Feature', color: '#60a5fa', icon: RiSparklingLine },
  { id: 'incident', label: 'Incident', color: '#f87171', icon: RiAlertLine }
];

export default function AnnouncementsView({ token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formPriority, setFormPriority] = useState('normal');
  const [formStatus, setFormStatus] = useState('draft');
  const [formIsDismissible, setFormIsDismissible] = useState(true);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchAnnouncements = async (isManual = false) => {
    if (!token) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getAdminAnnouncements(token, {
        page,
        limit: 10,
        search,
        status: statusFilter,
        category: categoryFilter
      });
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token, page, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAnnouncements();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setFormPriority('normal');
    setFormStatus('draft');
    setFormIsDismissible(true);
    setFormExpiresAt('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category || 'general');
    setFormPriority(item.priority || 'normal');
    setFormStatus(item.status || 'draft');
    setFormIsDismissible(item.isDismissible !== false);
    setFormExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 10) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      priority: formPriority,
      status: formStatus,
      isDismissible: formIsDismissible,
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null
    };

    try {
      if (editingItem) {
        await api.updateAdminAnnouncement(token, editingItem.id, payload);
      } else {
        await api.createAdminAnnouncement(token, payload);
      }
      setIsModalOpen(false);
      fetchAnnouncements(true);
    } catch (err) {
      setFormError(err.message || 'Failed to save announcement');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateAdminAnnouncementStatus(token, id, newStatus);
      fetchAnnouncements(true);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAdminAnnouncement(token, id);
      setDeleteConfirmId(null);
      fetchAnnouncements(true);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* View Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(211, 255, 234, 0.1)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RiMegaphoneLine size={16} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Platform Broadcasts & Announcements
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Broadcast platform maintenance, incident reports, and feature highlights to active users.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RiAddLine size={18} />
            New Announcement
          </button>

          <button
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px', flex: 1 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <RiSearchLine size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-darkest)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px 8px 36px',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-darkest)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        {/* Status and Category dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              backgroundColor: 'var(--bg-darkest)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{
              backgroundColor: 'var(--bg-darkest)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="security">Security</option>
            <option value="feature">New Feature</option>
            <option value="incident">Incident</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <AdminLoadingState message="Loading announcements..." />
      ) : error ? (
        <AdminErrorState message={error} onRetry={() => fetchAnnouncements(true)} />
      ) : announcements.length === 0 ? (
        <AdminEmptyState
          title="No Announcements Found"
          description="Create your first platform announcement or clear filters to view existing broadcasts."
          actionText="Create Announcement"
          onAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(item => {
            const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
            const CatIcon = cat.icon;
            const isPublished = item.status === 'published';
            const isDraft = item.status === 'draft';
            const isArchived = item.status === 'archived';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: isPublished ? `1px solid ${cat.color}` : '1px solid var(--border-color)',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {/* Category pill */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-darkest)',
                      color: cat.color,
                      border: `1px solid ${cat.color}40`
                    }}>
                      <CatIcon size={12} />
                      {cat.label}
                    </span>

                    {/* Status pill */}
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      backgroundColor: isPublished ? 'rgba(16, 185, 129, 0.15)' : (isDraft ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                      color: isPublished ? 'var(--accent-success)' : (isDraft ? '#fbbf24' : 'var(--text-dim)')
                    }}>
                      {item.status.toUpperCase()}
                    </span>

                    {item.priority === 'urgent' && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444'
                      }}>
                        URGENT
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      by @{item.authorUsername || item.author?.username || 'Admin'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {item.publishedAt && (
                      <span>Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                    )}
                    {item.expiresAt && (
                      <span>Expires: {new Date(item.expiresAt).toLocaleDateString()}</span>
                    )}
                    <span>Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isDraft && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'published')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--accent-success)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Publish
                    </button>
                  )}

                  {isPublished && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'draft')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-darkest)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Unpublish
                    </button>
                  )}

                  {!isArchived && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'archived')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-darkest)',
                        color: 'var(--text-dim)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                      title="Archive broadcast"
                    >
                      Archive
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(item)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-darkest)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RiEditLine size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    title="Delete announcement"
                  >
                    <RiDeleteBinLine size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <form
            onSubmit={handleFormSubmit}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '580px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                {editingItem ? 'Edit Announcement' : 'Author New Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Title *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-darkest)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-darkest)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="general">General</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="feature">New Feature</option>
                  <option value="incident">Incident</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Priority
                </label>
                <select
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-darkest)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent (Always visible)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Publication Status
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-darkest)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="draft">Save as Draft</option>
                  <option value="published">Publish Immediately</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Message Content *
              </label>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={4}
                placeholder="Enter announcement details..."
                required
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-darkest)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={e => setFormExpiresAt(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-darkest)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 10px',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={formIsDismissible}
                  onChange={e => setFormIsDismissible(e.target.checked)}
                />
                Allow users to dismiss banner
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: formSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {formSubmitting ? 'Saving...' : (editingItem ? 'Save Changes' : (formStatus === 'published' ? 'Publish Now' : 'Save Draft'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
              Confirm Announcement Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this announcement? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";
import React, { useState, useEffect } from 'react';
import {
  RiCloudLine,
  RiDatabase2Line,
  RiRefreshLine,
  RiSearchLine,
  RiFilterLine,
  RiImageLine,
  RiVideoLine,
  RiFileTextLine,
  RiMusicLine,
  RiDeleteBinLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiScanLine,
  RiShieldCheckLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../AdminStates';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function StorageView({ token }) {
  const [metrics, setMetrics] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [usageType, setUsageType] = useState('all');
  const [isOrphan, setIsOrphan] = useState('all');

  // Orphan Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Cleanup Modal State
  const [fileToCleanup, setFileToCleanup] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState(null);

  const fetchStorageData = async (isManual = false) => {
    if (!token) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [mRes, fRes] = await Promise.all([
        api.getAdminStorageMetrics(token),
        api.getAdminStorageFiles(token, {
          page,
          limit: 12,
          search,
          fileType,
          usageType,
          isOrphan
        })
      ]);

      setMetrics(mRes);
      setFiles(fRes.files || []);
      setPagination(fRes.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load storage data:', err);
      setError(err.message || 'Failed to load storage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, [token, page, fileType, usageType, isOrphan]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStorageData();
  };

  const handleScanOrphans = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api.scanAdminStorageOrphans(token);
      setScanResult(result);
      fetchStorageData(true);
    } catch (err) {
      alert(`Orphan scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmCleanup = async () => {
    if (!fileToCleanup) return;
    setCleaning(true);
    try {
      const res = await api.cleanupAdminStorageOrphan(token, fileToCleanup.id, true);
      setCleanupMessage(`Cleaned up '${fileToCleanup.fileName}' (${formatBytes(res.freedBytes)} freed).`);
      setFileToCleanup(null);
      fetchStorageData(true);
      setTimeout(() => setCleanupMessage(null), 4000);
    } catch (err) {
      alert(`Cleanup failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const storage = metrics?.storage || { totalFiles: 0, totalBytes: 0, totalMb: 0, orphanedFilesCount: 0, fileTypes: {}, usageTypes: {} };
  const provider = metrics?.provider || { name: 'Cloudinary', configured: false, status: 'operational' };

  if (loading) return <AdminLoadingState message="Measuring cloud storage utilization and media files..." />;
  if (error && !metrics) return <AdminErrorState message={error} onRetry={() => fetchStorageData(true)} />;

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
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RiCloudLine size={16} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Storage, Uploads & Media Assets
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Inspect stored media files, Cloudinary telemetry, and detect unreferenced orphaned assets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleScanOrphans}
            disabled={scanning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: scanning ? 'not-allowed' : 'pointer'
            }}
          >
            <RiScanLine size={16} />
            {scanning ? 'Scanning Assets...' : 'Scan for Orphans'}
          </button>

          <button
            onClick={() => fetchStorageData(true)}
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
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {cleanupMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-success)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <RiCheckLine size={18} />
          {cleanupMessage}
        </div>
      )}

      {scanResult && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <RiCheckLine size={18} />
          Scan complete: {scanResult.totalScanned} files analyzed. Found {scanResult.orphanedCount} orphaned assets ({formatBytes(scanResult.orphanedBytes)} eligible for cleanup).
        </div>
      )}

      {/* Storage KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Storage Used */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Media Storage
              </span>
              <RiDatabase2Line size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {formatBytes(storage.totalBytes)}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>{storage.totalFiles} uploaded files</span>
          </div>
        </div>

        {/* Cloud Storage Provider */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cloud Provider
              </span>
              <RiCloudLine size={18} color="#60a5fa" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {provider.name}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Bucket: {provider.cloudNameMasked || 'Active'}</span>
            <span style={{ color: provider.configured ? 'var(--accent-success)' : '#fbbf24' }}>
              ● {provider.configured ? 'Operational' : 'Fallback'}
            </span>
          </div>
        </div>

        {/* Orphaned Media */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Orphaned Media
              </span>
              <RiAlertLine size={18} color={storage.orphanedFilesCount > 0 ? '#fbbf24' : 'var(--accent-success)'} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: storage.orphanedFilesCount > 0 ? '#fbbf24' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {storage.orphanedFilesCount}
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>Unreferenced files eligible for cleanup</span>
          </div>
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px', flex: 1 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <RiSearchLine size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by file name or uploader..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={fileType}
            onChange={e => { setFileType(e.target.value); setPage(1); }}
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
            <option value="all">All File Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio Notes</option>
            <option value="document">Documents</option>
          </select>

          <select
            value={isOrphan}
            onChange={e => { setIsOrphan(e.target.value); setPage(1); }}
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
            <option value="all">All Usage</option>
            <option value="true">Orphaned Only</option>
            <option value="false">Active Only</option>
          </select>
        </div>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <AdminEmptyState
          title="No Media Files Found"
          description="Upload files in chat or clear current search filters to inspect stored assets."
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {files.map(file => {
            const isImage = file.fileType === 'image';
            const isVideo = file.fileType === 'video';
            const isAudio = file.fileType === 'audio';

            return (
              <div
                key={file.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: file.isOrphan ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Media Preview Header */}
                <div style={{
                  height: '140px',
                  backgroundColor: 'var(--bg-darkest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {isImage && file.url ? (
                    <img
                      src={file.url}
                      alt={file.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                      {isVideo ? <RiVideoLine size={36} color="#60a5fa" /> :
                       isAudio ? <RiMusicLine size={36} color="#fbbf24" /> :
                       <RiFileTextLine size={36} color="var(--accent-primary)" />}
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{file.fileType}</span>
                    </div>
                  )}

                  {file.isOrphan && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      backgroundColor: 'rgba(245, 158, 11, 0.9)',
                      color: '#000'
                    }}>
                      ORPHAN
                    </span>
                  )}

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Open original file"
                  >
                    <RiExternalLinkLine size={14} />
                  </a>
                </div>

                {/* File Details */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      margin: '0 0 4px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={file.fileName}>
                      {file.fileName}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>@{file.uploaderUsername}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)'
                  }}>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>

                    {file.isOrphan ? (
                      <button
                        onClick={() => setFileToCleanup(file)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: 0
                        }}
                      >
                        <RiDeleteBinLine size={13} /> Clean up
                      </button>
                    ) : (
                      <span style={{ color: 'var(--accent-success)' }}>● In use</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Explicit Cleanup Confirmation Modal */}
      {fileToCleanup && (
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
            maxWidth: '460px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
              Confirm Orphaned Asset Cleanup
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to delete this orphaned asset from cloud storage?
            </p>

            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-darkest)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: 'var(--text-main)'
            }}>
              <div><strong>File:</strong> {fileToCleanup.fileName}</div>
              <div><strong>Size:</strong> {formatBytes(fileToCleanup.fileSize)}</div>
              <div><strong>Uploader:</strong> @{fileToCleanup.uploaderUsername}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setFileToCleanup(null)}
                disabled={cleaning}
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
                onClick={handleConfirmCleanup}
                disabled={cleaning}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  cursor: cleaning ? 'not-allowed' : 'pointer'
                }}
              >
                {cleaning ? 'Deleting...' : 'Confirm Cleanup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


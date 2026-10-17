"use client";
import React, { useEffect, useState } from 'react';
import {
  RiPulseLine,
  RiDatabase2Line,
  RiCpuLine,
  RiTimeLine,
  RiRefreshLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiCloudLine,
  RiRadio2Line,
  RiServerLine,
  RiAlertLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState } from '../AdminStates';

function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export default function SystemHealthView({ token }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isManual = false) => {
    if (!token) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getAdminHealth(token);
      setHealth(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
      setError(err.message || 'Failed to load system health metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [token]);

  const handleRefresh = () => {
    fetchHealth(true);
  };

  if (loading) return <AdminLoadingState message="Measuring system health, latency, and service connectivity..." />;
  if (error && !health) return <AdminErrorState message={error} onRetry={handleRefresh} />;

  const isHealthy = health?.status === 'healthy';
  const pingMs = typeof health?.database?.pingLatencyMs === 'number' ? health.database.pingLatencyMs : null;
  const mem = health?.memory || {};
  const socket = health?.socket || {};
  const uploads = health?.uploads || {};
  const deployment = health?.deployment || {};
  const proc = health?.process || {};
  const errors = health?.operationalErrors || { count: 0, recent: [] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Status Banner */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isHealthy ? 'var(--accent-success)' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isHealthy ? <RiCheckboxCircleFill size={28} /> : <RiErrorWarningFill size={28} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                System Status: {isHealthy ? 'Operational' : 'Attention Required'}
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isHealthy ? 'var(--accent-success)' : '#ef4444'
              }}>
                {isHealthy ? 'ALL SERVICES HEALTHY' : 'DEGRADED PERFORMANCE'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Checked at {health?.serverTime ? new Date(health.serverTime).toLocaleTimeString() : 'Just now'} • Real-time backend diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-darkest)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
        >
          <RiRefreshLine size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Probing Services...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Grid of System Subsystems */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
        gap: '16px'
      }}>
        {/* 1. Database Connection & Latency */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RiDatabase2Line size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Database (MongoDB)
              </h3>
            </div>
            {pingMs !== null && (
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: pingMs < 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: pingMs < 100 ? 'var(--accent-success)' : '#fbbf24'
              }}>
                ⚡ {pingMs}ms ping
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection State:</span>
              <span style={{ color: 'var(--accent-success)', fontWeight: 600, textTransform: 'capitalize' }}>
                ● {health?.database?.status || 'Unknown'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Name:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {health?.database?.name || 'realtime_chat'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cluster Host:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {health?.database?.host || 'MongoDB Cluster'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Socket.IO Service */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RiRadio2Line size={20} color="#60a5fa" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Real-Time Gateway (Socket.IO)
              </h3>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa'
            }}>
              LIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gateway Status:</span>
              <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                ● {socket.status || 'Active'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connected Sockets:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {socket.connectedSockets ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Users Online:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {socket.activeUsers ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Chat Rooms:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {socket.roomsCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Media & Upload Provider */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RiCloudLine size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Media Upload Service
              </h3>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: uploads.configured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: uploads.configured ? 'var(--accent-success)' : '#ef4444'
            }}>
              {uploads.configured ? 'CONFIGURED' : 'LOCAL FALLBACK'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Provider:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {uploads.provider || 'Cloudinary'}
              </span>
            </div>
            {uploads.cloudNameMasked && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cloud Bucket:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {uploads.cloudNameMasked}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>File Size Ceiling:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                25 MB per upload
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Credentials Privacy:</span>
              <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem' }}>
                🔒 Secrets securely masked
              </span>
            </div>
          </div>
        </div>

        {/* 4. Memory Usage & Heap Allocation */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RiCpuLine size={20} color="var(--accent-secondary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Node.js Memory Allocation
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              {mem.heapPercent ?? 0}% heap allocated
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--bg-darkest)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '14px'
          }}>
            <div style={{
              width: `${Math.min(100, mem.heapPercent || 20)}%`,
              height: '100%',
              backgroundColor: (mem.heapPercent || 0) > 85 ? '#ef4444' : 'var(--accent-primary)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Heap Used:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {mem.heapUsedMb} MB
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Heap Total:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {mem.heapTotalMb} MB
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resident Set (RSS):</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {mem.rssMb} MB
              </span>
            </div>
          </div>
        </div>

        {/* 5. Process Lifecycle */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <RiTimeLine size={20} color="var(--accent-warning)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Process Lifecycle
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Server Uptime:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {formatUptime(proc.uptimeSeconds)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Process ID (PID):</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {proc.pid}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Node.js Runtime:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {proc.nodeVersion}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Platform Architecture:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {proc.platform}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Deployment & Environment */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <RiServerLine size={20} color="#a78bfa" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Deployment Telemetry
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Infrastructure Provider:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {deployment.provider || 'Node.js Standalone'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Environment:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                {deployment.environment || 'development'}
              </span>
            </div>
            {deployment.serviceId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service Identifier:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {deployment.serviceId}
                </span>
              </div>
            )}
            {deployment.gitCommit && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Git Revision:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {deployment.gitCommit}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>HTTP Port:</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                3001
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Failures & Audit Issues Panel */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiAlertLine size={20} color={errors.count > 0 ? '#ef4444' : 'var(--accent-success)'} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Recent Operational Failures & Errors ({errors.count})
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Captured from security audit trail
          </span>
        </div>

        {errors.count === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-darkest)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            <RiCheckboxCircleFill size={28} color="var(--accent-success)" style={{ display: 'block', margin: '0 auto 8px auto' }} />
            All operational systems operating normally. Zero failure events logged in the audit trail.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {errors.recent.map(err => (
              <div key={err.id} style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {err.action}
                  </span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    {err.reason || 'Operational failure'}
                  </span>
                  {err.targetLabel && (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      ({err.targetType}: {err.targetLabel})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Actor: @{err.actor}</span>
                  <span>{new Date(err.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

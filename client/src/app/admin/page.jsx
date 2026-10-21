"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { RiMenuLine } from 'react-icons/ri';
import AdminSidebar, { ADMIN_NAV_ITEMS } from '../../components/Admin/AdminSidebar';
import {
  AdminLoadingState,
  AdminAccessDeniedState,
  AdminErrorState,
  AdminComingSoonState
} from '../../components/Admin/AdminStates';
import OverviewView from '../../components/Admin/views/OverviewView';
import SystemHealthView from '../../components/Admin/views/SystemHealthView';
import UsersView from '../../components/Admin/views/UsersView';
import ChannelsView from '../../components/Admin/views/ChannelsView';
import ModerationView from '../../components/Admin/views/ModerationView';
import AnalyticsView from '../../components/Admin/views/AnalyticsView';
import AnnouncementsView from '../../components/Admin/views/AnnouncementsView';
import SettingsView from '../../components/Admin/views/SettingsView';
import StorageView from '../../components/Admin/views/StorageView';
import AuditLogsView from '../../components/Admin/views/AuditLogsView';

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [activeNav, setActiveNav] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifiedAdminUser, setVerifiedAdminUser] = useState(null);

  // Check authentication & backend admin authorization
  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      if (authLoading) return;

      // 1. Unauthenticated -> Redirect to normal login flow on '/'
      if (!token || !user) {
        router.replace('/');
        return;
      }

      // 2. Pre-check user object on client
      const hasAdminFlag = Boolean(user.isAdmin || user.role === 'admin');
      if (!hasAdminFlag) {
        if (isMounted) {
          setIsAuthorized(false);
          setVerifying(false);
        }
        return;
      }

      // 3. Strictly verify on backend (never trust client alone)
      try {
        setVerifyError(null);
        const data = await api.verifyAdmin(token);
        if (isMounted) {
          if (data && data.ok) {
            setIsAuthorized(true);
            setVerifiedAdminUser(data.user);
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Admin verification rejected:', err);
          if (err.message && (err.message.includes('403') || err.message.toLowerCase().includes('forbidden'))) {
            setIsAuthorized(false);
          } else if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized'))) {
            router.replace('/');
          } else {
            setVerifyError(err.message || 'Failed to verify admin status with server');
          }
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [user, token, authLoading, router]);

  // Handle Loading State
  if (authLoading || verifying) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-darkest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AdminLoadingState message={authLoading ? 'Authenticating user session...' : 'Verifying administrator privileges...'} />
      </div>
    );
  }

  // Handle Unauthenticated
  if (!token || !user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-darkest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AdminLoadingState message="Redirecting to NexChat login..." />
      </div>
    );
  }

  // Handle Access Denied (Non-admin)
  if (!isAuthorized) {
    return <AdminAccessDeniedState username={user?.username} />;
  }

  // Handle Network / Server Verification Error
  if (verifyError) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-darkest)', padding: '24px' }}>
        <AdminErrorState
          message={verifyError}
          onRetry={() => {
            setVerifying(true);
            setVerifyError(null);
            api.verifyAdmin(token)
              .then(data => {
                if (data.ok) {
                  setIsAuthorized(true);
                  setVerifiedAdminUser(data.user);
                } else setIsAuthorized(false);
              })
              .catch(e => setVerifyError(e.message))
              .finally(() => setVerifying(false));
          }}
        />
      </div>
    );
  }

  const currentNavItem = ADMIN_NAV_ITEMS.find(n => n.id === activeNav) || ADMIN_NAV_ITEMS[0];
  const adminUser = verifiedAdminUser || user;

  return (
    <div
      className="admin-layout-root"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#0B1013',
        color: '#F1F5F9',
        display: 'flex',
        overflow: 'hidden',
        width: '100vw',
        maxWidth: '100%'
      }}
    >
      {/* Admin Sidebar */}
      <AdminSidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        adminUser={adminUser}
      />

      {/* Main Layout Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: '260px',
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          backgroundColor: '#0B1013'
        }}
        className="admin-main-wrapper"
      >
        {/* Mobile Navigation Trigger (only visible on screens < 1024px) */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="admin-mobile-fab"
          aria-label="Open admin navigation menu"
          title="Open admin navigation"
        >
          <RiMenuLine size={20} />
        </button>

        {/* Content Area */}
        <main style={{
          flex: 1,
          padding: '24px',
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }} className="admin-content-area">
          {(() => {
            switch (activeNav) {
              case 'overview':
                return <OverviewView token={token} onNavigate={setActiveNav} />;
              case 'users':
                return <UsersView token={token} currentAdminId={adminUser?.id} />;
              case 'channels':
                return <ChannelsView token={token} />;
              case 'moderation':
                return <ModerationView token={token} currentAdminId={adminUser?.id} />;
              case 'analytics':
                return <AnalyticsView token={token} onNavigate={setActiveNav} />;
              case 'system_health':
                return <SystemHealthView token={token} />;
              case 'announcements':
                return <AnnouncementsView token={token} />;
              case 'storage':
                return <StorageView token={token} />;
              case 'settings':
                return <SettingsView token={token} />;
              case 'audit_logs':
                return <AuditLogsView token={token} />;
              default:
                return (
                  <AdminComingSoonState
                    title={currentNavItem.label}
                    description={currentNavItem.description}
                    icon={currentNavItem.icon}
                    plannedFeatures={currentNavItem.features || []}
                  />
                );
            }
          })()}
        </main>
      </div>

      <style jsx global>{`
        /* Obsidian Telemetry Design System Scope */
        .admin-layout-root {
          --bg-darkest: #0B1013;
          --bg-sidebar: #11181C;
          --bg-card: #11181C;
          --bg-card-secondary: #162026;
          --bg-hover: #1E2B33;
          --bg-active: #162026;

          --border-color: #1F2E35;
          --border-highlight: #2C3F49;
          --border-active: #10B981;

          --accent-primary: #10B981;
          --accent-primary-hover: #34D399;
          --accent-secondary: #06B6D4;
          --accent-success: #10B981;
          --accent-warning: #F59E0B;
          --accent-danger: #F43F5E;

          --text-main: #F1F5F9;
          --text-muted: #94A3B8;
          --text-dim: #475569;

          --font-family: 'Geist', var(--font-family, system-ui, -apple-system, sans-serif);
          --font-heading: 'Geist', var(--font-heading, sans-serif);
          --font-mono: 'JetBrains Mono', monospace;

          --radius-sm: 4px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-full: 9999px;
        }

        /* Continuous Telemetry Pulse */
        @keyframes telemetry-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        /* Smooth vertical scrolling in Admin console */
        html:has(.admin-main-wrapper),
        body:has(.admin-main-wrapper) {
          overflow-y: auto !important;
          background-color: #0B1013 !important;
        }

        .admin-main-wrapper {
          scrollbar-width: thin;
          scrollbar-color: #1F2E35 #0B1013;
        }

        .admin-main-wrapper::-webkit-scrollbar {
          width: 6px;
        }

        .admin-main-wrapper::-webkit-scrollbar-track {
          background: #0B1013;
        }

        .admin-main-wrapper::-webkit-scrollbar-thumb {
          background: #1F2E35;
          border-radius: 4px;
        }

        .admin-main-wrapper::-webkit-scrollbar-thumb:hover {
          background: #10B981;
        }

        .admin-mobile-fab {
          display: none;
        }

        @media (max-width: 1023px) {
          .admin-mobile-fab {
            display: flex !important;
            position: fixed;
            bottom: 22px;
            right: 22px;
            z-index: 80;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background-color: #162026;
            border: 1px solid #1F2E35;
            color: #10B981;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 12px rgba(16, 185, 129, 0.2);
            transition: all 0.2s ease;
          }
          .admin-mobile-fab:hover {
            background-color: #1E2B33;
            border-color: #10B981;
            transform: scale(1.05);
          }
          .admin-main-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          .admin-content-area {
            padding: 16px 14px !important;
          }
        }

        @media (max-width: 640px) {
          .admin-content-area {
            padding: 12px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}


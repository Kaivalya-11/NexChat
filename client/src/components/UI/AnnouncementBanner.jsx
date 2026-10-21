"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiMegaphoneLine,
  RiCloseLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiInformationLine,
  RiArrowRightLine
} from 'react-icons/ri';
import * as api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const CATEGORY_STYLES = {
  maintenance: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    color: '#F59E0B',
    icon: RiAlertLine,
    label: 'MAINTENANCE'
  },
  security: {
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.35)',
    color: '#F43F5E',
    icon: RiShieldCheckLine,
    label: 'SECURITY'
  },
  feature: {
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.35)',
    color: '#06B6D4',
    icon: RiSparklingLine,
    label: 'NEW FEATURE'
  },
  incident: {
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.35)',
    color: '#F43F5E',
    icon: RiAlertLine,
    label: 'INCIDENT'
  },
  general: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    color: '#10B981',
    icon: RiMegaphoneLine,
    label: 'ANNOUNCEMENT'
  }
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [dismissedIds, setDismissedIds] = useState([]);
  const { socket } = useSocket() || {};

  useEffect(() => {
    // Load dismissed IDs from local storage
    try {
      const saved = localStorage.getItem('nexchat_dismissed_announcements');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore localStorage parse errors
    }

    // Fetch initial published announcements
    api.getPublicAnnouncements()
      .then(res => {
        if (res && Array.isArray(res.announcements)) {
          setAnnouncements(res.announcements);
        }
      })
      .catch(err => {
        // Silently handle if disabled or offline
      });
  }, []);

  // Listen for live announcements from socket
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') return;

    const handleNewAnnouncement = (announcement) => {
      setAnnouncements(prev => {
        const filtered = prev.filter(a => a.id !== announcement.id);
        return [announcement, ...filtered];
      });
    };

    socket.on('announcement-published', handleNewAnnouncement);

    return () => {
      if (typeof socket.off === 'function') {
        socket.off('announcement-published', handleNewAnnouncement);
      }
    };
  }, [socket]);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('nexchat_dismissed_announcements', JSON.stringify(updated));
    } catch (e) {}
  };

  // Filter out dismissed announcements unless urgent
  const activeAnnouncements = announcements.filter(a => {
    if (a.priority === 'urgent') return true;
    return !dismissedIds.includes(a.id);
  });

  if (activeAnnouncements.length === 0) return null;

  // Render top active announcement
  const current = activeAnnouncements[0];
  const style = CATEGORY_STYLES[current.category] || CATEGORY_STYLES.general;
  const Icon = style.icon;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            width: '100%',
            backgroundColor: style.bg,
            borderBottom: `1px solid ${style.border}`,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            zIndex: 35,
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: style.color,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              flexShrink: 0
            }}>
              <Icon size={14} />
              {style.label}
            </div>

            <span style={{
              fontWeight: 600,
              color: 'var(--text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {current.title}:
            </span>

            <span style={{
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {current.content}
            </span>

            <button
              onClick={() => setSelectedAnnouncement(current)}
              style={{
                background: 'none',
                border: 'none',
                color: style.color,
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 6px',
                flexShrink: 0
              }}
            >
              Details <RiArrowRightLine size={14} />
            </button>
          </div>

          {current.isDismissible && (
            <button
              onClick={() => handleDismiss(current.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              title="Dismiss announcement"
            >
              <RiCloseLine size={18} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Details Modal */}
      {selectedAnnouncement && (
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
            border: `1px solid ${style.border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: style.bg,
                color: style.color,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                <Icon size={16} />
                {style.label}
              </div>

              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              {selectedAnnouncement.title}
            </h3>

            <div style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '6px'
            }}>
              {selectedAnnouncement.content}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-dim)'
            }}>
              <span>Published {selectedAnnouncement.publishedAt ? new Date(selectedAnnouncement.publishedAt).toLocaleDateString() : 'Recently'}</span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


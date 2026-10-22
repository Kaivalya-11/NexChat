"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RiCloseLine,
  RiSettings4Fill,
  RiPaletteLine,
  RiNotification3Line,
  RiVolumeUpFill,
  RiShieldKeyholeLine,
  RiUser3Line,
  RiSendPlane2Fill,
  RiCheckLine,
  RiInformationLine,
  RiRestartLine,
  RiShieldCheckFill,
  RiVidiconLine,
  RiText,
  RiTimeLine
} from 'react-icons/ri';
import { soundManager } from '../../services/sound';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { setSetting } from '../../utils/appSettings';

export default function AppSettingsModal({ user, theme, onToggleTheme, onOpenProfile, onClose }) {
  const [activeTab, setActiveTab] = useState('appearance');

  // Appearance & Display
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState('standard'); // 'compact', 'standard', 'large'
  const [clockFormat, setClockFormat] = useState('12h'); // '12h', '24h'

  // Chat & Messaging
  const [enterToSend, setEnterToSend] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoPreview, setAutoPreview] = useState(true);
  const [showTyping, setShowTyping] = useState(true);
  const [markdownEnabled, setMarkdownEnabled] = useState(true);
  const [sendSound, setSendSound] = useState(false);

  // Notifications & Sound
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dmAlerts, setDmAlerts] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  const [browserNotifStatus, setBrowserNotifStatus] = useState('default');

  // Voice & Video Calls
  const [callChime, setCallChime] = useState(true);
  const [autoMuteMic, setAutoMuteMic] = useState(false);
  const [autoCamOff, setAutoCamOff] = useState(false);

  // Privacy & Security
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [sendReadReceipts, setSendReadReceipts] = useState(true);
  const [allowDms, setAllowDms] = useState(true);

  // Cache clear feedback
  const [cacheCleared, setCacheCleared] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Appearance
    const storedCompact = localStorage.getItem('nexchat_compact_mode');
    if (storedCompact !== null) setCompactMode(storedCompact === 'true');

    const storedFontSize = localStorage.getItem('nexchat_font_size');
    if (storedFontSize) setFontSize(storedFontSize);

    const storedClock = localStorage.getItem('nexchat_clock_format');
    if (storedClock) setClockFormat(storedClock);

    // Messaging
    const storedEnter = localStorage.getItem('nexchat_enter_to_send');
    if (storedEnter !== null) setEnterToSend(storedEnter === 'true');

    const storedAutoScroll = localStorage.getItem('nexchat_auto_scroll');
    if (storedAutoScroll !== null) setAutoScroll(storedAutoScroll === 'true');

    const storedPreview = localStorage.getItem('nexchat_auto_preview');
    if (storedPreview !== null) setAutoPreview(storedPreview === 'true');

    const storedTyping = localStorage.getItem('nexchat_show_typing');
    if (storedTyping !== null) setShowTyping(storedTyping === 'true');

    const storedMarkdown = localStorage.getItem('nexchat_markdown_enabled');
    if (storedMarkdown !== null) setMarkdownEnabled(storedMarkdown === 'true');

    const storedSendSound = localStorage.getItem('nexchat_send_sound');
    if (storedSendSound !== null) setSendSound(storedSendSound === 'true');

    // Notifications
    const storedSound = localStorage.getItem('nexchat_sound_enabled');
    if (storedSound !== null) setSoundEnabled(storedSound === 'true');

    const storedDm = localStorage.getItem('nexchat_dm_alerts');
    if (storedDm !== null) setDmAlerts(storedDm === 'true');

    const storedMention = localStorage.getItem('nexchat_mention_alerts');
    if (storedMention !== null) setMentionAlerts(storedMention === 'true');

    if ('Notification' in window) {
      setBrowserNotifStatus(Notification.permission);
    }

    // Voice & Calls
    const storedCallChime = localStorage.getItem('nexchat_call_chime');
    if (storedCallChime !== null) setCallChime(storedCallChime === 'true');

    const storedAutoMute = localStorage.getItem('nexchat_auto_mute_mic');
    if (storedAutoMute !== null) setAutoMuteMic(storedAutoMute === 'true');

    const storedAutoCam = localStorage.getItem('nexchat_auto_cam_off');
    if (storedAutoCam !== null) setAutoCamOff(storedAutoCam === 'true');

    // Privacy
    const storedStatus = localStorage.getItem('nexchat_show_status');
    if (storedStatus !== null) setShowOnlineStatus(storedStatus === 'true');

    const storedReceipts = localStorage.getItem('nexchat_read_receipts');
    if (storedReceipts !== null) setSendReadReceipts(storedReceipts === 'true');

    const storedAllowDms = localStorage.getItem('nexchat_allow_dms');
    if (storedAllowDms !== null) setAllowDms(storedAllowDms === 'true');
  }, []);

  // Update handlers
  const updateSetting = (key, val, setter) => {
    setter(val);
    setSetting(key, val);
  };

  const handleToggleSound = (val) => {
    setSoundEnabled(val);
    soundManager.setSound(val);
    setSetting('nexchat_sound_enabled', val);
  };

  const handleRequestNotifPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotifStatus(perm);
      } catch (err) {
        console.warn('Failed to request notification permission:', err);
      }
    }
  };

  const handleTestSound = () => {
    soundManager.init();
    soundManager.playNotificationSound();
  };

  const handleClearAppCache = () => {
    try {
      const keysToClear = ['nexchat_compact_mode', 'channel_drafts', 'nexchat_recent_reactions'];
      keysToClear.forEach(k => localStorage.removeItem(k));
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.warn('Clear cache error:', e);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <RiPaletteLine size={16} /> },
    { id: 'messaging', label: 'Chat & Messaging', icon: <RiSendPlane2Fill size={16} /> },
    { id: 'notifications', label: 'Notifications & Sound', icon: <RiNotification3Line size={16} /> },
    { id: 'calls', label: 'Voice & Calls', icon: <RiVidiconLine size={16} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <RiShieldKeyholeLine size={16} /> },
    { id: 'account', label: 'Account & System', icon: <RiUser3Line size={16} /> }
  ];

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
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
          maxWidth: '620px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <RiSettings4Fill size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Application Settings
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customize your overall NexChat experience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close settings"
            style={{
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 18px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{
          padding: '22px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* ───────── 1. APPEARANCE TAB ───────── */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Chat Font Sizing */}
              <div style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <RiText size={16} style={{ color: 'var(--accent-primary)' }} />
                    Chat Font Scale
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Adjust text scaling for chat messages and feeds
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['compact', 'standard', 'large'].map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => updateSetting('nexchat_font_size', size, setFontSize)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: fontSize === size ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        backgroundColor: fontSize === size ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-hover)',
                        color: fontSize === size ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clock Time Format */}
              <div style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <RiTimeLine size={16} style={{ color: 'var(--accent-primary)' }} />
                    Timestamp Format
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Choose between 12-hour or 24-hour time display
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: '12h', label: '12-Hour (1:30 PM)' },
                    { id: '24h', label: '24-Hour (13:30)' }
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt.id}
                      onClick={() => updateSetting('nexchat_clock_format', fmt.id, setClockFormat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: clockFormat === fmt.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        backgroundColor: clockFormat === fmt.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-hover)',
                        color: clockFormat === fmt.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleOption
                label="Compact Message Density"
                description="Reduce padding between messages for maximum screen real estate."
                checked={compactMode}
                onChange={(val) => updateSetting('nexchat_compact_mode', val, setCompactMode)}
              />
            </div>
          )}

          {/* ───────── 2. CHAT & MESSAGING TAB ───────── */}
          {activeTab === 'messaging' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ToggleOption
                label="Press Enter to Send"
                description="When enabled, Enter sends your message and Shift+Enter adds a new line. When disabled, Ctrl/Cmd+Enter sends."
                checked={enterToSend}
                onChange={(val) => updateSetting('nexchat_enter_to_send', val, setEnterToSend)}
              />

              <ToggleOption
                label="Auto-Preview Media & Link Embeds"
                description="Render rich cards, image previews, YouTube embeds, and link metadata automatically."
                checked={autoPreview}
                onChange={(val) => updateSetting('nexchat_auto_preview', val, setAutoPreview)}
              />

              <ToggleOption
                label="Auto-Scroll on New Messages"
                description="Keep conversation automatically locked to incoming messages when you are at the bottom."
                checked={autoScroll}
                onChange={(val) => updateSetting('nexchat_auto_scroll', val, setAutoScroll)}
              />

              <ToggleOption
                label="Display Typing Indicators"
                description="Show real-time indicators when channel members are drafting a response."
                checked={showTyping}
                onChange={(val) => updateSetting('nexchat_show_typing', val, setShowTyping)}
              />

              <ToggleOption
                label="Rich Markdown & Emoji Formatting"
                description="Parse bold, italics, code blocks, and emoji shortcodes (:smile:) inline."
                checked={markdownEnabled}
                onChange={(val) => updateSetting('nexchat_markdown_enabled', val, setMarkdownEnabled)}
              />

              <ToggleOption
                label="Message Sent Audio Feedback"
                description="Play an affirmative subtle tick when your message is broadcasted."
                checked={sendSound}
                onChange={(val) => updateSetting('nexchat_send_sound', val, setSendSound)}
              />
            </div>
          )}

          {/* ───────── 3. NOTIFICATIONS TAB ───────── */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ToggleOption
                label="Message Alert Chimes"
                description="Play a synthetic sound when you receive incoming messages in other channels."
                checked={soundEnabled}
                onChange={handleToggleSound}
              />

              {/* Sound Test Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Test Notification Chime
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Listen to the synthetic Web Audio synthesizer chime
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestSound}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-active)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                >
                  <RiVolumeUpFill size={16} style={{ color: 'var(--accent-primary)' }} />
                  Play Chime
                </button>
              </div>

              <ToggleOption
                label="Direct Message Sound Alerts"
                description="Always play sound alerts for private direct messages."
                checked={dmAlerts}
                onChange={(val) => updateSetting('nexchat_dm_alerts', val, setDmAlerts)}
              />

              <ToggleOption
                label="Mention Alerts (@all / @username)"
                description="Trigger alerts whenever your username or channel is directly mentioned."
                checked={mentionAlerts}
                onChange={(val) => updateSetting('nexchat_mention_alerts', val, setMentionAlerts)}
              />

              {/* Desktop Browser Notifications */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Browser Desktop Notifications
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Status: <span style={{ fontWeight: 600, color: browserNotifStatus === 'granted' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {browserNotifStatus === 'granted' ? 'Active / Allowed' : browserNotifStatus === 'denied' ? 'Blocked in Browser' : 'Permission Required'}
                    </span>
                  </div>
                </div>
                {browserNotifStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestNotifPermission}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--accent-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ───────── 4. VOICE & CALLS TAB ───────── */}
          {activeTab === 'calls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ToggleOption
                label="Incoming Call Ringtone"
                description="Play ringtone alerts when another user initiates a WebRTC audio or video call."
                checked={callChime}
                onChange={(val) => updateSetting('nexchat_call_chime', val, setCallChime)}
              />

              <ToggleOption
                label="Join Calls With Microphone Muted"
                description="Automatically mute your microphone whenever you enter a voice or video call."
                checked={autoMuteMic}
                onChange={(val) => updateSetting('nexchat_auto_mute_mic', val, setAutoMuteMic)}
              />

              <ToggleOption
                label="Join Video Calls With Camera Off"
                description="Do not automatically activate your camera when answering incoming video calls."
                checked={autoCamOff}
                onChange={(val) => updateSetting('nexchat_auto_cam_off', val, setAutoCamOff)}
              />
            </div>
          )}

          {/* ───────── 5. PRIVACY & SECURITY TAB ───────── */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ToggleOption
                label="Share Online Status Dot"
                description="Allow workspace members to see your real-time active status."
                checked={showOnlineStatus}
                onChange={(val) => updateSetting('nexchat_show_status', val, setShowOnlineStatus)}
              />

              <ToggleOption
                label="Send Read Receipts"
                description="Let senders see when you have opened and viewed their incoming messages."
                checked={sendReadReceipts}
                onChange={(val) => updateSetting('nexchat_read_receipts', val, setSendReadReceipts)}
              />

              <ToggleOption
                label="Allow Direct Messages"
                description="Allow team members in shared channels to start private 1-on-1 conversations."
                checked={allowDms}
                onChange={(val) => updateSetting('nexchat_allow_dms', val, setAllowDms)}
              />

              {/* Application Data & Cache */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-darkest)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Reset Local Chat Cache
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Clears non-essential drafts and layout caches while keeping your session intact
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearAppCache}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: cacheCleared ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: cacheCleared ? 'var(--accent-primary)' : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RiRestartLine size={16} />
                  {cacheCleared ? 'Cleared!' : 'Clear Cache'}
                </button>
              </div>
            </div>
          )}

          {/* ───────── 6. ACCOUNT & SYSTEM TAB ───────── */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* User Profile Card */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <img
                  src={getOptimizedImageUrl(user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}`, { width: 96, height: 96 })}
                  alt={user?.username || 'User'}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--border-color)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      @{user?.username}
                    </span>
                    {(user?.isAdmin || user?.role === 'admin') && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#F59E0B',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <RiShieldCheckFill size={10} /> ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user?.email || 'Authenticated Workspace Member'}
                  </div>
                </div>
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* App Telemetry Info */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-darkest)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Application</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>NexChat Messenger</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Version</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>2.5.0-telemetry</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Real-Time Engine</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Socket.io v4 Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Design Token Core</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Obsidian Telemetry v2</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Voice & Video Engine</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>WebRTC Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            All settings save automatically to your session
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 22px',
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToggleOption({ label, description, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        backgroundColor: 'var(--bg-darkest)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none'
      }}
    >
      <div style={{ flex: 1, paddingRight: '14px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
            {description}
          </div>
        )}
      </div>

      <div style={{
        width: '40px',
        height: '22px',
        backgroundColor: checked ? 'var(--accent-primary)' : 'var(--bg-hover)',
        borderRadius: '9999px',
        position: 'relative',
        transition: 'background-color 0.2s ease',
        border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        flexShrink: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '16px',
          height: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)'
        }} />
      </div>
    </div>
  );
}

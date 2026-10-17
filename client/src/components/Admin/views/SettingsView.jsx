"use client";
import React, { useState, useEffect } from 'react';
import {
  RiSettings4Line,
  RiSaveLine,
  RiRefreshLine,
  RiAlertLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiUserAddLine,
  RiMegaphoneLine,
  RiUploadCloud2Line,
  RiToggleFill,
  RiToggleLine,
  RiInformationLine
} from 'react-icons/ri';
import * as api from '../../../services/api';
import { AdminLoadingState, AdminErrorState } from '../AdminStates';

export default function SettingsView({ token }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(true);
  const [uploadCeilingMb, setUploadCeilingMb] = useState(25);
  const [voiceNotesEnabled, setVoiceNotesEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [richMediaEnabled, setRichMediaEnabled] = useState(true);

  // Track initial state for unsaved changes indicator
  const [initialSettings, setInitialSettings] = useState(null);

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getAdminSettings(token);
      const s = res.settings || {};

      const maint = s.maintenanceMode || { enabled: false, message: '' };
      setMaintenanceEnabled(Boolean(maint.enabled));
      setMaintenanceMessage(maint.message || 'NexChat is undergoing maintenance. Please check back shortly.');
      setAllowRegistration(s.allowRegistration !== false);
      setAnnouncementsEnabled(s.announcementsEnabled !== false);
      setUploadCeilingMb(s.fileUploadCeilingMb || 25);

      const flags = s.featureFlags || {};
      setVoiceNotesEnabled(flags.enableVoiceAudioNotes !== false);
      setReactionsEnabled(flags.enableMessageReactions !== false);
      setRichMediaEnabled(flags.enableRichMediaUploads !== false);

      setInitialSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      maintenanceMode: {
        enabled: maintenanceEnabled,
        message: maintenanceMessage.trim()
      },
      allowRegistration,
      announcementsEnabled,
      fileUploadCeilingMb: parseInt(uploadCeilingMb, 10),
      featureFlags: {
        enableVoiceAudioNotes: voiceNotesEnabled,
        enableMessageReactions: reactionsEnabled,
        enableRichMediaUploads: richMediaEnabled
      }
    };

    try {
      await api.updateAdminSettings(token, payload);
      setSuccessMessage('Platform settings successfully saved and applied.');
      fetchSettings();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState message="Loading platform configuration..." />;
  if (error && !initialSettings) return <AdminErrorState message={error} onRetry={fetchSettings} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
              <RiSettings4Line size={16} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Platform Configuration & Settings
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Configure global platform behavior, maintenance mode, sign-up rules, and storage limits.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchSettings}
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
              cursor: 'pointer'
            }}
          >
            <RiRefreshLine size={16} />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              backgroundColor: 'var(--accent-primary)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            <RiSaveLine size={16} />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
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
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <RiAlertLine size={18} />
          {error}
        </div>
      )}

      {/* Maintenance Mode Banner if Active */}
      {maintenanceEnabled && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RiAlertLine size={24} color="#fbbf24" />
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem' }}>
                Maintenance Mode is Currently ACTIVE
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Regular users cannot log in or send messages. Administrators retain full access.
              </div>
            </div>
          </div>
          <button
            onClick={() => setMaintenanceEnabled(false)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#fbbf24',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Disable Maintenance Mode
          </button>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Card 1: Maintenance Mode */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
                System Maintenance Mode
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Temporarily pause user access during database upgrades or critical deployments.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={maintenanceEnabled}
                onChange={e => setMaintenanceEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: maintenanceEnabled ? '#fbbf24' : 'var(--text-dim)' }}>
                {maintenanceEnabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              Custom Maintenance Message Shown to Users
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={e => setMaintenanceMessage(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-darkest)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RiInformationLine size={16} />
            <span>Administrator access guarantee: Admins and moderators are never locked out of the dashboard.</span>
          </div>
        </div>

        {/* Card 2: User Registration & Onboarding */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <RiUserAddLine size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  New User Registration
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Allow public account signups via the registration form. When disabled, public signups are rejected.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={e => setAllowRegistration(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: allowRegistration ? 'var(--accent-success)' : '#ef4444' }}>
                {allowRegistration ? 'Allowed' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        {/* Card 3: Announcement Visibility */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <RiMegaphoneLine size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Platform Announcements Banner
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Display active published announcements at the top of the user chat interface.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={announcementsEnabled}
                onChange={e => setAnnouncementsEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: announcementsEnabled ? 'var(--accent-success)' : 'var(--text-dim)' }}>
                {announcementsEnabled ? 'Visible' : 'Hidden'}
              </span>
            </label>
          </div>
        </div>

        {/* Card 4: Upload Size Limits */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <RiUploadCloud2Line size={18} color="#fbbf24" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              File Upload Size Ceiling
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Maximum file size per media or document upload. Valid ceiling range: 1 MB to 50 MB.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="range"
              min="1"
              max="50"
              value={uploadCeilingMb}
              onChange={e => setUploadCeilingMb(e.target.value)}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <span style={{
              fontSize: '1rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '4px 12px',
              backgroundColor: 'var(--bg-darkest)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              minWidth: '80px',
              textAlign: 'center'
            }}>
              {uploadCeilingMb} MB
            </span>
          </div>
        </div>

        {/* Card 5: Supported Feature Flags */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
            Application Feature Flags
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Control availability of core real-time interaction features.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Audio & Voice Notes</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allow recording and sending direct audio clips in channels.</div>
              </div>
              <input
                type="checkbox"
                checked={voiceNotesEnabled}
                onChange={e => setVoiceNotesEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Message Emoji Reactions</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allow users to react with emojis to messages.</div>
              </div>
              <input
                type="checkbox"
                checked={reactionsEnabled}
                onChange={e => setReactionsEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Rich Media Attachments</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allow image, video, and file uploads.</div>
              </div>
              <input
                type="checkbox"
                checked={richMediaEnabled}
                onChange={e => setRichMediaEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Central NexChat Settings Manager
 * Provides persisted settings getters/setters, reactive window event broadcasting,
 * and live document attribute synchronization.
 */

export const DEFAULT_SETTINGS = {
  nexchat_font_size: 'standard',
  nexchat_clock_format: '12h',
  nexchat_compact_mode: 'false',
  nexchat_enter_to_send: 'true',
  nexchat_auto_preview: 'true',
  nexchat_auto_scroll: 'true',
  nexchat_show_typing: 'true',
  nexchat_markdown_enabled: 'true',
  nexchat_send_sound: 'false',
  nexchat_sound_enabled: 'true',
  nexchat_dm_alerts: 'true',
  nexchat_mention_alerts: 'true',
  nexchat_call_chime: 'true',
  nexchat_auto_mute_mic: 'false',
  nexchat_auto_cam_off: 'false',
  nexchat_show_status: 'true',
  nexchat_read_receipts: 'true',
  nexchat_allow_dms: 'true',
};

export function getSetting(key, fallback = null) {
  if (typeof window === 'undefined') return fallback ?? DEFAULT_SETTINGS[key];
  const val = localStorage.getItem(key);
  if (val === null) return fallback ?? DEFAULT_SETTINGS[key];
  return val;
}

export function getBooleanSetting(key, fallback = true) {
  const val = getSetting(key, String(fallback));
  return val !== 'false';
}

export function setSetting(key, value) {
  if (typeof window === 'undefined') return;
  const strVal = String(value);
  localStorage.setItem(key, strVal);
  applyDocumentSettings();
  window.dispatchEvent(new CustomEvent('nexchat_settings_changed', { detail: { key, value: strVal } }));
}

export function applyDocumentSettings() {
  if (typeof document === 'undefined') return;
  const fontSize = getSetting('nexchat_font_size', 'standard');
  const isCompact = getBooleanSetting('nexchat_compact_mode', false);
  const clock = getSetting('nexchat_clock_format', '12h');

  document.documentElement.setAttribute('data-font-size', fontSize);
  document.documentElement.setAttribute('data-compact', isCompact ? 'true' : 'false');
  document.documentElement.setAttribute('data-clock-format', clock);
}


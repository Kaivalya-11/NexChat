const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
  return data;
}

export async function updateProfile(token, profileData) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function getPresetAvatars() {
  const res = await fetch(`${API_BASE}/auth/presets`);
  return await res.json();
}

export async function getAllUsers(token) {
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: getHeaders(token)
  });
  return await res.json();
}

export async function getFriends(token) {
  const res = await fetch(`${API_BASE}/friends`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch friends');
  return await res.json();
}

export async function getFriendRequests(token) {
  const res = await fetch(`${API_BASE}/friends/requests`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch friend requests');
  return await res.json();
}

export async function searchUsersForFriends(token, query) {
  const res = await fetch(`${API_BASE}/friends/search?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to search users');
  return await res.json();
}

export async function sendFriendRequest(token, toUserId) {
  const res = await fetch(`${API_BASE}/friends/requests`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ to: toUserId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send request');
  return data;
}

export async function acceptFriendRequest(token, requestId) {
  const res = await fetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to accept request');
  return data;
}

export async function declineFriendRequest(token, requestId) {
  const res = await fetch(`${API_BASE}/friends/requests/${requestId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to decline request');
  return data;
}

export async function removeFriend(token, friendId) {
  const res = await fetch(`${API_BASE}/friends/${friendId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove friend');
  return data;
}

export async function getChannels(token) {
  const res = await fetch(`${API_BASE}/channels`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch channels');
  return data;
}

export async function getChannelDetails(token, channelId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch channel details');
  return data;
}

export async function updateChannel(token, channelId, updates) {
  const res = await fetch(`${API_BASE}/channels/${channelId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update channel');
  return data;
}

export async function createChannel(token, channelData) {
  const res = await fetch(`${API_BASE}/channels`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(channelData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create channel');
  return data;
}

export async function addChannelMember(token, channelId, userId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}/members`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add member');
  return data;
}

export async function removeChannelMember(token, channelId, userId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove member');
  return data;
}

export async function addChannelAdmin(token, channelId, userId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}/admins`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add admin');
  return data;
}

export async function removeChannelAdmin(token, channelId, userId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}/admins/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove admin');
  return data;
}

export async function getOrCreateDM(token, targetUserId) {
  const res = await fetch(`${API_BASE}/channels/dm`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ targetUserId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to open DM channel');
  return data;
}

export async function getMessages(token, channelId, before = null) {
  let url = `${API_BASE}/messages/${channelId}?limit=40`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }
  const res = await fetch(url, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
  return data;
}

export async function getThreadReplies(token, parentId) {
  const res = await fetch(`${API_BASE}/messages/thread/${parentId}`, {
    headers: getHeaders(token)
  });
  return await res.json();
}

export async function searchMessages(token, query, channelId = null) {
  let url = `${API_BASE}/messages/search/all?q=${encodeURIComponent(query)}`;
  if (channelId) url += `&channelId=${channelId}`;
  const res = await fetch(url, {
    headers: getHeaders(token)
  });
  return await res.json();
}

export async function uploadFile(token, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON error: ${res.status} ${text.substring(0, 100)}`);
  }
  
  if (!res.ok) throw new Error(data.error || 'File upload failed');
  return data;
}

export async function deleteMessage(token, messageId) {
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Server route returned non-JSON (${res.status}). Please ensure node server.js is restarted.`);
  }
  if (!res.ok) throw new Error(data.error || 'Failed to delete message');
  return data;
}

export async function deleteChannel(token, channelId) {
  const res = await fetch(`${API_BASE}/channels/${channelId}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Server route returned non-JSON (${res.status}). Please ensure node server.js is restarted.`);
  }
  if (!res.ok) throw new Error(data.error || 'Failed to delete channel');
  return data;
}

export async function verifyAdmin(token) {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin verification failed');
  return data;
}

export async function getAdminOverview(token) {
  const res = await fetch(`${API_BASE}/admin/overview`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin overview');
  return data;
}

export async function getAdminHealth(token) {
  const res = await fetch(`${API_BASE}/admin/health`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch system health');
  return data;
}

export async function getAdminAnalytics(token, params = {}) {
  const query = new URLSearchParams();
  if (params.range) query.set('range', params.range);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/admin/analytics?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics data');
  return data;
}

export async function getAdminUsers(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.role && params.role !== 'all') query.set('role', params.role);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetch(`${API_BASE}/admin/users?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
}

export async function getAdminUserDetails(token, userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user details');
  return data;
}

export async function updateAdminUserRole(token, userId, role, reason = '') {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ role, reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user role');
  return data;
}

export async function updateAdminUserStatus(token, userId, action, reason = '') {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ action, reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user account status');
  return data;
}

export async function getAdminChannels(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetch(`${API_BASE}/admin/channels?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch channels');
  return data;
}

export async function getAdminChannelDetails(token, channelId) {
  const res = await fetch(`${API_BASE}/admin/channels/${channelId}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch channel details');
  return data;
}

export async function archiveAdminChannel(token, channelId, archive, reason = '') {
  const res = await fetch(`${API_BASE}/admin/channels/${channelId}/archive`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ archive, reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update channel archive state');
  return data;
}

export async function deleteAdminChannel(token, channelId, confirmationName, reason = '') {
  const res = await fetch(`${API_BASE}/admin/channels/${channelId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
    body: JSON.stringify({ confirmationName, reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete channel');
  return data;
}

// ─── Moderation & Reports API (Part 3) ──────────────────────────────────────

export async function getAdminReports(token, {
  page = 1,
  limit = 10,
  status = 'all',
  category = 'all',
  targetType = 'all',
  priority = 'all',
  search = '',
  startDate = '',
  endDate = '',
  sortBy = 'createdAt',
  sortOrder = 'desc'
} = {}) {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (status && status !== 'all') params.append('status', status);
  if (category && category !== 'all') params.append('category', category);
  if (targetType && targetType !== 'all') params.append('targetType', targetType);
  if (priority && priority !== 'all') params.append('priority', priority);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);

  const res = await fetch(`${API_BASE}/admin/reports?${params.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
  return data;
}

export async function getAdminReportDetails(token, reportId) {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch report details');
  return data;
}

export async function assignAdminReport(token, reportId, { assignToMe = true, assigneeId = null } = {}) {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}/assign`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ assignToMe, assigneeId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to assign report');
  return data;
}

export async function updateAdminReportStatus(token, reportId, { status, resolution = '', outcome = '', notes = '' }) {
  const res = await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status, resolution, outcome, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update report status');
  return data;
}

export async function warnAdminUser(token, { userId, reason, reportId = null }) {
  const res = await fetch(`${API_BASE}/admin/moderation/warn`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ userId, reason, reportId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to issue warning');
  return data;
}

export async function suspendAdminUser(token, { userId, reason, durationHours = null, reportId = null }) {
  const res = await fetch(`${API_BASE}/admin/moderation/suspend`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ userId, reason, durationHours, reportId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to suspend user');
  return data;
}

export async function restoreAdminUser(token, { userId, reason = '', reportId = null }) {
  const res = await fetch(`${API_BASE}/admin/moderation/restore`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ userId, reason, reportId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to restore user');
  return data;
}

export async function restrictAdminMessage(token, { messageId, reason, reportId = null }) {
  const res = await fetch(`${API_BASE}/admin/moderation/restrict-message`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ messageId, reason, reportId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to restrict message');
  return data;
}

export async function restrictAdminChannel(token, { channelId, reason, reportId = null }) {
  const res = await fetch(`${API_BASE}/admin/moderation/restrict-channel`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ channelId, reason, reportId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to restrict channel');
  return data;
}

export async function getAdminAppeals(token, { status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  const res = await fetch(`${API_BASE}/admin/moderation/appeals?${params.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch appeals');
  return data;
}

export async function decideAdminAppeal(token, userId, appealId, { decision, notes = '' }) {
  const res = await fetch(`${API_BASE}/admin/moderation/appeals/${userId}/${appealId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ decision, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to decide appeal');
  return data;
}

export async function submitReport(token, { targetType, targetId, category, description = '' }) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ targetType, targetId, category, description })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit report');
  return data;
}

export async function submitAppeal({ username, email = '', statement }) {
  const res = await fetch(`${API_BASE}/reports/appeal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, statement })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit appeal');
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 5: ANNOUNCEMENTS, SETTINGS & STORAGE API
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicAnnouncements() {
  const res = await fetch(`${API_BASE}/announcements`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch announcements');
  return data;
}

export async function getPublicSettings() {
  const res = await fetch(`${API_BASE}/settings/public`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch public settings');
  return data;
}

export async function getAdminAnnouncements(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.category && params.category !== 'all') query.set('category', params.category);

  const res = await fetch(`${API_BASE}/admin/announcements?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch announcements');
  return data;
}

export async function getAdminAnnouncement(token, id) {
  const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch announcement details');
  return data;
}

export async function createAdminAnnouncement(token, announcementData) {
  const res = await fetch(`${API_BASE}/admin/announcements`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(announcementData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create announcement');
  return data;
}

export async function updateAdminAnnouncement(token, id, announcementData) {
  const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(announcementData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update announcement');
  return data;
}

export async function updateAdminAnnouncementStatus(token, id, status) {
  const res = await fetch(`${API_BASE}/admin/announcements/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update announcement status');
  return data;
}

export async function deleteAdminAnnouncement(token, id) {
  const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete announcement');
  return data;
}

export async function getAdminSettings(token) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch platform settings');
  return data;
}

export async function updateAdminSettings(token, settingsUpdates) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(settingsUpdates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update platform settings');
  return data;
}

export async function getAdminStorageMetrics(token) {
  const res = await fetch(`${API_BASE}/admin/storage/metrics`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch storage metrics');
  return data;
}

export async function getAdminStorageFiles(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.fileType && params.fileType !== 'all') query.set('fileType', params.fileType);
  if (params.usageType && params.usageType !== 'all') query.set('usageType', params.usageType);
  if (params.isOrphan !== undefined && params.isOrphan !== 'all') query.set('isOrphan', params.isOrphan);

  const res = await fetch(`${API_BASE}/admin/storage/files?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch storage files');
  return data;
}

export async function scanAdminStorageOrphans(token) {
  const res = await fetch(`${API_BASE}/admin/storage/scan-orphans`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to scan for orphaned media');
  return data;
}

export async function cleanupAdminStorageOrphan(token, fileId, confirm = true) {
  const res = await fetch(`${API_BASE}/admin/storage/cleanup-orphan`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ fileId, confirm })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to clean up orphaned file');
  return data;
}

export async function getAdminAuditLogs(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.action && params.action !== 'all') query.set('action', params.action);
  if (params.targetType && params.targetType !== 'all') query.set('targetType', params.targetType);
  if (params.result && params.result !== 'all') query.set('result', params.result);
  if (params.actor) query.set('actor', params.actor);
  if (params.targetId) query.set('targetId', params.targetId);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/admin/audit-logs?${query.toString()}`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
  return data;
}



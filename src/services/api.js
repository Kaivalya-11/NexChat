const API_BASE = '/api';

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

export async function getChannels(token) {
  const res = await fetch(`${API_BASE}/api/channels` ? `${API_BASE}/channels` : `${API_BASE}/channels`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch channels');
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

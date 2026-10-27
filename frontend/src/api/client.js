const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: "offline", error: err.message };
  }
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/stats`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Server returned ${res.status}`);
  }
  return await res.json();
}

export async function analyzeMeeting(payload) {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Analysis failed (${res.status})`);
  }
  return await res.json();
}

export async function getMeetings(searchQuery = '') {
  const url = searchQuery 
    ? `${API_BASE_URL}/meetings?q=${encodeURIComponent(searchQuery)}`
    : `${API_BASE_URL}/meetings`;

  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to fetch meetings`);
  }
  return await res.json();
}

export async function getMeetingDetails(id) {
  const res = await fetch(`${API_BASE_URL}/meetings/${id}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to fetch meeting #${id}`);
  }
  return await res.json();
}

export async function updateActionItemStatus(meetingId, itemIndex, newStatus) {
  const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/action_items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index: itemIndex, status: newStatus }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to update status`);
  }
  return await res.json();
}

export async function deleteMeeting(id) {
  const res = await fetch(`${API_BASE_URL}/meetings/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to delete meeting #${id}`);
  }
  return await res.json();
}

export async function getBenchmarkData() {
  const res = await fetch(`${API_BASE_URL}/benchmark`);
  if (!res.ok) {
    throw new Error('Failed to fetch benchmark evaluation data');
  }
  return await res.json();
}

export function getExportTxtUrl(meetingId) {
  return `${API_BASE_URL}/meetings/${meetingId}/export/txt`;
}

export function getExportCsvUrl(meetingId) {
  return `${API_BASE_URL}/meetings/${meetingId}/export/csv`;
}

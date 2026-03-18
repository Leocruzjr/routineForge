const API_BASE = import.meta.env.VITE_API_URL || '/api';

let isRefreshing = false;
let refreshPromise = null;

async function tryRefresh() {
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    isRefreshing = false;
    return res.ok;
  }).catch(() => {
    isRefreshing = false;
    return false;
  });
  return refreshPromise;
}

/**
 * Wrapper around fetch that handles JSON responses, cookies, and error envelopes.
 * Automatically retries once with a token refresh on 401.
 */
async function request(endpoint, options = {}, retried = false) {
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    throw new Error('Unable to connect to server. Please try again.');
  }

  // Auto-refresh on 401 (expired access token)
  if (res.status === 401 && !retried && !endpoint.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(endpoint, options, true);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

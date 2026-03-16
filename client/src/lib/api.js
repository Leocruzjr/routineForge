const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Wrapper around fetch that handles JSON responses, cookies, and error envelopes.
 * @param {string} endpoint - e.g. '/auth/login'
 * @param {RequestInit} options
 * @returns {Promise<{ success: boolean, data: any, error: string | null }>}
 */
async function request(endpoint, options = {}) {
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

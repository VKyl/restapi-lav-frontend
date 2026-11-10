// Thin wrapper around fetch that speaks the backend's conventions:
// trailing-slash URLs, JSON bodies, and errors shaped {"error": {code, message, field?}}.

import { expiresIn, getSession, sessionFromTokens, setSession } from '../auth/session.js';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, { code, message, field } = {}) {
    super(message || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

// Sign-in routes never carry the access token.
const PUBLIC_PATHS = ['/login/', '/register/', '/refresh/'];
// Refresh a little before expiry so a request doesn't die in flight.
export const REFRESH_MARGIN_MS = 30_000;

// One refresh at a time: parallel requests all wait for the same one.
let refreshing = null;

// Swaps the refresh token for a new pair. Returns the new access token, or null.
// Signs out only when the backend rejects the refresh token, not on network/server errors.
export function refreshSession() {
  refreshing ??= (async () => {
    const refresh_token = getSession()?.refresh_token;
    if (!refresh_token) return null;
    try {
      const res = await fetch(`${BASE}/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 401) setSession(null);
        return null;
      }
      const next = sessionFromTokens(await res.json());
      setSession(next);
      return next.token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// The access token to send, refreshed first if it's about to expire.
async function currentToken() {
  const session = getSession();
  if (!session?.token) return null;
  if (expiresIn(session.token) > REFRESH_MARGIN_MS) return session.token;
  return refreshSession();
}

async function request(method, path, { params, body, signal } = {}) {
  let url = BASE + path;
  if (params) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') qs.set(key, value);
    }
    const query = qs.toString();
    if (query) url += `?${query}`;
  }

  const send = (token) => {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { method, signal, headers, body: body ? JSON.stringify(body) : undefined });
  };

  let res;
  try {
    const token = PUBLIC_PATHS.includes(path) ? null : await currentToken();
    res = await send(token);
    // Access token rejected (e.g. revoked, or clocks disagree): refresh once and retry.
    if (res.status === 401 && token) {
      const fresh = await refreshSession();
      if (fresh) res = await send(fresh);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, {
      code: 'network',
      message: "Can't reach the KMArtists server. Check that the API is running.",
    });
  }

  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) throw new ApiError(res.status, data?.error || {});
  return data;
}

const enc = encodeURIComponent;

export const api = {
  auth: {
    // All return { token, refresh_token }; the user is inside the token (see auth/session.js).
    // Body is { login, password } (`login` = username or email) or { microsoft_token }.
    login: (body) => request('POST', '/login/', { body }),
    // Body is { username, first_name, last_name, email } plus either
    // { password, password_confirmation } or { microsoft_token }.
    register: (body) => request('POST', '/register/', { body }),
  },
  artists: {
    list: (params, opts) => request('GET', '/artists/', { params, ...opts }),
    get: (id, opts) => request('GET', `/artists/${enc(id)}/`, opts),
    create: (body) => request('POST', '/artists/', { body }),
    update: (id, body) => request('PUT', `/artists/${enc(id)}/`, { body }),
    remove: (id) => request('DELETE', `/artists/${enc(id)}/`),
  },
  genres: {
    list: (opts) => request('GET', '/genres/', opts),
  },
  events: {
    list: (params, opts) => request('GET', '/events/', { params, ...opts }),
    get: (id, opts) => request('GET', `/events/${enc(id)}/`, opts),
    create: (body) => request('POST', '/events/', { body }),
    update: (id, body) => request('PUT', `/events/${enc(id)}/`, { body }),
    remove: (id) => request('DELETE', `/events/${enc(id)}/`),
  },
  users: {
    musicians: (params, opts) => request('GET', '/users/musicians/', { params, ...opts }),
    get: (id, opts) => request('GET', `/users/${enc(id)}/`, opts),
    articles: (id, params, opts) => request('GET', `/users/${enc(id)}/articles/`, { params, ...opts }),
    update: (id, body) => request('PUT', `/users/${enc(id)}/`, { body }),
  },
};

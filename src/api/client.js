// Thin wrapper around fetch that speaks the backend's conventions:
// trailing-slash URLs, JSON bodies, and errors shaped {"error": {code, message, field?}}.

import { getSession, setSession } from '../auth/session.js';

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

  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
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
  // Session expired or revoked: sign the user out locally.
  if (res.status === 401 && token) setSession(null);
  if (!res.ok) throw new ApiError(res.status, data?.error || {});
  return data;
}

const enc = encodeURIComponent;

export const api = {
  auth: {
    // Body is either { username, password } or { microsoft_token }. Returns { token, user }.
    login: (body) => request('POST', '/login/', { body }),
    // Body is { username, first_name, last_name, email } plus either
    // { password, password_confirmation } or { microsoft_token }. Returns { token, user }.
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

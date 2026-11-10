// The KMArtists session from /login, /register or /refresh: { token, refresh_token, user }.
// `token` is a short-lived access token (15 min) and `refresh_token` lasts 7 days; both are
// JWTs whose payload carries the user: { id, username, first_name, last_name, type, iat, exp }.
// Kept in localStorage so it survives reloads; AuthContext listens for changes.

const KEY = 'kma.session';
export const SESSION_EVENT = 'kma:session';

// Reads a JWT's payload without verifying it (only the backend can do that).
// Decodes as UTF-8 so Cyrillic names come through intact.
export function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// Milliseconds until the token expires (negative = already expired).
export const expiresIn = (token) => (decodeJwt(token)?.exp ?? 0) * 1000 - Date.now();

// Backend response { token, refresh_token } → session with the user read from the token.
export function sessionFromTokens({ token, refresh_token }) {
  const p = decodeJwt(token) || {};
  return {
    token,
    refresh_token,
    user: { id: p.id, username: p.username, first_name: p.first_name || '', last_name: p.last_name || '' },
  };
}

export function getSession() {
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
  // Once the refresh token has expired there's nothing left to renew: treat as signed out.
  if (session && (!session.refresh_token || expiresIn(session.refresh_token) <= 0)) {
    setSession(null);
    return null;
  }
  return session;
}

export function setSession(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the session just won't survive a reload.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

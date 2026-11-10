// The KMArtists session the backend hands out on /login or /register: { token, user }.
// Kept in localStorage so it survives reloads; AuthContext listens for changes.

const KEY = 'kma.session';
export const SESSION_EVENT = 'kma:session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
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

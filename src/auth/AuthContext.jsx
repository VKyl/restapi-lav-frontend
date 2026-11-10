import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { REFRESH_MARGIN_MS, api, refreshSession } from '../api/client.js';
import { clearMicrosoftSession, getAccount, getMicrosoftToken, microsoftEnabled, startMicrosoftSignIn } from './msal.js';
import { SESSION_EVENT, expiresIn, getSession, sessionFromTokens, setSession } from './session.js';

// Two separate things:
// - `user`: the KMArtists user, read from the backend's access token (see session.js).
// - `account`: a Microsoft account connected in this browser (only for the Microsoft option).

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(getSession);
  const [account, setAccount] = useState(getAccount);

  // Picks up changes from anywhere, e.g. the API client dropping an expired session.
  useEffect(() => {
    const sync = () => setSessionState(getSession());
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Calls /refresh/ just before the access token expires, so it's renewed even when idle.
  // A successful refresh updates the session, which reschedules this for the new token.
  const token = session?.token;
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return undefined;
    let timer;
    const run = async () => {
      const fresh = await refreshSession();
      // Network or server hiccup (still signed in): try again shortly.
      if (!fresh && getSession()) timer = setTimeout(() => setRetry((n) => n + 1), 30_000);
    };
    timer = setTimeout(run, Math.max(0, expiresIn(token) - REFRESH_MARGIN_MS));

    // Timers stall while the laptop sleeps or the tab is in the background: catch up on return.
    const onWake = () => {
      if (document.visibilityState === 'visible' && expiresIn(token) <= REFRESH_MARGIN_MS) {
        clearTimeout(timer);
        run();
      }
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [token, retry]);

  // Backend answers { token, refresh_token }; the user comes from the token's payload.
  const start = (res) => {
    const session = sessionFromTokens(res);
    setSession(session);
    return session.user;
  };

  const microsoftToken = async () => {
    const token = await getMicrosoftToken();
    if (!token) throw { message: 'Your Microsoft session expired. Please continue with Microsoft again.', code: 'microsoft_expired' };
    return token;
  };

  // `login` is a username or an email.
  const loginWithPassword = useCallback(async ({ login, password }) => start(await api.auth.login({ login: login.trim(), password })), []);

  // Microsoft sign-in sends only the Microsoft ID token; the backend finds the user from it.
  const loginWithMicrosoft = useCallback(async () => {
    const microsoft_token = await microsoftToken();
    return start(await api.auth.login({ microsoft_token }));
  }, []);

  const register = useCallback(async (form) => start(await api.auth.register(form)), []);

  const registerWithMicrosoft = useCallback(
    async ({ username, first_name, last_name, email }) =>
      start(await api.auth.register({ username, first_name, last_name, email, microsoft_token: await microsoftToken() })),
    [],
  );

  const forgetMicrosoft = useCallback(async () => {
    await clearMicrosoftSession();
    setAccount(null);
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    await forgetMicrosoft();
  }, [forgetMicrosoft]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      account,
      microsoftEnabled,
      loginWithPassword,
      loginWithMicrosoft,
      register,
      registerWithMicrosoft,
      signInWithMicrosoft: startMicrosoftSignIn,
      forgetMicrosoft,
      logout,
    }),
    [session, account, loginWithPassword, loginWithMicrosoft, register, registerWithMicrosoft, forgetMicrosoft, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const displayName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || '';

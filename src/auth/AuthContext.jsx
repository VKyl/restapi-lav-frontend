import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { clearMicrosoftSession, getAccount, getMicrosoftToken, microsoftEnabled, startMicrosoftSignIn } from './msal.js';
import { SESSION_EVENT, getSession, setSession } from './session.js';

// Two separate things:
// - `user`: the KMArtists user, from the backend session ({ token, user }).
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

  const start = (res) => {
    setSession({ token: res.token, user: res.user });
    return res.user;
  };

  const microsoftToken = async () => {
    const token = await getMicrosoftToken();
    if (!token) throw { message: 'Your Microsoft session expired. Please continue with Microsoft again.', code: 'microsoft_expired' };
    return token;
  };

  const loginWithPassword = useCallback(async ({ username, password }) => start(await api.auth.login({ username, password })), []);

  const loginWithMicrosoft = useCallback(async () => start(await api.auth.login({ microsoft_token: await microsoftToken() })), []);

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

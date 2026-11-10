// Microsoft sign-in (Entra ID) via MSAL, using the auth code + PKCE flow in the browser.
// Microsoft only proves who the person is: the frontend sends the Microsoft ID token
// to /login or /register once, and the backend answers with its own session token.
// If VITE_MS_CLIENT_ID is not set, the Microsoft option is hidden.

import { BrowserCacheLocation, PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MS_CLIENT_ID;
// "common" = personal + work/school accounts, "consumers" = personal only,
// "organizations" = any work/school account, or a tenant ID for one organization.
const tenant = import.meta.env.VITE_MS_TENANT_ID || 'common';

export const microsoftEnabled = Boolean(clientId);

export const msal = microsoftEnabled
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenant}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: BrowserCacheLocation.LocalStorage },
    })
  : null;

const scopes = ['openid', 'profile', 'email'];

// What the user was doing when they left for Microsoft ("login" or "register"),
// so the page they come back to can finish the job.
const INTENT_KEY = 'kma.authIntent';

// Call once before rendering. Restores the Microsoft account after a reload or redirect.
export async function initAuth() {
  if (!msal) return;
  await msal.initialize();
  let result = null;
  try {
    result = await msal.handleRedirectPromise();
  } catch (err) {
    // Microsoft sent back an error instead of a sign-in. Keep it for the sign-in page to show,
    // and make sure the user lands back on the page they started from.
    console.error('Microsoft sign-in failed:', err);
    redirectError = err;
    const intent = sessionStorage.getItem(INTENT_KEY);
    if (intent && !location.pathname.startsWith(`/${intent}`)) history.replaceState(null, '', `/${intent}`);
  }
  const account = result?.account || msal.getActiveAccount() || msal.getAllAccounts()[0];
  if (account) msal.setActiveAccount(account);
}

let redirectError = null;

// The error from the last Microsoft redirect (once), as a readable message, or null.
export function takeRedirectError() {
  const err = redirectError;
  redirectError = null;
  if (!err) return null;
  const detail = (err.errorMessage || err.message || '').split(/\s*Trace ID/)[0].trim();
  return { message: `Microsoft sign-in failed (${err.errorCode || 'error'}): ${detail || 'no details given.'}` };
}

export const getAccount = () => msal?.getActiveAccount() ?? null;

export function startMicrosoftSignIn(intent, { chooseAccount = false } = {}) {
  sessionStorage.setItem(INTENT_KEY, intent);
  return msal.loginRedirect({
    scopes,
    prompt: chooseAccount ? 'select_account' : undefined,
    redirectStartPage: window.location.href,
  });
}

export function takeIntent() {
  const intent = sessionStorage.getItem(INTENT_KEY);
  sessionStorage.removeItem(INTENT_KEY);
  return intent;
}

// A fresh Microsoft ID token (audience = client ID) for the backend to verify,
// or null if the Microsoft session expired and the user must sign in again.
export async function getMicrosoftToken() {
  const account = getAccount();
  if (!account) return null;
  try {
    const { idToken } = await msal.acquireTokenSilent({ scopes, account });
    return idToken || null;
  } catch {
    return null;
  }
}

// Forgets the Microsoft account in this browser only (doesn't sign out of Microsoft everywhere).
export async function clearMicrosoftSession() {
  if (!msal) return;
  await msal.clearCache();
  msal.setActiveAccount(null);
}

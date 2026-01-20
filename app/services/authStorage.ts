/**
 * Safe auth token storage helper
 * - Avoids accessing window.localStorage at module import time
 * - Exposes async-friendly functions that throw on error so callers can surface UI errors
 */

export const TOKEN_KEY = 'auth_token';

/**
 * Probe localStorage availability safely.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch (e) {
    // Access to localStorage can throw in some environments (private mode, restricted iframe)
    return false;
  }
}

/**
 * Read token from storage. Throws on storage errors so callers can handle and show error UI.
 */
export async function getToken(): Promise<string | null> {
  if (!isLocalStorageAvailable()) {
    throw new Error('storage-unavailable');
  }
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (raw === null) return null;
    if (typeof raw !== 'string') throw new Error('invalid-token-format');
    const t = raw.trim();
    return t === '' ? null : t;
  } catch (e) {
    console.error('authStorage.getToken error', e);
    throw e;
  }
}

/**
 * Persist token. Throws on failure.
 */
export async function saveToken(token: string): Promise<void> {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('invalid-token');
  }
  if (!isLocalStorageAvailable()) {
    throw new Error('storage-unavailable');
  }
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('authStorage.saveToken error', e);
    throw e;
  }
}

/**
 * Remove token. Throws on failure.
 */
export async function removeToken(): Promise<void> {
  if (!isLocalStorageAvailable()) {
    throw new Error('storage-unavailable');
  }
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('authStorage.removeToken error', e);
    throw e;
  }
}

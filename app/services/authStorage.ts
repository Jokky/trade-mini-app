/**
 * authStorage.ts
 * Minimal storage abstraction for auth token persistence.
 * Uses localStorage for web builds. Replace with secure storage for native apps.
 */

export const TOKEN_KEY = 'auth_token';

export interface IAuthStorage {
  getToken(): Promise<string | null>;
  saveToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
}

const storageAvailable = typeof window !== 'undefined' && !!window.localStorage;

/**
 * Simple localStorage-backed implementation.
 * TODO: swap to SecureStore/Keychain for mobile/native builds
 */
export const authStorage: IAuthStorage = {
  async getToken() {
    if (!storageAvailable) return null;
    try {
      const v = localStorage.getItem(TOKEN_KEY);
      if (!v) return null;
      if (typeof v !== 'string') return null;
      return v;
    } catch (err) {
      console.error('authStorage.getToken error', err);
      return null;
    }
  },

  async saveToken(token: string) {
    if (!storageAvailable) throw new Error('Storage not available');
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.error('authStorage.saveToken error', err);
      throw err;
    }
  },

  async removeToken() {
    if (!storageAvailable) return;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      console.error('authStorage.removeToken error', err);
    }
  }
};

import React, { useEffect, useState } from 'react';
import { authStorage } from '../services/authStorage';

/**
 * AuthGate component
 * - On mount, performs async check for saved token
 * - Shows loading placeholder until check completes (prevents flash)
 * - If token exists -> render Portfolio placeholder
 * - If no token -> render Add Token form and persist on Save
 *
 * TODO: Replace Portfolio placeholder with real Portfolio screen and
 * integrate with app-wide auth/session management.
 */
export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [tokenExists, setTokenExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await authStorage.getToken();
        if (!mounted) return;
        setTokenExists(!!token);
      } catch (err) {
        console.error('AuthGate startup error', err);
        setError('Failed to read stored token. Please enter token.');
        setTokenExists(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    // Prevent flash of wrong screen by waiting for async storage check
    return <div>Loading...</div>;
  }

  if (tokenExists) {
    // TODO: replace this placeholder with the actual Portfolio screen component
    return <div>Portfolio screen (token present)</div>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = input.trim();
    if (!t) {
      setError('Token must not be empty');
      return;
    }
    try {
      await authStorage.saveToken(t);
      // Immediately navigate/render portfolio
      setTokenExists(true);
    } catch (err) {
      console.error('AuthGate save token error', err);
      setError('Failed to save token. Please try again.');
    }
  }

  return (
    <div>
      <h2>Add Token</h2>
      <form onSubmit={handleSave}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste auth token"
        />
        <button type="submit">Save</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

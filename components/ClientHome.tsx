'use client'
import React, { useEffect, useState } from 'react';
import { STORAGE_TOKEN_KEY } from '../constants/storage';

/**
 * TokenInput props
 */
interface TokenInputProps { onSubmit: (token: string) => void; initialError?: string; }

/** TokenInput component */
function TokenInput({ onSubmit, initialError }: TokenInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => { setError(initialError ?? null); }, [initialError]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) { setError('Token cannot be empty'); return; }
    onSubmit(trimmed);
  };

  return (
    <div>
      <label>Token:</label>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
      />
      <button onClick={submit}>Submit</button>
      {error && <div role={'alert'}>{error}</div>}
    </div>
  );
}

type PortfolioData = { items: any[] };

/**
 * Portfolio component: fetches portfolio using provided token.
 * TODO: Replace the fetch call with the project's API client if one exists.
 */
function Portfolio({ token, onInvalidToken }: { token: string; onInvalidToken: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToggle, setRetryToggle] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    // TODO: Ensure Authorization header exactly 'Bearer <token>' and integrate with API client
    fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!mounted) return;
        if (res.status === 401 || res.status === 403) {
          // invalid token -> clear storage in parent via callback
          onInvalidToken();
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          setError(text || 'Unknown error fetching portfolio');
          return;
        }
        return res.json();
      })
      .then(json => {
        if (!mounted) return;
        if (json) setData(json as PortfolioData);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err?.message || 'Network error');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [token, onInvalidToken, retryToggle]);

  if (loading) return <div>Loading portfolio...</div>;
  if (error) return (
    <div>
      <div role={'alert'}>Error: {error}</div>
      <button onClick={() => { setRetryToggle(x => x + 1); }}>Retry</button>
      {/* TODO: More nuanced retry/backoff UX and error classification */}
    </div>
  );
  return (
    <div>
      <h2>Portfolio</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

/**
 * ClientHome - client-only home component that reads token from localStorage and shows TokenInput or Portfolio.
 * - Reads localStorage only inside useEffect to avoid SSR/hydration issues
 * - Treats null/undefined/empty/whitespace as no token
 */
export default function ClientHome() {
  const [token, setToken] = useState<string | null>(null);
  const [initialError, setInitialError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
    const t = raw ? raw.trim() : null;
    setToken(t && t !== '' ? t : null);
  }, []);

  const handleSubmit = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) { setInitialError('Token cannot be empty'); return; }
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, trimmed);
      setToken(trimmed);
    } catch (e) {
      setInitialError('Unable to save token');
    }
  };

  const handleInvalid = () => {
    try { localStorage.removeItem(STORAGE_TOKEN_KEY); } catch (e) { /* ignore */ }
    setInitialError('Token invalid or expired. Please re-enter.');
    setToken(null);
  };

  return (
    <div>
      {!token ? (
        <TokenInput onSubmit={handleSubmit} initialError={initialError} />
      ) : (
        <Portfolio token={token} onInvalidToken={handleInvalid} />
      )}
    </div>
  );
}

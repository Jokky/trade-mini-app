'use client'

import React, { useEffect, useState } from 'react';

const STORAGE_TOKEN_KEY = 'authToken';

/**
 * ClientHome - client component that shows TokenInput or Portfolio
 */
export default function ClientHome() {
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (stored && stored.trim() !== '') {
        setToken(stored);
        fetchPortfolio(stored);
      }
    } catch (e) {
      console.error('Error reading token from storage', e);
    } finally {
      setInitializing(false);
    }
  }, []);

  async function fetchPortfolio(currentToken: string) {
    setLoading(true);
    setError(null);
    setPortfolio(null);
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken(null);
        setError('Token is invalid or expired. Please enter a new token.');
        return;
      }
      if (!res.ok) {
        setError(`Failed to fetch portfolio (${res.status}).`);
        return;
      }
      const data = await res.json(); // TODO: validate shape
      setPortfolio(data);
    } catch (err) {
      console.error('Network error fetching portfolio', err);
      setError('Network error fetching portfolio. You can retry.');
    } finally {
      setLoading(false);
    }
  }

  function handleTokenSubmit(value: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
      setError('Please enter a non-empty token.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, trimmed);
      setToken(trimmed);
      fetchPortfolio(trimmed);
    } catch (e) {
      console.error('Error saving token', e);
      setError('Unable to save token locally.');
    }
  }

  if (initializing) return <div>Loading...</div>;

  if (!token) {
    return (
      <div>
        <TokenInput onSubmit={handleTokenSubmit} error={error} />
      </div>
    );
  }

  return (
    <div>
      {loading && <div>Loading portfolio...</div>}
      {error && (
        <div>
          <div style={{ color: 'red' }}>{error}</div>
          {!/invalid|expired/i.test(error) && (
            <button onClick={() => fetchPortfolio(token)} disabled={loading}>
              Retry
            </button>
          )}
        </div>
      )}
      {portfolio && <pre>{JSON.stringify(portfolio, null, 2)}</pre>}
    </div>
  );
}

/**
 * TokenInput - small accessible form that submits on Enter
 */
function TokenInput({ onSubmit, error }: { onSubmit: (t: string) => void; error?: string | null }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label>
        Enter API Token:
        <input value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <button type="submit">Submit</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}

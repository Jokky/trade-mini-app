"use client";
import React, { useEffect, useState } from 'react';
import { STORAGE_TOKEN_KEY } from '../constants/storage';

/**
 * ClientHome
 * Minimal client-side scaffold that reads token from localStorage and conditionally
 * renders TokenInput or Portfolio. Complex network/error logic is marked TODO.
 */

type PortfolioData = any; // TODO: replace with a concrete interface matching API response

export default function ClientHome() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    // Client-only read of localStorage
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
    const t = raw ? raw.trim() : null;
    setToken(t && t !== '' ? t : null);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setPortfolio(null);

    // TODO: Replace the timeout with a real fetch to /api/portfolio
    // - Include Authorization: `Bearer ${token}` header
    // - On 200: setPortfolio(parsed)
    // - On 401/403: remove token from localStorage, setToken(null), setError('Token invalid')
    // - On other errors: setError and allow retry without removing token
    const id = setTimeout(() => {
      setPortfolio({ items: [] });
      setLoading(false);
    }, 150);

    return () => clearTimeout(id);
  }, [token]);

  function handleSubmit(raw: string) {
    const t = raw.trim();
    if (!t) {
      setError('Token cannot be empty');
      return;
    }
    // Persist token and trigger portfolio fetch
    localStorage.setItem(STORAGE_TOKEN_KEY, t);
    setToken(t);
  }

  function handleInvalidate() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setToken(null);
    setPortfolio(null);
    setError('Token invalid or expired');
  }

  return (
    <div>
      <h1>Welcome</h1>
      {!token ? (
        <TokenInput onSubmit={handleSubmit} error={error} />
      ) : loading ? (
        <div>Loading portfolio...</div>
      ) : error ? (
        <div>
          <div>{error}</div>
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      ) : (
        <PortfolioView data={portfolio} onInvalidToken={handleInvalidate} />
      )}
    </div>
  );
}

function TokenInput({ onSubmit, error }: { onSubmit: (s: string) => void; error?: string | null }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor="token">Token</label>
      <input id="token" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="submit">Submit</button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}

function PortfolioView({ data, onInvalidToken }: { data: PortfolioData | null; onInvalidToken: () => void }) {
  // TODO: implement real portfolio rendering and handle API error codes
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {/* Helper during development: simulate invalid token flow */}
      <button onClick={onInvalidToken}>Simulate Invalid Token</button>
    </div>
  );
}

'use client'

import React, { useEffect, useState } from 'react';
import { STORAGE_TOKEN_KEY } from '../constants/storage';

/** Minimal portfolio item shape - expand to match backend contract */
export interface PortfolioItem {
  id: string;
  name: string;
  value: number;
}

export interface PortfolioData {
  items: PortfolioItem[];
}

/**
 * TokenInput - simple controlled form that trims input and validates non-empty values.
 */
export const TokenInput: React.FC<{
  onSubmit: (token: string) => void;
  error?: string | null;
}> = ({ onSubmit, error }) => {
  const [value, setValue] = useState('');
  const [validation, setValidation] = useState<string | null>(null);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setValidation('Please enter a token');
      return;
    }
    setValidation(null);
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="token-input">Token</label>
      <input
        id="token-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter token"
        aria-label="token"
      />
      <button type="submit">Submit</button>
      {validation && <div role="alert">{validation}</div>}
      {error && <div role="alert">{error}</div>}
    </form>
  );
};

/**
 * ClientHome - client-only component that reads token from localStorage and
 * conditionally renders TokenInput or Portfolio. Uses STORAGE_TOKEN_KEY.
 * TODO: Add stricter typing/validation for portfolio response and tests.
 */
const ClientHome: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    // Client-only read of localStorage
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
      const t = raw ? raw.trim() : null;
      setToken(t && t.length > 0 ? t : null);
    } catch (e) {
      // Ignore localStorage access errors but log for diagnostics
      // eslint-disable-next-line no-console
      console.error('Failed to read token from storage', e);
      setToken(null);
    }
  }, []);

  async function fetchPortfolio(forcedToken?: string) {
    const t = forcedToken ?? token;
    if (!t) return;
    setLoading(true);
    setError(null);
    setPortfolio(null);

    // TODO: use AbortController to support cancellation on unmount
    try {
      const res = await fetch('/api/portfolio', {
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        // invalid/expired token -> clear storage and reset token state
        try {
          localStorage.removeItem(STORAGE_TOKEN_KEY);
        } catch (e) {
          // ignore
        }
        setToken(null);
        setError('Token invalid or expired. Please re-enter your token.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError('Failed to load portfolio. Please try again.');
        setLoading(false);
        return;
      }

      // Basic JSON parsing - validate shape in tests / expand as needed
      const data = (await res.json()) as PortfolioData;
      setPortfolio(data);
    } catch (err) {
      setError('Network error while fetching portfolio.');
    } finally {
      setLoading(false);
    }
  }

  function handleTokenSubmit(newToken: string) {
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to write token to storage', e);
    }
    setToken(newToken);
    void fetchPortfolio(newToken);
  }

  // If token present on client load, auto-fetch portfolio
  useEffect(() => {
    if (token) void fetchPortfolio(token);
  }, [token]);

  if (!token) {
    return <TokenInput onSubmit={handleTokenSubmit} error={error} />;
  }

  return (
    <div>
      <h1>Portfolio</h1>
      {loading && <div>Loading...</div>}
      {error && (
        <div>
          <div role="alert">{error}</div>
          <button
            onClick={() => {
              setError(null);
              void fetchPortfolio();
            }}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}
      {portfolio && (
        <ul>
          {portfolio.items.map((it) => (
            <li key={it.id}>{it.name}: {it.value}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientHome;

'use client'

import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_TOKEN_KEY } from '../constants/storage';

interface PortfolioData {
  items?: unknown[];
}

/**
 * ClientHome: client-only component that reads token from localStorage,
 * lets the user submit a token, and fetches the portfolio using
 * Authorization: 'Bearer <token>'.
 *
 * NOTE: This is a minimal, well-typed scaffold. TODOs mark where
 * tests, richer error handling, and stronger response validation
 * should be added.
 */
export default function ClientHome(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // client-only localStorage read
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
    const t = raw ? raw.trim() : null;
    if (!t) return;
    setToken(t);
    // attempt initial fetch
    void fetchPortfolio(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch portfolio with Authorization header.
   * Handles 200 / 401|403 (invalidates token) / other errors.
   */
  async function fetchPortfolio(forcedToken?: string) {
    const active = forcedToken ?? token;
    if (!active) return;
    setLoading(true);
    setError(null);
    setPortfolio(null);

    // cancel previous
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${active}` },
        signal: ac.signal,
      });

      if (res.status === 401 || res.status === 403) {
        // invalid token -> remove and surface TokenInput
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken(null);
        setError('Token invalid or expired. Please enter a new token.');
        return;
      }

      if (!res.ok) {
        setError('Failed to load portfolio. Please try again.');
        return;
      }

      // TODO: validate shape instead of assuming JSON
      const data = await res.json();
      setPortfolio(data as PortfolioData);
    } catch (e: unknown) {
      if ((e as any)?.name === 'AbortError') {
        // ignore
      } else {
        setError('Network error. Please check connection and retry.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Token must not be empty');
      return;
    }
    localStorage.setItem(STORAGE_TOKEN_KEY, trimmed);
    setToken(trimmed);
    setInput('');
    void fetchPortfolio(trimmed);
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div>
      <h1>Welcome</h1>

      {!token && (
        <form onSubmit={handleSubmit}>
          <label htmlFor="token-input">Token</label>
          <input
            id="token-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="auth token"
          />
          <button type="submit">Submit</button>
          {error && <div role="alert">{error}</div>}
        </form>
      )}

      {token && (
        <section>
          {loading && <div>Loading portfolio…</div>}

          {error && (
            <div>
              <div role="alert">{error}</div>
              <button
                onClick={() => {
                  // retry using stored token
                  void fetchPortfolio();
                }}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          )}

          {portfolio && (
            <pre data-testid="portfolio">{JSON.stringify(portfolio, null, 2)}</pre>
          )}
        </section>
      )}

      {/* TODO: add unit & integration tests covering: token-absent, token-submit (Enter),
          Authorization header assertion, loading state, 401/403 invalidation, retry flow.
          Add stronger response typing and snapshot tests for header/title styling. */}
    </div>
  );
}

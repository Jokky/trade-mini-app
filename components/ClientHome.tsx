"use client";

import React, { useEffect, useState } from 'react';

/** Storage key for client token */
const STORAGE_TOKEN_KEY = 'authToken';

/** Minimal portfolio shape for type-safety */
export interface PortfolioItem {
  id: string;
  name: string;
  value: number;
}

export default function ClientHome(): JSX.Element {
  const [token, setToken] = useState<string | null>(null); // null = unknown until checked
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[] | null>(null);

  useEffect(() => {
    // Read token on client only
    const stored = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!stored || stored.trim() === '') {
      setToken(''); // treat empty as no token
    } else {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (token && token.trim() !== '') {
      fetchPortfolio(token);
    }
    // if token === '' => show token input
  }, [token]);

  async function fetchPortfolio(currentToken: string) {
    setLoading(true);
    setError(null);
    setPortfolio(null);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        // invalid/expired token
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken('');
        setError('Token invalid or expired. Please enter a new token.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      // Parse JSON safely
      let data: unknown;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Unexpected response format from server');
      }

      // TODO: stronger validation of data shape
      if (Array.isArray(data)) {
        setPortfolio(data as PortfolioItem[]);
      } else {
        setPortfolio([]);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }

  function saveToken(newToken: string) {
    localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
    setToken(newToken);
  }

  return (
    <section>
      {token === null ? (
        <div>Loading...</div>
      ) : token === '' ? (
        <TokenInput onSubmit={(t) => saveToken(t)} error={error} />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Portfolio</h2>
            <div>
              <button
                onClick={() => {
                  localStorage.removeItem(STORAGE_TOKEN_KEY);
                  setToken('');
                }}
                className="text-sm text-red-600"
              >
                Sign out
              </button>
            </div>
          </div>

          {loading ? (
            <div>Loading portfolio...</div>
          ) : error ? (
            <div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => token && fetchPortfolio(token)}
                className="mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded"
              >
                Retry
              </button>
            </div>
          ) : portfolio ? (
            <ul>
              {portfolio.length === 0 ? (
                <li>No items</li>
              ) : (
                portfolio.map((p) => (
                  <li key={p.id} className="py-1">
                    {p.name}: ${p.value}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Small TokenInput component with Enter support */
function TokenInput({
  onSubmit,
  error,
}: {
  onSubmit: (token: string) => void;
  error?: string | null;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const t = value?.trim();
    if (!t) return setValue('');
    onSubmit(t);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block">
        <span className="sr-only">API Token</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter API token"
          className="w-full border px-3 py-2"
        />
      </label>
      {error ? <div className="text-red-600">{error}</div> : null}
      <div>
        <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
          Submit
        </button>
      </div>
    </form>
  );
}

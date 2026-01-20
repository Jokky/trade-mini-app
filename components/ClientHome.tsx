"use client"
import React, { useEffect, useState } from 'react'

/**
 * ClientHome handles token detection (localStorage) and conditional rendering
 * It renders TokenInput when no valid token, or Portfolio when token is present.
 */
export default function ClientHome(): JSX.Element {
  const [token, setToken] = useState<string | null | 'unknown'>('unknown')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<any | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('authToken')
      const normalized = raw && raw.trim() ? raw.trim() : null
      console.debug('[ClientHome] token from storage:', normalized)
      setToken(normalized)
      if (normalized) void fetchPortfolio(normalized)
    } catch (e) {
      console.error('[ClientHome] error reading token', e)
      setToken(null)
    }
  }, [])

  async function fetchPortfolio(tkn: string) {
    setLoading(true)
    setError(null)
    setPortfolio(null)
    try {
      // TODO: Replace '/api/portfolio' with the real backend endpoint if different
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${tkn}` },
      })
      if (res.status === 401 || res.status === 403) {
        console.warn('[ClientHome] token invalid or expired')
        localStorage.removeItem('authToken')
        setToken(null)
        setError('Token invalid or expired. Please enter a new token.')
        return
      }
      if (!res.ok) {
        throw new Error(`Network error: ${res.status}`)
      }
      const data = await res.json()
      setPortfolio(data)
    } catch (e: any) {
      console.error('[ClientHome] fetch error', e)
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(tokenValue: string) {
    const normalized = tokenValue && tokenValue.trim() ? tokenValue.trim() : null
    if (!normalized) {
      setError('Please provide a non-empty token')
      return
    }
    try {
      localStorage.setItem('authToken', normalized)
      setToken(normalized)
      void fetchPortfolio(normalized)
    } catch (e) {
      console.error('[ClientHome] error saving token', e)
      setError('Failed to save token locally')
    }
  }

  if (token === 'unknown') {
    return <div>Loading...</div>
  }

  if (!token) {
    return (
      <div>
        <h2>Enter token</h2>
        <TokenInput onSubmit={handleSubmit} error={error} />
      </div>
    )
  }

  return (
    <div>
      <h2>Portfolio</h2>
      {loading && <div>Loading portfolio...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {portfolio ? (
        <pre>{JSON.stringify(portfolio, null, 2)}</pre>
      ) : (
        !loading && <div>No portfolio data. Try refreshing or re-submitting token.</div>
      )}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => {
            localStorage.removeItem('authToken')
            setToken(null)
            setPortfolio(null)
            setError(null)
            console.info('[ClientHome] token cleared by user')
          }}
        >
          Clear token
        </button>
      </div>
    </div>
  )
}

/**
 * Minimal TokenInput component
 */
function TokenInput({ onSubmit, error }: { onSubmit: (t: string) => void; error?: string | null }) {
  const [value, setValue] = useState('')
  return (
    <div>
      <input
        aria-label="token-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter token"
      />
      <button onClick={() => onSubmit(value)}>Submit</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}

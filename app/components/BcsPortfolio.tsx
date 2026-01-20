'use client';
import { useState, useEffect, useCallback } from 'react';
import { BcsPortfolio, BcsPosition } from '@/app/lib/bcs/types';

const BCS_AUTH_URL = 'https://oauth.bcs.ru/authorize';
const CLIENT_ID = process.env.NEXT_PUBLIC_BCS_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BCS_REDIRECT_URI || '';

export default function BcsPortfolioComponent() {
  const [portfolio, setPortfolio] = useState<BcsPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('bcs_oauth_state', state);
    const url = `${BCS_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=portfolio&state=${state}`;
    window.location.href = url;
  };

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'portfolio' }), credentials: 'include' });
      if (res.status === 401) { setIsAuthenticated(false); setError('Session expired. Please login again.'); return; }
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch portfolio');
      setPortfolio(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('bcs_oauth_state');
    if (code && state && state === savedState) {
      sessionStorage.removeItem('bcs_oauth_state');
      window.history.replaceState({}, '', window.location.pathname);
      fetch('/api/bcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'auth', code }), credentials: 'include' })
        .then(res => res.json())
        .then(data => { if (data.success) { setIsAuthenticated(true); fetchPortfolio(); } else { setError(data.error); } })
        .catch(e => setError(e.message));
    }
  }, [fetchPortfolio]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(val);
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  if (!isAuthenticated && !portfolio) {
    return <div className="p-4 text-center"><h2 className="text-xl mb-4">БКС Портфель</h2><button onClick={handleAuth} className="bg-blue-600 text-white px-6 py-2 rounded">Войти через БКС</button>{error && <p className="text-red-500 mt-2">{error}</p>}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель БКС</h2>
        <button onClick={fetchPortfolio} disabled={loading} className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50">{loading ? '...' : '↻'}</button>
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {portfolio && (
        <>
          <div className="bg-gray-100 p-3 rounded mb-4">
            <p className="text-lg font-semibold">{formatCurrency(portfolio.totalValue)}</p>
            <p className={portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(portfolio.totalPnl)} ({formatPercent(portfolio.totalPnlPercent)})</p>
            <p className="text-xs text-gray-500">Обновлено: {new Date(portfolio.updatedAt).toLocaleTimeString('ru-RU')}</p>
          </div>
          <ul className="space-y-2">
            {portfolio.positions.map((pos: BcsPosition) => (
              <li key={pos.ticker} className="border p-2 rounded flex justify-between">
                <div><p className="font-medium">{pos.ticker}</p><p className="text-sm text-gray-600">{pos.quantity} шт × {formatCurrency(pos.currentPrice)}</p></div>
                <div className="text-right"><p>{formatCurrency(pos.value)}</p><p className={pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(pos.pnl)} ({formatPercent(pos.pnlPercent)})</p></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

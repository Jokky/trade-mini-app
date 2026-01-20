'use client';
import { useState, useEffect, useCallback } from 'react';
import { BcsPortfolio, BcsPosition } from '@/app/lib/bcs/types';

const AUTH_URL = 'https://oauth.bcs.ru/authorize';
const CLIENT_ID = process.env.NEXT_PUBLIC_BCS_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BCS_REDIRECT_URI || '';

export default function BcsPortfolioComponent() {
  const [portfolio, setPortfolio] = useState<BcsPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/bcs');
      if (res.status === 401) { setIsAuth(false); setError('Требуется авторизация'); return; }
      if (res.status === 429) { setError('Слишком много запросов. Попробуйте позже.'); return; }
      if (!res.ok) { setError('Ошибка загрузки портфеля'); return; }
      setPortfolio(await res.json()); setIsAuth(true);
    } catch { setError('Ошибка сети'); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, '', window.location.pathname);
      fetch('/api/bcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
        .then(r => { if (r.ok) fetchPortfolio(); else setError('Ошибка авторизации'); });
    } else { fetchPortfolio(); }
  }, [fetchPortfolio]);

  const handleLogin = () => {
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('bcs_state', state);
    const url = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;
    window.location.href = url;
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v);
  const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  if (!isAuth && !loading) return (
    <div className="p-4 text-center">
      <p className="mb-4">{error || 'Подключите аккаунт БКС для просмотра портфеля'}</p>
      <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">Войти через БКС</button>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель БКС</h2>
        <button onClick={fetchPortfolio} disabled={loading} className="text-blue-600">{loading ? '...' : '↻'}</button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {portfolio && (
        <>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
            <p className={portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(portfolio.totalPnl)} ({formatPercent(portfolio.totalPnlPercent)})
            </p>
          </div>
          <div className="space-y-2">
            {portfolio.positions.map((p: BcsPosition) => (
              <div key={p.ticker} className="border p-3 rounded flex justify-between">
                <div><p className="font-medium">{p.ticker}</p><p className="text-sm text-gray-500">{p.quantity} шт</p></div>
                <div className="text-right">
                  <p>{formatCurrency(p.value)}</p>
                  <p className={p.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{formatPercent(p.pnlPercent)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Обновлено: {new Date(portfolio.updatedAt).toLocaleString('ru-RU')}</p>
        </>
      )}
    </div>
  );
}
'use client';
import { useState, useEffect, useCallback } from 'react';
import { BcsClient } from '../lib/bcs/bcs-client';
import { BcsPortfolio, AuthStatus } from '../lib/bcs/types';

const client = new BcsClient({ clientId: process.env.NEXT_PUBLIC_BCS_CLIENT_ID || '', redirectUri: process.env.NEXT_PUBLIC_BCS_REDIRECT_URI || '', scope: 'portfolio' });

export default function BcsPortfolioComponent() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [portfolio, setPortfolio] = useState<BcsPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setStatus('loading'); setError(null);
    try {
      const data = await client.getPortfolio('default');
      setPortfolio(data); setStatus('authenticated');
    } catch (e: any) {
      setError(e.message); setStatus('error');
      const cached = client.getCachedPortfolio();
      if (cached) setPortfolio(cached);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      client.exchangeCode(code).then(() => { window.history.replaceState({}, '', window.location.pathname); loadPortfolio(); }).catch(e => setError(e.message));
    } else if (client.isAuthenticated()) {
      loadPortfolio();
    }
  }, [loadPortfolio]);

  const handleLogin = () => { const state = Math.random().toString(36).slice(2); sessionStorage.setItem('bcs_state', state); window.location.href = client.getAuthUrl(state); };
  const handleLogout = () => { client.clearTokens(); setPortfolio(null); setStatus('idle'); };

  if (!client.isAuthenticated() && status !== 'loading') {
    return <div className="p-4 text-center"><h2 className="text-xl mb-4">Портфель БКС</h2><button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">Войти через БКС</button>{error && <p className="text-red-500 mt-2">{error}</p>}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель</h2>
        <div><button onClick={loadPortfolio} disabled={status === 'loading'} className="mr-2 px-3 py-1 bg-gray-200 rounded">{status === 'loading' ? '...' : '↻'}</button><button onClick={handleLogout} className="px-3 py-1 bg-red-100 rounded">Выйти</button></div>
      </div>
      {error && <div className="bg-red-50 p-2 mb-4 rounded text-red-700">{error}<button onClick={handleLogin} className="ml-2 underline">Повторить вход</button></div>}
      {portfolio && (
        <>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="text-2xl font-bold">{portfolio.totalValue.toLocaleString('ru')} {portfolio.currency}</div>
            <div className={portfolio.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{portfolio.totalProfit >= 0 ? '+' : ''}{portfolio.totalProfit.toLocaleString('ru')} ({portfolio.totalProfitPercent.toFixed(2)}%)</div>
            <div className="text-xs text-gray-500">Обновлено: {new Date(portfolio.updatedAt).toLocaleString('ru')}</div>
          </div>
          <div className="space-y-2">
            {portfolio.positions.map(p => (
              <div key={p.ticker} className="border p-3 rounded flex justify-between">
                <div><div className="font-medium">{p.ticker}</div><div className="text-sm text-gray-600">{p.name}</div><div className="text-xs">{p.quantity} шт × {p.currentPrice.toLocaleString('ru')}</div></div>
                <div className="text-right"><div className="font-medium">{p.value.toLocaleString('ru')}</div><div className={p.profit >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{p.profit >= 0 ? '+' : ''}{p.profit.toLocaleString('ru')} ({p.profitPercent.toFixed(2)}%)</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
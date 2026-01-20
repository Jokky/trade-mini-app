'use client';
import { useState, useCallback } from 'react';
import { BcsPortfolio, BcsAuthState } from '@/app/lib/bcs/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_BCS_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BCS_REDIRECT_URI || '';
const AUTH_URL = 'https://oauth.bcs.ru/authorize';

export default function BcsPortfolioComponent() {
  const [authState, setAuthState] = useState<BcsAuthState>({ status: 'idle' });
  const [portfolio, setPortfolio] = useState<BcsPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initiateAuth = useCallback(() => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('bcs_oauth_state', state);
    const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;
    window.location.href = authUrl;
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    const savedState = sessionStorage.getItem('bcs_oauth_state');
    setIsLoading(true);
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exchange', code, state, savedState })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Auth failed');
      }
      const tokens = await res.json();
      setAuthState({ status: 'authenticated', tokens });
      sessionStorage.removeItem('bcs_oauth_state');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка авторизации');
      setAuthState({ status: 'error', error: 'Auth failed' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    if (authState.status !== 'authenticated') return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portfolio', accessToken: authState.tokens.accessToken })
      });
      if (res.status === 429) {
        setError('Превышен лимит запросов. Попробуйте позже.');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      setPortfolio(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки портфеля');
    } finally {
      setIsLoading(false);
    }
  }, [authState]);

  if (authState.status !== 'authenticated') {
    return (
      <div className="p-4">
        <button onClick={initiateAuth} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Войти через БКС'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель БКС</h2>
        <button onClick={fetchPortfolio} className="bg-gray-200 px-3 py-1 rounded" disabled={isLoading}>
          {isLoading ? '...' : 'Обновить'}
        </button>
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {portfolio && (
        <div>
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <p>Общая стоимость: <b>{portfolio.totalValue.toLocaleString('ru-RU')} ₽</b></p>
            <p className={portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
              P&L: {portfolio.totalPnl >= 0 ? '+' : ''}{portfolio.totalPnl.toLocaleString('ru-RU')} ₽ ({portfolio.totalPnlPercent.toFixed(2)}%)
            </p>
          </div>
          {portfolio.positions.map(pos => (
            <div key={pos.ticker} className="border-b py-2">
              <div className="flex justify-between"><span className="font-medium">{pos.ticker}</span><span>{pos.value.toLocaleString('ru-RU')} ₽</span></div>
              <div className="text-sm text-gray-600">{pos.name} • {pos.quantity} шт.</div>
              <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString('ru-RU')} ₽ ({pos.pnlPercent.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
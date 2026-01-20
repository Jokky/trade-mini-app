'use client';

import { useState, useEffect, useCallback } from 'react';
import { bcsService } from '../lib/bcs-api/bcs-service';
import { BCSPortfolio, BCSPosition, BCSApiError } from '../lib/bcs-api/types';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<BCSPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadPortfolio = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bcsService.getPortfolio(forceRefresh);
      setPortfolio(data);
    } catch (err) {
      const apiError = err as BCSApiError;
      setError(apiError.message || 'Ошибка загрузки портфеля');
      if (apiError.code === 401) setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // TODO: Check authentication status on mount
    // TODO: Handle OAuth callback if code in URL
    const checkAuth = () => {
      // Simplified auth check - in production, verify token validity
      setIsAuthenticated(!!localStorage.getItem('bcs_token'));
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadPortfolio();
  }, [isAuthenticated, loadPortfolio]);

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);
    window.location.href = bcsService.getAuthUrl(state);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Портфель БКС</h2>
        <p className="mb-4 text-gray-600">Авторизуйтесь для просмотра портфеля</p>
        <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Войти через БКС
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель БКС</h2>
        <button onClick={() => loadPortfolio(true)} disabled={loading} className="text-blue-600 disabled:opacity-50">
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {portfolio && (
        <>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="text-2xl font-bold">{portfolio.totalValue.toLocaleString()} {portfolio.currency}</div>
            <div className={`text-lg ${portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.totalPnl >= 0 ? '+' : ''}{portfolio.totalPnl.toLocaleString()} ({portfolio.totalPnlPercent.toFixed(2)}%)
            </div>
          </div>

          <div className="space-y-2">
            {portfolio.positions.map((pos: BCSPosition) => (
              <div key={pos.ticker} className="border rounded-lg p-3">
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">{pos.ticker}</span>
                    <span className="text-gray-500 ml-2 text-sm">{pos.name}</span>
                  </div>
                  <div className="text-right">
                    <div>{pos.currentValue.toLocaleString()} {pos.currency}</div>
                    <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()} ({pos.pnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {pos.quantity} шт. × {pos.currentPrice.toLocaleString()} {pos.currency}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

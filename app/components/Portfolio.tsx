'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, PortfolioPosition, BCSAccount } from '@/app/lib/bcs-api/client';

export default function PortfolioView() {
  const [accounts, setAccounts] = useState<BCSAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/bcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accounts' }) });
      const data = await res.json();
      if (data.success) setAccounts(data.accounts);
      else setError(data.error);
    } catch { setError('Ошибка загрузки счетов'); }
  }, []);

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'portfolio', accountId: selectedAccount, forceRefresh }) });
      const data = await res.json();
      if (data.success) setPortfolio(data.portfolio);
      else setError(data.error);
    } catch { setError('Ошибка загрузки портфеля'); }
    setLoading(false);
  }, [selectedAccount]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { if (selectedAccount) fetchPortfolio(); }, [selectedAccount, fetchPortfolio]);

  const formatCurrency = (val: number) => val.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded">{error}<button onClick={() => setError(null)} className="ml-2 underline">Повторить</button></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="border p-2 rounded flex-1">
          <option value="">Выберите счёт</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={() => fetchPortfolio(true)} disabled={loading || !selectedAccount} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Обновить</button>
      </div>
      {loading && <div className="text-center py-8">Загрузка...</div>}
      {portfolio && !loading && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
            <div className={portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(portfolio.totalProfitLoss)}</div>
          </div>
          {portfolio.positions.length === 0 ? <div className="text-gray-500 text-center py-4">Портфель пуст</div> : (
            <div className="space-y-2">
              {portfolio.positions.map((p: PortfolioPosition) => (
                <div key={p.ticker} className="border p-3 rounded flex justify-between items-center">
                  <div><div className="font-medium">{p.name}</div><div className="text-sm text-gray-500">{p.ticker} • {p.quantity} шт</div></div>
                  <div className="text-right"><div>{formatCurrency(p.totalValue)}</div><div className={p.profitLoss >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{formatCurrency(p.profitLoss)} ({formatPercent(p.profitLossPercent)})</div></div>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400">Обновлено: {new Date(portfolio.updatedAt).toLocaleString('ru-RU')}</div>
        </div>
      )}
    </div>
  );
}

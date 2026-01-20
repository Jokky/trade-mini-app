'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { BcsAccount, BcsPortfolio } from '@/app/lib/bcs-api/client';

export default function Portfolio() {
  const [accounts, setAccounts] = useState<BcsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [portfolio, setPortfolio] = useState<BcsPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const touchStartY = useRef(0);

  const handleAuth = async () => {
    const res = await fetch('/api/bcs?action=auth-url');
    const { url } = await res.json();
    window.location.href = url;
  };

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bcs?action=accounts');
      if (res.status === 401) { setIsAuthed(false); return; }
      const { accounts } = await res.json();
      setAccounts(accounts || []);
      setIsAuthed(true);
      if (accounts?.length) setSelectedAccount(accounts[0].id);
    } catch { setError('Не удалось загрузить счета'); }
    setLoading(false);
  }, []);

  const loadPortfolio = useCallback(async (refresh = false) => {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bcs?action=portfolio&accountId=${selectedAccount}&refresh=${refresh}`);
      if (res.status === 401) { setIsAuthed(false); return; }
      if (!res.ok) throw new Error();
      const { portfolio } = await res.json();
      setPortfolio(portfolio);
    } catch { setError('Не удалось загрузить портфель'); }
    setLoading(false);
  }, [selectedAccount]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { if (selectedAccount) loadPortfolio(); }, [selectedAccount, loadPortfolio]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80 && window.scrollY === 0) loadPortfolio(true);
  };

  if (!isAuthed) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">Требуется авторизация в БКС</p>
        <button onClick={handleAuth} className="bg-blue-600 text-white px-4 py-2 rounded">Войти через БКС</button>
        {error && <p className="mt-2 text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex justify-between items-center mb-4">
        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="border p-2 rounded">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={() => loadPortfolio(true)} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded">
          {loading ? '...' : 'Обновить'}
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {portfolio && (
        <>
          <div className="bg-gray-100 p-3 rounded mb-4">
            <p className="text-lg font-bold">{portfolio.totalValue.toLocaleString()} {portfolio.currency}</p>
            <p className={portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
              {portfolio.totalProfitLoss >= 0 ? '+' : ''}{portfolio.totalProfitLoss.toLocaleString()} {portfolio.currency}
            </p>
          </div>
          {portfolio.positions.length === 0 ? <p className="text-gray-500">Портфель пуст</p> : (
            <ul className="space-y-2">
              {portfolio.positions.map(p => (
                <li key={p.ticker} className="border p-3 rounded">
                  <div className="flex justify-between"><span className="font-medium">{p.ticker}</span><span>{p.totalValue.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600">{p.name} • {p.quantity} шт</div>
                  <div className={`text-sm ${p.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.profitLoss >= 0 ? '+' : ''}{p.profitLoss.toLocaleString()} ({p.profitLossPercent.toFixed(2)}%)
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

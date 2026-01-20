'use client';
import { useState, useCallback } from 'react';

interface Position {
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
}

interface Account {
  id: string;
  name: string;
}

type Status = 'idle' | 'auth' | 'loading' | 'ready' | 'error';

export default function Portfolio() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);

  const api = async (action: string, extra = {}) => {
    const res = await fetch('/api/bcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  };

  const handleAuth = async () => {
    const code = prompt('Введите код авторизации БКС:');
    if (!code) return;
    setStatus('auth');
    setError('');
    try {
      await api('auth', { code });
      const accs = await api('accounts');
      setAccounts(accs.accounts || []);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка авторизации');
      setStatus('error');
    }
  };

  const loadPortfolio = useCallback(async (accountId: string) => {
    setStatus('loading');
    setError('');
    try {
      const data = await api('portfolio', { accountId });
      setPositions(data.positions || []);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки портфеля');
      setStatus('error');
    }
  }, []);

  const handleAccountChange = (id: string) => {
    setSelectedAccount(id);
    if (id) loadPortfolio(id);
  };

  const totalValue = positions.reduce((s, p) => s + p.totalValue, 0);
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Портфель БКС</h1>
      
      {status === 'idle' && <button onClick={handleAuth} className="bg-blue-600 text-white px-4 py-2 rounded">Авторизоваться в БКС</button>}
      {status === 'error' && <div className="text-red-500 mb-2">{error} <button onClick={handleAuth} className="underline ml-2">Повторить</button></div>}
      {(status === 'auth' || status === 'loading') && <div>Загрузка...</div>}
      
      {accounts.length > 0 && (
        <select value={selectedAccount} onChange={e => handleAccountChange(e.target.value)} className="border p-2 rounded w-full mb-4">
          <option value="">Выберите счет</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}
      
      {selectedAccount && status === 'ready' && (
        <>
          <button onClick={() => loadPortfolio(selectedAccount)} className="mb-4 text-blue-600 underline">Обновить</button>
          {positions.length === 0 ? <p>Портфель пуст</p> : (
            <div className="space-y-2">
              {positions.map(p => (
                <div key={p.ticker} className="border p-2 rounded flex justify-between">
                  <div><div className="font-semibold">{p.ticker}</div><div className="text-sm text-gray-500">{p.name}</div></div>
                  <div className="text-right"><div>{p.quantity} × {p.currentPrice.toFixed(2)}</div><div className={p.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}</div></div>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Итого:</span>
                <span>{totalValue.toFixed(2)} (<span className={totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}</span>)</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

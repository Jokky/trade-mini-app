'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderForm from './OrderForm';

interface Position {
  instrumentId: string;
  ticker: string;
  name: string;
  quantity: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface SelectedInstrument {
  instrumentId: string;
  name: string;
  ticker: string;
}

export default function Portfolio() {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accounts' })
      });
      const data = await res.json();
      if (data.success && data.data?.length) {
        setAccounts(data.data);
        setSelectedAccount(data.data[0].id);
      }
    } catch (e) {
      setError('Ошибка загрузки счетов');
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portfolio', accountId: selectedAccount })
      });
      const data = await res.json();
      if (data.success) setPositions(data.data?.positions || []);
      else setError(data.error || 'Ошибка загрузки портфеля');
    } catch (e) {
      setError('Ошибка загрузки портфеля');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const handlePositionClick = (pos: Position) => {
    setSelectedInstrument({ instrumentId: pos.instrumentId, name: pos.name, ticker: pos.ticker });
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4">
      {accounts.length > 1 && (
        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
          className="w-full p-2 border rounded mb-4">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}
      <div className="space-y-2">
        {positions.map(pos => (
          <div key={pos.instrumentId} onClick={() => handlePositionClick(pos)}
            className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{pos.name}</div>
                <div className="text-sm text-gray-500">{pos.ticker} · {pos.quantity} шт.</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{(pos.totalValue ?? 0).toLocaleString('ru-RU')} ₽</div>
                <div className={pos.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {pos.profitLoss >= 0 ? '+' : ''}{(pos.profitLoss ?? 0).toLocaleString('ru-RU')} ₽
                  ({(pos.profitLossPercent ?? 0).toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
        {positions.length === 0 && <div className="text-gray-500 text-center py-8">Портфель пуст</div>}
      </div>
      {selectedInstrument && (
        <OrderForm
          instrumentId={selectedInstrument.instrumentId}
          instrumentName={selectedInstrument.name}
          instrumentTicker={selectedInstrument.ticker}
          onClose={() => setSelectedInstrument(null)}
          onSuccess={() => { setSelectedInstrument(null); fetchPortfolio(); }}
          onError={(err) => console.error('Order error:', err)}
        />
      )}
    </div>
  );
}
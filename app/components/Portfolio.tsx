'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderForm from './OrderForm';
import OrderResult from './OrderResult';
import { CreateOrderResponse } from '../services/orderApi';

interface Position {
  instrumentId: string;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercent: number;
}

interface Account {
  accountId: string;
  name: string;
}

interface SelectedInstrument {
  instrumentId: string;
  name: string;
  ticker: string;
}

export default function Portfolio() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Order form state
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);
  const [orderResult, setOrderResult] = useState<{ success: boolean; response?: CreateOrderResponse; error?: string } | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: '/accounts', method: 'GET' })
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedAccountId(data.accounts[0].accountId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: `/portfolio/${selectedAccountId}`, method: 'GET' })
      });
      if (!res.ok) throw new Error('Failed to load portfolio');
      const data = await res.json();
      setPositions(data.positions || []);
      setTotalValue(data.totalValue || 0);
      setTotalProfit(data.totalProfit || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const formatCurrency = (val: number) => val.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  const handlePositionClick = (pos: Position) => {
    setSelectedInstrument({ instrumentId: pos.instrumentId, name: pos.name, ticker: pos.ticker });
  };

  const handleOrderSuccess = (response: CreateOrderResponse) => {
    setSelectedInstrument(null);
    setOrderResult({ success: true, response });
  };

  const handleOrderError = (error: string) => {
    setSelectedInstrument(null);
    setOrderResult({ success: false, error });
  };

  const handleResultClose = () => {
    setOrderResult(null);
  };

  if (loading) return <div className="p-4 text-center">Загрузка портфеля...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4">
      {accounts.length > 1 && (
        <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full border rounded p-2 mb-4">
          {accounts.map(acc => <option key={acc.accountId} value={acc.accountId}>{acc.name}</option>)}
        </select>
      )}

      <div className="bg-gray-100 rounded p-4 mb-4">
        <div className="text-sm text-gray-500">Стоимость портфеля</div>
        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        <div className={totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(totalProfit)}</div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Позиции</h2>
        <button onClick={fetchPortfolio} className="text-blue-500 text-sm">Обновить</button>
      </div>

      {positions.length === 0 ? (
        <p className="text-gray-500">Нет открытых позиций</p>
      ) : (
        <div className="space-y-2">
          {positions.map(pos => (
            <div key={pos.instrumentId} onClick={() => handlePositionClick(pos)} className="bg-white border rounded p-3 cursor-pointer hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{pos.ticker}</div>
                  <div className="text-sm text-gray-500">{pos.name}</div>
                </div>
                <div className="text-right">
                  <div>{formatCurrency(pos.value)}</div>
                  <div className={pos.profit >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                    {formatCurrency(pos.profit)} ({formatPercent(pos.profitPercent)})
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{pos.quantity} шт. × {formatCurrency(pos.currentPrice)}</div>
            </div>
          ))}
        </div>
      )}

      {selectedInstrument && (
        <OrderForm
          instrumentId={selectedInstrument.instrumentId}
          instrumentName={selectedInstrument.name}
          instrumentTicker={selectedInstrument.ticker}
          onClose={() => setSelectedInstrument(null)}
          onSuccess={handleOrderSuccess}
          onError={handleOrderError}
        />
      )}

      {orderResult && (
        <OrderResult
          success={orderResult.success}
          response={orderResult.response}
          error={orderResult.error}
          onClose={handleResultClose}
        />
      )}
    </div>
  );
}

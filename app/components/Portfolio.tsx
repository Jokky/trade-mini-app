'use client';

import { useState, useEffect } from 'react';
import { BCSAccount, BCSPortfolio, BCSPosition } from '../lib/bcs/types';

// TODO: Replace with actual API calls via server actions or API routes
const mockAccounts: BCSAccount[] = [
  { id: '1', name: 'Брокерский счет', type: 'broker', currency: 'RUB' },
];

const mockPortfolio: BCSPortfolio = {
  accountId: '1',
  positions: [
    { ticker: 'SBER', name: 'Сбербанк', quantity: 10, currentPrice: 280, averagePrice: 250, value: 2800, pnl: 300, pnlPercent: 12, assetType: 'stock' },
  ],
  balances: [{ currency: 'RUB', amount: 10000, blocked: 0, available: 10000 }],
  totalValue: 12800,
  totalPnl: 300,
  updatedAt: new Date(),
};

export default function Portfolio() {
  const [accounts, setAccounts] = useState<BCSAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [portfolio, setPortfolio] = useState<BCSPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch accounts from API
    setAccounts(mockAccounts);
    if (mockAccounts.length > 0) setSelectedAccount(mockAccounts[0].id);
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    // TODO: Fetch portfolio from API
    setPortfolio(mockPortfolio);
  }, [selectedAccount]);

  const handleRefresh = () => {
    // TODO: Implement refresh with loading state
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <select 
          value={selectedAccount} 
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="border rounded p-2"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {portfolio && (
        <>
          <div className="bg-gray-100 p-4 rounded">
            <div className="text-2xl font-bold">{portfolio.totalValue.toLocaleString()} ₽</div>
            <div className={portfolio.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              {portfolio.totalPnl >= 0 ? '+' : ''}{portfolio.totalPnl.toLocaleString()} ₽
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Позиции</h3>
            {portfolio.positions.length === 0 ? (
              <p className="text-gray-500">Нет открытых позиций</p>
            ) : (
              portfolio.positions.map((pos) => (
                <div key={pos.ticker} className="border p-3 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{pos.ticker}</div>
                    <div className="text-sm text-gray-500">{pos.name} • {pos.quantity} шт.</div>
                  </div>
                  <div className="text-right">
                    <div>{pos.value.toLocaleString()} ₽</div>
                    <div className={pos.pnl >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnlPercent}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Балансы</h3>
            {portfolio.balances.map((bal) => (
              <div key={bal.currency} className="flex justify-between">
                <span>{bal.currency}</span>
                <span>{bal.available.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

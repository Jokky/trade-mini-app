'use client';

import { useState, useEffect } from 'react';
import { BCSPortfolio, BCSAccount, BCSPosition } from '../lib/bcs-api/types';

// TODO: Replace with actual API calls via bcsClient
const mockPortfolio: BCSPortfolio = {
  accountId: 'demo',
  positions: [
    { ticker: 'SBER', name: 'Сбербанк', quantity: 100, averagePrice: 250, currentPrice: 265, totalValue: 26500, profitLoss: 1500, profitLossPercent: 6, currency: 'RUB' },
    { ticker: 'GAZP', name: 'Газпром', quantity: 50, averagePrice: 180, currentPrice: 175, totalValue: 8750, profitLoss: -250, profitLossPercent: -2.78, currency: 'RUB' },
  ],
  totalValue: 35250,
  totalProfitLoss: 1250,
  totalProfitLossPercent: 3.67,
  updatedAt: new Date(),
};

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<BCSPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual BCS API call
    setTimeout(() => {
      setPortfolio(mockPortfolio);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="p-4 text-center">Загрузка портфеля...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!portfolio) return <div className="p-4">Нет данных</div>;

  const formatCurrency = (v: number) => v.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
  const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
  const plColor = (v: number) => v >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Портфель БКС</h1>
      
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <div className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
        <div className={plColor(portfolio.totalProfitLoss)}>
          {formatCurrency(portfolio.totalProfitLoss)} ({formatPercent(portfolio.totalProfitLossPercent)})
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.positions.map((pos) => (
          <div key={pos.ticker} className="bg-white border rounded-lg p-3">
            <div className="flex justify-between">
              <span className="font-medium">{pos.ticker}</span>
              <span>{formatCurrency(pos.totalValue)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{pos.name} × {pos.quantity}</span>
              <span className={plColor(pos.profitLoss)}>{formatPercent(pos.profitLossPercent)}</span>
            </div>
          </div>
        ))}
      </div>

      {portfolio.positions.length === 0 && (
        <div className="text-center text-gray-500 py-8">Портфель пуст</div>
      )}
    </div>
  );
}

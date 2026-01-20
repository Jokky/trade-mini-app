'use client';

import { useState, useEffect } from 'react';
import { Portfolio, PositionWithPnL, calculatePnL } from '../lib/bcs/types';
import { bcsClient } from '../lib/bcs/client';

export default function PortfolioView({ accountId }: { accountId: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bcsClient.getPortfolio(accountId);
      setPortfolio(data);
      // TODO: Cache data in localStorage for offline support
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки портфеля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, [accountId]);

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!portfolio) return <div className="p-4">Нет данных</div>;

  const positions: PositionWithPnL[] = portfolio.positions.map(calculatePnL);
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Портфель</h2>
        <button onClick={fetchPortfolio} className="px-3 py-1 bg-blue-500 text-white rounded">
          Обновить
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div>Общая стоимость: {portfolio.totalValue.toLocaleString()} ₽</div>
        <div className={totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
          P&L: {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString()} ₽
        </div>
      </div>

      <div className="space-y-2">
        {positions.map((pos) => (
          <div key={pos.ticker} className="p-3 border rounded">
            <div className="font-medium">{pos.ticker} - {pos.name}</div>
            <div className="text-sm text-gray-600">
              {pos.quantity} шт. × {pos.currentPrice} ₽ = {pos.marketValue.toLocaleString()} ₽
            </div>
            <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              P&L: {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()} ₽ ({pos.pnlPercent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

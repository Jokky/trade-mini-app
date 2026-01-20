'use client';

import { useState, useEffect } from 'react';
import { BCSPortfolio, BCSPosition } from '../lib/bcs/types';

interface PortfolioProps {
  accountId?: string;
}

export default function Portfolio({ accountId }: PortfolioProps) {
  const [portfolio, setPortfolio] = useState<BCSPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    // TODO: Implement actual API call via backend proxy
    setLoading(true);
    setError(null);
    try {
      // const response = await fetch(`/api/bcs/portfolio/${accountId}`);
      // setPortfolio(await response.json());
      setError('Portfolio fetching not implemented yet');
    } catch (e) {
      setError('Ошибка загрузки портфеля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) fetchPortfolio();
  }, [accountId]);

  if (loading) return <div className="p-4 text-center">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!portfolio) return <div className="p-4">Авторизуйтесь для просмотра портфеля</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Портфель</h2>
        <button onClick={fetchPortfolio} className="px-3 py-1 bg-blue-500 text-white rounded">
          Обновить
        </button>
      </div>
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="text-2xl font-bold">{portfolio.totalValue.toLocaleString()} ₽</div>
        <div className={portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {portfolio.totalPnl >= 0 ? '+' : ''}{portfolio.totalPnl.toLocaleString()} ₽
          ({portfolio.totalPnlPercent.toFixed(2)}%)
        </div>
      </div>
      <div className="space-y-2">
        {portfolio.positions.map((pos) => (
          <PositionCard key={pos.ticker} position={pos} />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: BCSPosition }) {
  const isProfitable = position.pnl >= 0;
  return (
    <div className="p-3 border rounded">
      <div className="flex justify-between">
        <span className="font-medium">{position.ticker}</span>
        <span>{position.value.toLocaleString()} ₽</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{position.quantity} шт × {position.currentPrice} ₽</span>
        <span className={isProfitable ? 'text-green-600' : 'text-red-600'}>
          {isProfitable ? '+' : ''}{position.pnl.toLocaleString()} ₽
        </span>
      </div>
    </div>
  );
}

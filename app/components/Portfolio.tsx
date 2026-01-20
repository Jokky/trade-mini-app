'use client';

import { useState, useEffect } from 'react';
import { BCSPortfolio, BCSPortfolioPosition } from '../lib/bcs-api/types';
import { bcsService } from '../lib/bcs-api/bcs-service';

function PositionRow({ position }: { position: BCSPortfolioPosition }) {
  const isProfit = position.profitLoss >= 0;
  return (
    <div className="flex justify-between p-3 border-b">
      <div>
        <div className="font-medium">{position.ticker}</div>
        <div className="text-sm text-gray-500">{position.name}</div>
        <div className="text-sm">{position.quantity} шт.</div>
      </div>
      <div className="text-right">
        <div className="font-medium">{position.currentValue.toLocaleString()} {position.currency}</div>
        <div className={isProfit ? 'text-green-600' : 'text-red-600'}>
          {isProfit ? '+' : ''}{position.profitLoss.toLocaleString()} ({position.profitLossPercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<BCSPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Get accountId from user session
      const data = await bcsService.getPortfolio('default');
      setPortfolio(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки портфеля');
      setPortfolio(bcsService.getCachedPortfolio());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPortfolio(); }, []);

  if (loading) return <div className="p-4 text-center">Загрузка портфеля...</div>;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Портфель</h2>
        <button onClick={loadPortfolio} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
          Обновить
        </button>
      </div>
      {error && <div className="p-3 bg-red-100 text-red-700">{error}</div>}
      {portfolio ? (
        <>
          <div className="p-4 bg-gray-50">
            <div className="text-2xl font-bold">{portfolio.totalValue.toLocaleString()} {portfolio.currency}</div>
            <div className={portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
              {portfolio.totalProfitLoss >= 0 ? '+' : ''}{portfolio.totalProfitLoss.toLocaleString()} ({portfolio.totalProfitLossPercent.toFixed(2)}%)
            </div>
          </div>
          <div>{portfolio.positions.map((p, i) => <PositionRow key={i} position={p} />)}</div>
        </>
      ) : (
        <div className="p-4 text-center text-gray-500">Нет данных. Авторизуйтесь в БКС.</div>
      )}
    </div>
  );
}

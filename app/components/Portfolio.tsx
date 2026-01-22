'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderForm from './OrderForm';

interface BCSPortfolioItem {
  type: string;
  account: string;
  ticker: string;
  displayName: string;
  currency: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  currentValueRub: number;
  unrealizedPL: number;
  unrealizedPercentPL: number;
  board: string;
}

interface SelectedInstrument {
  ticker: string;
  classCode: string;
  name: string;
}

export default function Portfolio() {
  const [positions, setPositions] = useState<BCSPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portfolio' }),
      });
      const data = await res.json();
      if (data.success) {
        // Filter only depoLimit positions (stocks, bonds, etc.)
        const depoPositions = (data.data || []).filter(
          (item: BCSPortfolioItem) => item.type === 'depoLimit' && item.quantity > 0
        );
        setPositions(depoPositions);
      } else {
        setError(data.error || 'Ошибка загрузки портфеля');
      }
    } catch (e) {
      setError('Ошибка загрузки портфеля');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handlePositionClick = (pos: BCSPortfolioItem) => {
    setSelectedInstrument({
      ticker: pos.ticker,
      classCode: pos.board,
      name: pos.displayName,
    });
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4">
      <div className="space-y-2">
        {positions.map((pos) => (
          <div
            key={`${pos.ticker}-${pos.board}`}
            onClick={() => handlePositionClick(pos)}
            className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{pos.displayName}</div>
                <div className="text-sm text-gray-500">
                  {pos.ticker} · {pos.quantity} шт.
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {(pos.currentValueRub ?? 0).toLocaleString('ru-RU')} ₽
                </div>
                <div className={pos.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {pos.unrealizedPL >= 0 ? '+' : ''}
                  {(pos.unrealizedPL ?? 0).toLocaleString('ru-RU')} ₽ (
                  {(pos.unrealizedPercentPL ?? 0).toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
        {positions.length === 0 && (
          <div className="text-gray-500 text-center py-8">Портфель пуст</div>
        )}
      </div>
      {selectedInstrument && (
        <OrderForm
          ticker={selectedInstrument.ticker}
          classCode={selectedInstrument.classCode}
          instrumentName={selectedInstrument.name}
          onClose={() => setSelectedInstrument(null)}
          onSuccess={() => {
            setSelectedInstrument(null);
            fetchPortfolio();
          }}
          onError={(err) => console.error('Order error:', err)}
        />
      )}
    </div>
  );
}
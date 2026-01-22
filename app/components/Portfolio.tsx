'use client';

import React, { useState, useMemo } from 'react';
import OrderForm from './OrderForm';
import { usePortfolioPolling } from '../hooks/usePortfolioPolling';
import { BCSPortfolioItem } from '../lib/bcs-api/client';

interface SelectedInstrument {
  ticker: string;
  classCode: string;
  name: string;
}

export default function Portfolio() {
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);

  // Poll portfolio data via HTTP every 5 seconds
  const { positions: allPositions, isLoading, error } = usePortfolioPolling();

  // Filter only depoLimit positions with term T365
  const positions = useMemo(() => {
    return allPositions.filter(
      (item: BCSPortfolioItem) => item.type === 'depoLimit' && item.quantity > 0 && item.term === 'T365'
    );
  }, [allPositions]);

  const handlePositionClick = (pos: BCSPortfolioItem) => {
    setSelectedInstrument({
      ticker: pos.ticker,
      classCode: pos.board,
      name: pos.displayName,
    });
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  if (isLoading) return <div className="p-4">Загрузка...</div>;

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
          onSuccess={() => setSelectedInstrument(null)}
          onError={(err) => console.error('Order error:', err)}
        />
      )}
    </div>
  );
}

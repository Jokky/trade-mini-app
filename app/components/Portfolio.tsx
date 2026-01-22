'use client';

import React, { useState, useEffect, useMemo } from 'react';
import OrderForm from './OrderForm';
import { usePortfolioWebSocket } from '../hooks/usePortfolioWebSocket';
import { BCSPortfolioPosition } from '../services/websocket/types';

interface SelectedInstrument {
  ticker: string;
  classCode: string;
  name: string;
}

export default function Portfolio() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);

  // Fetch access token on mount
  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const res = await fetch('/api/bcs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getAccessToken' }),
        });
        const data = await res.json();
        if (data.success) {
          setAccessToken(data.accessToken);
        } else {
          setError(data.error || 'Ошибка получения токена');
        }
      } catch {
        setError('Ошибка получения токена');
      }
    };
    fetchAccessToken();
  }, []);

  // Connect to WebSocket
  const { positions: allPositions, connectionState } = usePortfolioWebSocket(accessToken || '');

  // Filter only depoLimit positions with term T365
  const positions = useMemo(() => {
    return allPositions.filter(
      (item: BCSPortfolioPosition) => item.type === 'depoLimit' && item.quantity > 0 && item.term === 'T365'
    );
  }, [allPositions]);

  const handlePositionClick = (pos: BCSPortfolioPosition) => {
    setSelectedInstrument({
      ticker: pos.ticker,
      classCode: pos.board,
      name: pos.displayName,
    });
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const isLoading = !accessToken || (connectionState === 'connecting' && positions.length === 0);
  if (isLoading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4">
      {connectionState === 'error' && (
        <div className="mb-2 p-2 bg-red-100 text-red-600 rounded text-sm">
          Ошибка подключения к серверу
        </div>
      )}
      {connectionState === 'connecting' && positions.length > 0 && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-700 rounded text-sm">
          Переподключение...
        </div>
      )}
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

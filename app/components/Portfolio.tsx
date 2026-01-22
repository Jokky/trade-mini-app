'use client';

import React, { useState, useEffect, useMemo } from 'react';
import OrderForm from './OrderForm';
import { usePortfolioWebSocket } from '../hooks/usePortfolioWebSocket';
import { BCSPortfolioPosition } from '../services/websocket/types';
import { Cell, Placeholder } from '@telegram-apps/telegram-ui';

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

  if (error) {
    return (
      <div>
        <div style={{
          padding: '12px',
          margin: '16px',
          backgroundColor: 'var(--tgui--destructive_bg_color)',
          color: 'var(--tgui--destructive_text_color)',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      </div>
    );
  }

  const isLoading = !accessToken || (connectionState === 'connecting' && positions.length === 0);
  if (isLoading) {
    return <Placeholder header="Загрузка..." />;
  }

  return (
    <div>
      {connectionState === 'error' && (
        <div style={{
          padding: '12px',
          margin: '16px',
          backgroundColor: 'var(--tgui--destructive_bg_color)',
          color: 'var(--tgui--destructive_text_color)',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          Ошибка подключения к серверу
        </div>
      )}
      {connectionState === 'connecting' && positions.length > 0 && (
        <div style={{
          padding: '12px',
          margin: '16px',
          backgroundColor: 'var(--tgui--hint_color)',
          color: 'var(--tgui--text_color)',
          borderRadius: '8px',
          fontSize: '14px',
          opacity: 0.7
        }}>
          Переподключение...
        </div>
      )}
      {positions.length === 0 ? (
        <Placeholder header="Портфель пуст" />
      ) : (
        positions.map((pos) => (
          <Cell
            key={`${pos.ticker}-${pos.board}`}
            onClick={() => handlePositionClick(pos)}
            subtitle={`${pos.ticker} · ${pos.quantity} шт.`}
            after={
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {(pos.currentValueRub ?? 0).toLocaleString('ru-RU')} ₽
                </div>
                <div
                  style={{
                    color:
                      pos.unrealizedPL >= 0
                        ? 'var(--tgui--button_positive_bg_color)'
                        : 'var(--tgui--destructive_text_color)',
                    fontSize: '14px',
                  }}
                >
                  {pos.unrealizedPL >= 0 ? '+' : ''}
                  {(pos.unrealizedPL ?? 0).toLocaleString('ru-RU')} ₽ (
                  {(pos.unrealizedPercentPL ?? 0).toFixed(2)}%)
                </div>
              </div>
            }
          >
            {pos.displayName}
          </Cell>
        ))
      )}
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

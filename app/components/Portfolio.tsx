'use client';

import React, { useState, useMemo } from 'react';
import OrderForm from './OrderForm';
import { usePortfolioPolling } from '../hooks/usePortfolioPolling';
import { BCSPortfolioItem } from '../lib/bcs-api/client';
import { Cell, Placeholder } from '@telegram-apps/telegram-ui';

interface SelectedInstrument {
  ticker: string;
  classCode: string;
  name: string;
}

export default function Portfolio() {
  const [selectedInstrument, setSelectedInstrument] = useState<SelectedInstrument | null>(null);

  // Poll portfolio data via HTTP every 5 seconds
  const { positions: allPositions, isLoading, error } = usePortfolioPolling();

  // Filter only positions with term T365
  const positions = useMemo(() => {
    return allPositions.filter(
      (item: BCSPortfolioItem) => item.term === 'T365'
    );
  }, [allPositions]);

  const handlePositionClick = (pos: BCSPortfolioItem) => {
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

  if (isLoading) {
    return <Placeholder header="Загрузка..." />;
  }

  return (
    <div>
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

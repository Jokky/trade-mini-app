'use client';

import React, { useState, useEffect } from 'react';
import { Cell, Button, Input, Placeholder, Spinner } from '@telegram-apps/telegram-ui';
import OrderForm from './OrderForm';
import type { InstrumentType, Instrument } from '../lib/bcs-api/client';

interface InstrumentsListProps {
  defaultType?: InstrumentType;
}

export default function InstrumentsList({ defaultType = 'STOCK' }: InstrumentsListProps) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<InstrumentType>(defaultType);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState<{
    ticker: string;
    classCode: string;
    instrumentName: string;
  } | null>(null);

  const instrumentTypes: { value: InstrumentType; label: string }[] = [
    { value: 'STOCK', label: 'Акции РФ' },
    { value: 'FOREIGN_STOCK', label: 'Иностранные акции' },
    { value: 'BONDS', label: 'Облигации' },
    { value: 'ETF', label: 'ETF' },
    { value: 'FUTURES', label: 'Фьючерсы' },
    { value: 'OPTIONS', label: 'Опционы' },
    { value: 'CURRENCY', label: 'Валюта' },
  ];

  const loadInstruments = async (type: InstrumentType, pageNum: number = 0, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getInstruments',
          type,
          size: 50,
          page: pageNum,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки инструментов');
      }

      const newInstruments: Instrument[] = data.data || [];
      if (append) {
        setInstruments((prev) => [...prev, ...newInstruments]);
      } else {
        setInstruments(newInstruments);
      }
      setHasMore(newInstruments.length === 50);
    } catch (e) {
      setError((e as Error).message || 'Ошибка загрузки инструментов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setInstruments([]);
    loadInstruments(selectedType, 0, false);
  }, [selectedType]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadInstruments(selectedType, nextPage, true);
    }
  };

  const handleInstrumentClick = (instrument: Instrument) => {
    // Выбираем первый доступный board или используем primaryBoard
    const board = instrument.boards?.[0] || { classCode: instrument.primaryBoard || 'TQBR', exchange: 'MOEX' };
    setSelectedInstrument({
      ticker: instrument.ticker,
      classCode: board.classCode,
      instrumentName: instrument.displayName || instrument.shortName || instrument.ticker,
    });
  };

  const filteredInstruments = searchQuery
    ? instruments.filter(
        (inst) =>
          inst.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inst.displayName || inst.shortName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : instruments;

  if (loading && instruments.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Spinner size="m" />
        <p style={{ marginTop: '16px', color: 'var(--tgui--hint_color)' }}>Загрузка инструментов...</p>
      </div>
    );
  }

  if (error && instruments.length === 0) {
    return (
      <Placeholder
        header="Ошибка"
        description={error}
        action={
          <Button onClick={() => loadInstruments(selectedType, 0, false)}>
            Попробовать снова
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Фильтр по типу */}
      <div style={{ padding: '12px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {instrumentTypes.map((type) => (
          <Button
            key={type.value}
            mode={selectedType === type.value ? 'filled' : 'outline'}
            size="s"
            onClick={() => setSelectedType(type.value)}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Поиск */}
      <div style={{ padding: '0 12px 12px' }}>
        <Input
          type="text"
          placeholder="Поиск по тикеру или названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Список инструментов */}
      <div>
        {filteredInstruments.length === 0 ? (
          <Placeholder
            header="Инструменты не найдены"
            description={searchQuery ? 'Попробуйте изменить запрос поиска' : 'Нет доступных инструментов'}
          />
        ) : (
          <>
            {filteredInstruments.map((instrument, index) => {
              const board = instrument.boards?.[0] || { classCode: instrument.primaryBoard || 'TQBR', exchange: 'MOEX' };
              const displayName = instrument.displayName || instrument.shortName || instrument.ticker;
              
              return (
                <Cell
                  key={`${instrument.ticker}-${board.classCode}-${index}`}
                  onClick={() => handleInstrumentClick(instrument)}
                  subtitle={instrument.ticker}
                  after={
                    <div style={{ fontSize: '12px', color: 'var(--tgui--hint_color)' }}>
                      {board.classCode}
                    </div>
                  }
                >
                  {displayName}
                </Cell>
              );
            })}

            {/* Кнопка загрузки еще */}
            {hasMore && !searchQuery && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  mode="outline"
                  size="l"
                  stretched
                >
                  {loading ? <Spinner size="s" /> : 'Загрузить еще'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно с формой заявки */}
      {selectedInstrument && (
        <OrderForm
          ticker={selectedInstrument.ticker}
          classCode={selectedInstrument.classCode}
          instrumentName={selectedInstrument.instrumentName}
          onClose={() => setSelectedInstrument(null)}
          onSuccess={() => {
            setSelectedInstrument(null);
          }}
        />
      )}
    </div>
  );
}

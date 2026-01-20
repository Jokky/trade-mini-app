'use client';

import React, { useState, useEffect } from 'react';
import OrderForm, { Instrument } from './OrderForm';

// TODO: Import real portfolio API when available
// import { fetchPortfolio, Position } from '../services/portfolioApi';

interface Position {
  instrumentId: string;
  instrumentName: string;
  ticker: string;
  quantity: number;
  currentPrice: number;
}

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  useEffect(() => {
    // TODO: Replace with real API call
    // const loadPortfolio = async () => {
    //   const data = await fetchPortfolio(accountId);
    //   setPositions(data.positions);
    // };
    
    // Mock data for development
    setTimeout(() => {
      setPositions([
        { instrumentId: 'SBER', instrumentName: 'Сбербанк', ticker: 'SBER', quantity: 10, currentPrice: 280.5 },
        { instrumentId: 'GAZP', instrumentName: 'Газпром', ticker: 'GAZP', quantity: 25, currentPrice: 165.2 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleInstrumentClick = (position: Position) => {
    setSelectedInstrument({
      id: position.instrumentId,
      name: position.instrumentName,
      ticker: position.ticker,
    });
  };

  if (loading) {
    return <div className="p-4 text-center">Загрузка портфеля...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Портфель</h1>
      
      <div className="space-y-3">
        {positions.map((position) => (
          <div key={position.instrumentId}
            onClick={() => handleInstrumentClick(position)}
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-50 transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{position.ticker}</div>
                <div className="text-sm text-gray-600">{position.instrumentName}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{position.quantity} шт</div>
                <div className="text-sm text-gray-600">{position.currentPrice} ₽</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedInstrument && (
        <OrderForm
          instrument={selectedInstrument}
          onClose={() => setSelectedInstrument(null)}
        />
      )}
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import OrderForm from './OrderForm';
import { Instrument } from '../services/orderApi';

// TODO: Replace with actual portfolio data from API
const mockInstruments: Instrument[] = [
  { id: 'SBER', name: 'Сбербанк', ticker: 'SBER' },
  { id: 'GAZP', name: 'Газпром', ticker: 'GAZP' },
];

export default function Portfolio() {
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  if (selectedInstrument) {
    return (
      <div className="p-4">
        <OrderForm instrument={selectedInstrument} onClose={() => setSelectedInstrument(null)} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Портфель</h1>
      <div className="space-y-2">
        {mockInstruments.map(inst => (
          <button key={inst.id} onClick={() => setSelectedInstrument(inst)}
            className="w-full p-4 bg-white rounded-lg shadow text-left hover:bg-gray-50">
            <div className="font-bold">{inst.name}</div>
            <div className="text-gray-500">{inst.ticker}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

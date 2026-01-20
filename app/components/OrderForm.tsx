'use client';

import React, { useState } from 'react';
import { createOrder, generateClientOrderId, CreateOrderResponse } from '../services/orderApi';
import OrderResult from './OrderResult';

export interface Instrument {
  id: string;
  name: string;
  ticker?: string;
}

interface OrderFormProps {
  instrument: Instrument;
  onClose: () => void;
}

export default function OrderForm({ instrument, onClose }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: CreateOrderResponse; error?: string } | null>(null);

  const isValid = quantity && parseInt(quantity) > 0 && (orderType === 'market' || (price && parseFloat(price) > 0));

  const handleSubmit = async (side: 'buy' | 'sell') => {
    if (!isValid) return;
    setLoading(true);
    try {
      const response = await createOrder({
        clientOrderId: generateClientOrderId(),
        instrumentId: instrument.id,
        side,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      });
      setResult({ success: true, data: response });
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <OrderResult success={result.success} orderId={result.data?.orderId} error={result.error} onBack={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Подача заявки</h2>
        <p className="text-gray-600 mb-4">{instrument.ticker || instrument.name}</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Тип заявки</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
            className="w-full p-3 border rounded-lg">
            <option value="market">Рыночная</option>
            <option value="limit">Лимитная</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Количество (шт)</label>
          <input type="number" min="1" step="1" value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full p-3 border rounded-lg" placeholder="Введите количество" />
        </div>

        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input type="number" min="0.01" step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 border rounded-lg" placeholder="Введите цену" />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => handleSubmit('buy')} disabled={!isValid || loading}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg disabled:opacity-50">
            {loading ? 'Загрузка...' : 'Купить'}
          </button>
          <button onClick={() => handleSubmit('sell')} disabled={!isValid || loading}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg disabled:opacity-50">
            {loading ? 'Загрузка...' : 'Продать'}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 text-gray-600">Отмена</button>
      </div>
    </div>
  );
}

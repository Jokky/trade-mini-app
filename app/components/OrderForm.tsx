'use client';

import React, { useState } from 'react';
import { submitOrder, OrderRequest, OrderResponse } from '../services/orderApi';

interface OrderFormProps {
  instrumentId: string;
  instrumentName: string;
  onClose: () => void;
  onSuccess: (order: OrderResponse) => void;
  onError: (error: string) => void;
}

export default function OrderForm({ instrumentId, instrumentName, onClose, onSuccess, onError }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = quantity && parseInt(quantity) > 0 && (orderType === 'market' || (orderType === 'limit' && price && parseFloat(price) > 0));

  const handleSubmit = async (side: 'buy' | 'sell') => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const request: OrderRequest = {
        clientOrderId: crypto.randomUUID(),
        instrumentId,
        side,
        type: orderType,
        quantity: parseInt(quantity),
        ...(orderType === 'limit' && { price: parseFloat(price) }),
      };
      const response = await submitOrder(request);
      onSuccess(response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка отправки заявки');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Заявка: {instrumentName}</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Тип заявки</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')} className="w-full p-2 border rounded">
            <option value="market">Рыночная</option>
            <option value="limit">Лимитная</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Количество (шт.)</label>
          <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded" placeholder="0" />
        </div>

        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" placeholder="0.00" />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => handleSubmit('buy')} disabled={!isValid || isLoading} className="flex-1 bg-green-500 text-white py-3 rounded font-medium disabled:opacity-50">
            {isLoading ? 'Загрузка...' : 'Купить'}
          </button>
          <button onClick={() => handleSubmit('sell')} disabled={!isValid || isLoading} className="flex-1 bg-red-500 text-white py-3 rounded font-medium disabled:opacity-50">
            {isLoading ? 'Загрузка...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { createOrder, generateClientOrderId, CreateOrderResponse } from '../services/orderApi';

/** Интерфейс позиции портфеля - соответствует существующему PortfolioPosition */
export interface PortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  instrumentId?: string;
}

interface OrderFormProps {
  position: PortfolioPosition;
  onClose: () => void;
  onSuccess?: (response: CreateOrderResponse) => void;
}

export default function OrderForm({ position, onClose, onSuccess }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);

  const isValid = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) return false;
    if (orderType === 'limit') {
      const p = parseFloat(price);
      if (!p || p <= 0) return false;
    }
    return true;
  };

  const handleSubmit = async (side: 'buy' | 'sell') => {
    if (!isValid()) return;
    setLoading(true);
    
    const response = await createOrder({
      clientOrderId: generateClientOrderId(),
      instrumentId: position.instrumentId || position.ticker,
      side,
      type: orderType,
      quantity: parseInt(quantity, 10),
      price: orderType === 'limit' ? parseFloat(price) : undefined
    });
    
    setLoading(false);
    setResult(response);
    if (response.success && onSuccess) onSuccess(response);
  };

  // Экран результата
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
          {result.success ? (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-bold mb-2">Заявка отправлена</h2>
              <p className="text-gray-600 mb-4">ID: {result.originalClientOrderId}</p>
            </>
          ) : (
            <>
              <div className="text-red-500 text-5xl mb-4">✗</div>
              <h2 className="text-xl font-bold mb-2">Ошибка</h2>
              <p className="text-gray-600 mb-4">{result.error}</p>
            </>
          )}
          <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-lg">
            Вернуться в портфель
          </button>
        </div>
      </div>
    );
  }

  // Форма заявки
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{position.ticker}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
        </div>
        <p className="text-gray-600 mb-4">{position.name}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Тип заявки</label>
          <select 
            value={orderType} 
            onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
            className="w-full p-3 border rounded-lg"
          >
            <option value="market">Рыночная</option>
            <option value="limit">Лимитная</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Количество, шт.</label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full p-3 border rounded-lg"
            placeholder="Введите количество"
          />
        </div>

        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Введите цену"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit('buy')}
            disabled={!isValid() || loading}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? '...' : 'Купить'}
          </button>
          <button
            onClick={() => handleSubmit('sell')}
            disabled={!isValid() || loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? '...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { createOrder, CreateOrderResponse } from '../services/orderApi';

export interface OrderFormProps {
  instrumentId: string;
  instrumentName: string;
  instrumentTicker: string;
  onClose: () => void;
  onSuccess?: (response: CreateOrderResponse) => void;
  onError?: (error: string) => void;
}

type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';

export default function OrderForm({
  instrumentId,
  instrumentName,
  instrumentTicker,
  onClose,
  onSuccess,
  onError
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isValid = quantity && parseInt(quantity) > 0 && (orderType === 'market' || (price && parseFloat(price) > 0));

  const handleSubmit = async (side: OrderSide) => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const response = await createOrder({
        instrumentId,
        side,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined
      });
      setResult({ success: true, message: `Заявка ${response.orderId} успешно создана` });
      onSuccess?.(response);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка создания заявки';
      setResult({ success: false, message: errorMsg });
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
          <div className={`text-4xl mb-4 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
            {result.success ? '✓' : '✗'}
          </div>
          <h2 className="text-xl font-bold mb-2">{result.success ? 'Успешно' : 'Ошибка'}</h2>
          <p className="text-gray-600 mb-6">{result.message}</p>
          <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">
            Вернуться в портфель
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">{instrumentName}</h2>
            <span className="text-gray-500">{instrumentTicker}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
        </div>
        <div className="flex gap-2 mb-4">
          {(['market', 'limit'] as OrderType[]).map(type => (
            <button key={type} onClick={() => setOrderType(type)}
              className={`flex-1 py-2 rounded-lg ${orderType === type ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              {type === 'market' ? 'Рыночная' : 'Лимитная'}
            </button>
          ))}
        </div>
        <input type="number" placeholder="Количество, шт." value={quantity}
          onChange={e => setQuantity(e.target.value)} min="1"
          className="w-full p-3 border rounded-lg mb-3" />
        {orderType === 'limit' && (
          <input type="number" placeholder="Цена" value={price}
            onChange={e => setPrice(e.target.value)} step="0.01" min="0.01"
            className="w-full p-3 border rounded-lg mb-3" />
        )}
        <div className="flex gap-3">
          <button onClick={() => handleSubmit('buy')} disabled={!isValid || isLoading}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50">
            {isLoading ? '...' : 'Купить'}
          </button>
          <button onClick={() => handleSubmit('sell')} disabled={!isValid || isLoading}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50">
            {isLoading ? '...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}
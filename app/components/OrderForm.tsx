'use client';

/**
 * OrderForm Component - Order submission form
 * Issue #15: Добавить форму подачи заявки по инструменту
 */

import React, { useState } from 'react';
import { OrderDirection, OrderType, Instrument } from '../types/order';
import { createOrder, generateClientOrderId } from '../services/orderService';

interface OrderFormProps {
  instrument: Instrument;
  authToken: string;
  onSuccess: (clientOrderId: string) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export default function OrderForm({ instrument, authToken, onSuccess, onError, onClose }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const quantityNum = parseInt(quantity, 10);
  const priceNum = parseFloat(price);
  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0 && Number.isInteger(quantityNum);
  const isPriceValid = orderType === 'market' || (!isNaN(priceNum) && priceNum > 0);
  const isFormValid = isQuantityValid && isPriceValid;

  const handleSubmit = async (direction: OrderDirection) => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);

    try {
      const clientOrderId = generateClientOrderId();
      await createOrder({
        board: instrument.board,
        symbol: instrument.symbol,
        direction,
        quantity: quantityNum,
        orderType,
        price: orderType === 'limit' ? priceNum : undefined,
        clientOrderId,
      }, authToken);
      onSuccess(clientOrderId);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{instrument.symbol}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Тип заявки</label>
        <div className="flex gap-2">
          <button onClick={() => setOrderType('market')} className={`flex-1 py-2 px-4 rounded ${orderType === 'market' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Рыночная</button>
          <button onClick={() => setOrderType('limit')} className={`flex-1 py-2 px-4 rounded ${orderType === 'limit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Лимитная</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Количество (шт.)</label>
        <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите количество" />
      </div>

      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Цена</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите цену" />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => handleSubmit('buy')} disabled={!isFormValid || isLoading} className="flex-1 py-3 bg-green-500 text-white rounded disabled:opacity-50">{isLoading ? 'Загрузка...' : 'Купить'}</button>
        <button onClick={() => handleSubmit('sell')} disabled={!isFormValid || isLoading} className="flex-1 py-3 bg-red-500 text-white rounded disabled:opacity-50">{isLoading ? 'Загрузка...' : 'Продать'}</button>
      </div>
    </div>
  );
}

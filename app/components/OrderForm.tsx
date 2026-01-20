'use client';

import React, { useState } from 'react';
import { createOrder, generateClientOrderId, OrderSide, OrderType } from '../services/orderApi';
import OrderResult from './OrderResult';

interface OrderFormProps {
  instrumentId: string;
  instrumentName: string;
  onClose: () => void;
  authToken: string;
}

export default function OrderForm({ instrumentId, instrumentName, onClose, authToken }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isValid = quantity && parseInt(quantity) > 0 && (orderType === 'market' || (orderType === 'limit' && price && parseFloat(price) > 0));

  const handleSubmit = async (side: OrderSide) => {
    if (!isValid) return;
    setLoading(true);
    try {
      const response = await createOrder({
        clientOrderId: generateClientOrderId(),
        instrumentId,
        side,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      }, authToken);
      setResult({ success: true, message: `Заявка ${response.orderId} успешно создана` });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <OrderResult success={result.success} message={result.message} onBack={onClose} />;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">{instrumentName}</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Тип заявки</label>
        <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className="w-full p-2 border rounded">
          <option value="market">Рыночная</option>
          <option value="limit">Лимитная</option>
        </select>
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
        <button onClick={() => handleSubmit('buy')} disabled={!isValid || loading} className="flex-1 bg-green-500 text-white p-3 rounded disabled:opacity-50">
          {loading ? 'Загрузка...' : 'Купить'}
        </button>
        <button onClick={() => handleSubmit('sell')} disabled={!isValid || loading} className="flex-1 bg-red-500 text-white p-3 rounded disabled:opacity-50">
          {loading ? 'Загрузка...' : 'Продать'}
        </button>
      </div>
      
      <button onClick={onClose} className="w-full mt-2 p-2 text-gray-600 border rounded">Отмена</button>
    </div>
  );
}

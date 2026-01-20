'use client';

import React, { useState } from 'react';
import { createOrder, OrderType, OrderSide, CreateOrderResponse } from '../services/orderApi';

interface OrderFormProps {
  instrumentId: string;
  instrumentName: string;
  instrumentTicker?: string;
  onClose: () => void;
  onSuccess: (response: CreateOrderResponse) => void;
  onError: (error: string) => void;
}

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

  const quantityNum = parseInt(quantity, 10);
  const priceNum = parseFloat(price);
  
  const isValid = quantityNum > 0 && Number.isInteger(quantityNum) && 
    (orderType === 'market' || (orderType === 'limit' && priceNum > 0));

  const handleSubmit = async (side: OrderSide) => {
    if (!isValid || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await createOrder(
        instrumentId,
        side,
        orderType,
        quantityNum,
        orderType === 'limit' ? priceNum : undefined
      );
      onSuccess(response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка создания заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setQuantity(val);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Подача заявки</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>
        
        <div className="mb-4">
          <p className="font-medium">{instrumentName}</p>
          {instrumentTicker && <p className="text-gray-500 text-sm">{instrumentTicker}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Тип заявки</label>
          <select 
            value={orderType} 
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full border rounded p-2"
          >
            <option value="market">Рыночная</option>
            <option value="limit">Лимитная</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Количество (шт.)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Введите количество"
            className="w-full border rounded p-2"
          />
        </div>

        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Введите цену"
              className="w-full border rounded p-2"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit('buy')}
            disabled={!isValid || isLoading}
            className="flex-1 bg-green-500 text-white py-3 rounded font-medium disabled:bg-gray-300"
          >
            {isLoading ? 'Загрузка...' : 'Купить'}
          </button>
          <button
            onClick={() => handleSubmit('sell')}
            disabled={!isValid || isLoading}
            className="flex-1 bg-red-500 text-white py-3 rounded font-medium disabled:bg-gray-300"
          >
            {isLoading ? 'Загрузка...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}

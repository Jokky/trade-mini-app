'use client';

import React, { useState, useCallback } from 'react';
import { OrderFormProps, OrderType, OrderDirection, CreateOrderRequest } from '../types/order';
import { createOrder, generateClientOrderId } from '../services/orderService';

export default function OrderForm({ instrument, onSuccess, onError, onClose }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const quantityNum = parseInt(quantity, 10);
  const priceNum = parseFloat(price);
  
  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0 && 
    quantityNum <= instrument.availableQuantity && Number.isInteger(quantityNum);
  const isPriceValid = orderType === 'market' || (!isNaN(priceNum) && priceNum > 0);
  const isFormValid = isQuantityValid && isPriceValid;

  const handleSubmit = useCallback(async (direction: OrderDirection) => {
    if (!isFormValid || isLoading) return;
    
    setIsLoading(true);
    const request: CreateOrderRequest = {
      board: instrument.board,
      symbol: instrument.ticker,
      direction,
      quantity: quantityNum,
      orderType,
      clientOrderId: generateClientOrderId(),
      ...(orderType === 'limit' && { price: priceNum }),
    };

    try {
      const response = await createOrder(request);
      onSuccess(response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, instrument, quantityNum, orderType, priceNum, onSuccess, onError]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{instrument.name} ({instrument.ticker})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Тип заявки</label>
          <div className="flex gap-2">
            <button onClick={() => setOrderType('market')} className={`flex-1 py-2 rounded ${orderType === 'market' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Рыночная</button>
            <button onClick={() => setOrderType('limit')} className={`flex-1 py-2 rounded ${orderType === 'limit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Лимитная</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Количество (макс: {instrument.availableQuantity})</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" max={instrument.availableQuantity} step="1" className="w-full border rounded px-3 py-2" placeholder="Введите количество" />
          {quantity && !isQuantityValid && <p className="text-red-500 text-sm mt-1">Введите целое число от 1 до {instrument.availableQuantity}</p>}
        </div>

        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0.01" step="0.01" className="w-full border rounded px-3 py-2" placeholder="Введите цену" />
            {price && !isPriceValid && <p className="text-red-500 text-sm mt-1">Введите положительное число</p>}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">Загрузка...</div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => handleSubmit('buy')} disabled={!isFormValid} className="flex-1 py-3 rounded bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">Купить</button>
            <button onClick={() => handleSubmit('sell')} disabled={!isFormValid} className="flex-1 py-3 rounded bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">Продать</button>
          </div>
        )}
      </div>
    </div>
  );
}

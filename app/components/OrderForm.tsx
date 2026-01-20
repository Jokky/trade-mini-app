'use client';
import React, { useState } from 'react';
import { createOrder, generateClientOrderId } from '../services/orderService';
import { OrderDirection, OrderType, OrderResponse } from '../types/order';

interface OrderFormProps {
  instrumentId: string;
  instrumentName: string;
  instrumentTicker: string;
  board?: string;
  availableQuantity?: number;
  onSuccess: (response: OrderResponse) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function OrderForm(props: OrderFormProps) {
  const { instrumentName, instrumentTicker, board = 'TQBR', availableQuantity = 0, onSuccess, onError, onClose } = props;
  
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const quantityNum = parseInt(quantity, 10) || 0;
  const priceNum = parseFloat(price) || 0;
  const isQuantityValid = quantityNum > 0 && quantityNum <= (availableQuantity || Infinity);
  const isPriceValid = orderType === 'market' || priceNum > 0;
  const isFormValid = isQuantityValid && isPriceValid;

  const handleSubmit = async (direction: OrderDirection) => {
    if (!isFormValid) return;
    setLoading(true);
    
    const response = await createOrder({
      board,
      symbol: instrumentTicker,
      direction,
      quantity: quantityNum,
      orderType,
      price: orderType === 'limit' ? priceNum : undefined,
      clientOrderId: generateClientOrderId(),
    });
    
    setLoading(false);
    response.success ? onSuccess(response) : onError(response.error || 'Ошибка');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{instrumentName} ({instrumentTicker})</h2>
        <button onClick={onClose} className="text-gray-500">✕</button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm mb-2">Тип заявки</label>
        <div className="flex gap-2">
          <button onClick={() => setOrderType('market')} className={`px-4 py-2 rounded ${orderType === 'market' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Рыночная</button>
          <button onClick={() => setOrderType('limit')} className={`px-4 py-2 rounded ${orderType === 'limit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Лимитная</button>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm mb-2">Количество (шт.){availableQuantity > 0 && ` — доступно: ${availableQuantity}`}</label>
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите количество" />
      </div>
      
      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block text-sm mb-2">Цена</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите цену" />
        </div>
      )}
      
      <div className="flex gap-2">
        <button onClick={() => handleSubmit('buy')} disabled={!isFormValid || loading} className="flex-1 py-2 bg-green-500 text-white rounded disabled:opacity-50">{loading ? 'Загрузка...' : 'Купить'}</button>
        <button onClick={() => handleSubmit('sell')} disabled={!isFormValid || loading} className="flex-1 py-2 bg-red-500 text-white rounded disabled:opacity-50">{loading ? 'Загрузка...' : 'Продать'}</button>
      </div>
    </div>
  );
}

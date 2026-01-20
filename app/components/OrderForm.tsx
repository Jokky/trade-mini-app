'use client';
import React, { useState } from 'react';
import { createOrder, generateClientOrderId, OrderType, OrderSide, Instrument } from '../services/orderApi';
import OrderResult from './OrderResult';

interface Props {
  instrument: Instrument;
  onClose: () => void;
}

export default function OrderForm({ instrument, onClose }: Props) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const quantityNum = parseInt(quantity, 10);
  const priceNum = parseFloat(price);
  const isValid = quantityNum > 0 && Number.isInteger(quantityNum) && 
    (orderType === 'market' || priceNum > 0);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setQuantity(val);
  };

  const submitOrder = async (side: OrderSide) => {
    if (!isValid) return;
    setLoading(true);
    try {
      const resp = await createOrder({
        clientOrderId: generateClientOrderId(),
        instrumentId: instrument.id,
        side,
        type: orderType,
        quantity: quantityNum,
        ...(orderType === 'limit' && { price: priceNum }),
      });
      setResult({ success: true, message: `Заявка ${resp.originalClientOrderId} создана` });
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  if (result) return <OrderResult success={result.success} message={result.message} onBack={onClose} />;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-2">{instrument.name}</h2>
      <p className="text-gray-500 mb-4">{instrument.ticker}</p>
      
      <div className="mb-4">
        <label className="block mb-1">Тип заявки</label>
        <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}
          className="w-full p-2 border rounded">
          <option value="market">Рыночная</option>
          <option value="limit">Лимитная</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Количество (шт.)</label>
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantity}
          onChange={handleQuantityChange} className="w-full p-2 border rounded" placeholder="0" />
      </div>

      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block mb-1">Цена</label>
          <input type="number" step="0.01" min="0" value={price}
            onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => submitOrder('buy')} disabled={!isValid || loading}
          className="flex-1 bg-green-500 text-white p-2 rounded disabled:opacity-50">
          {loading ? '...' : 'Купить'}
        </button>
        <button onClick={() => submitOrder('sell')} disabled={!isValid || loading}
          className="flex-1 bg-red-500 text-white p-2 rounded disabled:opacity-50">
          {loading ? '...' : 'Продать'}
        </button>
      </div>
      <button onClick={onClose} className="w-full mt-2 p-2 border rounded">Отмена</button>
    </div>
  );
}

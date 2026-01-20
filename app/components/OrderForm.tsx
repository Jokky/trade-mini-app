'use client';
import { useState } from 'react';
import { OrderDirection, OrderType, OrderRequest, InstrumentInfo } from '../types/order';
import { createOrder, generateClientOrderId, validateOrderRequest } from '../services/orderService';

interface OrderFormProps {
  instrument: InstrumentInfo;
  authToken: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function OrderForm({ instrument, authToken, onSuccess, onError, onClose }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isValid = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return false;
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) return false;
    return true;
  };

  const handleSubmit = async (direction: OrderDirection) => {
    const request: OrderRequest = {
      board: instrument.board,
      symbol: instrument.symbol,
      direction,
      quantity: parseInt(quantity, 10),
      orderType,
      clientOrderId: generateClientOrderId(),
      ...(orderType === 'limit' && { price: parseFloat(price) }),
    };

    const errors = validateOrderRequest(request);
    if (errors.length > 0) {
      onError(errors.join(', '));
      return;
    }

    setLoading(true);
    try {
      const response = await createOrder(request, authToken);
      onSuccess(response.originalClientOrderId);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">{instrument.name} ({instrument.symbol})</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Тип заявки</label>
        <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className="w-full p-2 border rounded">
          <option value="market">Рыночная</option>
          <option value="limit">Лимитная</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Количество (шт.)</label>
        <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите количество" />
      </div>

      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block mb-2">Цена</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" placeholder="Введите цену" />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => handleSubmit('buy')} disabled={!isValid() || loading} className="flex-1 p-3 bg-green-500 text-white rounded disabled:opacity-50">
          {loading ? 'Загрузка...' : 'Купить'}
        </button>
        <button onClick={() => handleSubmit('sell')} disabled={!isValid() || loading} className="flex-1 p-3 bg-red-500 text-white rounded disabled:opacity-50">
          {loading ? 'Загрузка...' : 'Продать'}
        </button>
      </div>

      <button onClick={onClose} className="w-full mt-2 p-2 border rounded">Отмена</button>
    </div>
  );
}

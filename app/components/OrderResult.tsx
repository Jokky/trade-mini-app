'use client';
import { useEffect, useState } from 'react';
import { OrderStatus } from '../types/order';
import { getOrderStatus } from '../services/orderService';

interface OrderResultProps {
  orderId: string;
  authToken: string;
  success: boolean;
  errorMessage?: string;
  onBackToPortfolio: () => void;
}

export default function OrderResult({ orderId, authToken, success, errorMessage, onBackToPortfolio }: OrderResultProps) {
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (success && orderId) {
      // TODO: Add polling for status updates
      getOrderStatus(orderId, authToken)
        .then(setStatus)
        .catch(console.error);
    }
  }, [orderId, authToken, success]);

  return (
    <div className="p-4 bg-white rounded-lg shadow text-center">
      {success ? (
        <>
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Заявка успешно выставлена</h2>
          <p className="text-gray-600 mb-4">ID заявки: {orderId}</p>
          {status && (
            <p className="text-gray-600 mb-4">Статус: {status.status}</p>
          )}
        </>
      ) : (
        <>
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <h2 className="text-xl font-bold mb-2">Ошибка выставления заявки</h2>
          <p className="text-red-600 mb-4">{errorMessage || 'Неизвестная ошибка'}</p>
        </>
      )}

      <button onClick={onBackToPortfolio} className="w-full p-3 bg-blue-500 text-white rounded">
        Вернуться в портфель
      </button>
    </div>
  );
}

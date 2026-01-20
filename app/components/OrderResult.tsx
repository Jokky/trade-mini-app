'use client';

import React from 'react';
import { OrderResponse } from '../services/orderApi';

interface OrderResultProps {
  success: boolean;
  order?: OrderResponse;
  errorMessage?: string;
  onBackToPortfolio: () => void;
}

export default function OrderResult({ success, order, errorMessage, onBackToPortfolio }: OrderResultProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        {success ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2 text-green-600">Заявка успешно отправлена</h2>
            {order && (
              <div className="text-sm text-gray-600 mb-4">
                <p>ID заявки: {order.orderId}</p>
                <p>Статус: {order.status}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2 text-red-600">Ошибка отправки заявки</h2>
            <p className="text-sm text-gray-600 mb-4">{errorMessage || 'Произошла неизвестная ошибка'}</p>
          </>
        )}
        
        <button onClick={onBackToPortfolio} className="w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600">
          Вернуться в портфель
        </button>
      </div>
    </div>
  );
}

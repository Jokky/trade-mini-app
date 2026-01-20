'use client';

import React from 'react';
import { OrderResultProps } from '../types/order';

export default function OrderResult({ success, message, orderId, onBackToPortfolio }: OrderResultProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <div className={`text-6xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
          {success ? '✓' : '✗'}
        </div>
        <h2 className="text-xl font-bold mb-2">
          {success ? 'Заявка выставлена' : 'Ошибка выставления заявки'}
        </h2>
        <p className="text-gray-600 mb-2">{message}</p>
        {orderId && <p className="text-sm text-gray-500 mb-4">ID заявки: {orderId}</p>}
        <button onClick={onBackToPortfolio} className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
          Вернуться в портфель
        </button>
      </div>
    </div>
  );
}

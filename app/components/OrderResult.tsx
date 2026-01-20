'use client';

import React from 'react';
import { CreateOrderResponse } from '../services/orderApi';

interface OrderResultProps {
  success: boolean;
  response?: CreateOrderResponse;
  error?: string;
  onClose: () => void;
}

export default function OrderResult({ success, response, error, onClose }: OrderResultProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
        {success ? (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">Заявка создана</h2>
            <p className="text-gray-600 mb-4">
              ID заявки: {response?.originalClientOrderId || response?.orderId}
            </p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-xl font-bold mb-2">Ошибка</h2>
            <p className="text-gray-600 mb-4">{error || 'Не удалось создать заявку'}</p>
          </>
        )}
        
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-3 rounded font-medium"
        >
          Вернуться в портфель
        </button>
      </div>
    </div>
  );
}

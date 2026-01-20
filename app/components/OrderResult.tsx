'use client';
import React from 'react';
import { OrderResponse } from '../types/order';

interface OrderResultProps {
  success: boolean;
  response?: OrderResponse;
  error?: string;
  onClose: () => void;
}

export default function OrderResult({ success, response, error, onClose }: OrderResultProps) {
  const message = success 
    ? `Заявка успешно выставлена${response?.orderId ? ` (ID: ${response.orderId})` : ''}` 
    : error || response?.error || 'Произошла ошибка при выставлении заявки';

  return (
    <div className="p-4 bg-white rounded-lg shadow text-center">
      <div className={`text-4xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
        {success ? '✓' : '✕'}
      </div>
      <h2 className="text-lg font-semibold mb-2">
        {success ? 'Успешно' : 'Ошибка'}
      </h2>
      <p className="text-gray-600 mb-4">{message}</p>
      <button 
        onClick={onClose} 
        className="w-full py-2 bg-blue-500 text-white rounded"
      >
        Вернуться в портфель
      </button>
    </div>
  );
}

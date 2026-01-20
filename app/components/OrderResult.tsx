'use client';

import React from 'react';

interface OrderResultProps {
  success: boolean;
  message: string;
  onBack: () => void;
}

export default function OrderResult({ success, message, onBack }: OrderResultProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg text-center">
      <div className={`text-6xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
        {success ? '✓' : '✗'}
      </div>
      
      <h2 className={`text-xl font-bold mb-2 ${success ? 'text-green-600' : 'text-red-600'}`}>
        {success ? 'Заявка успешно выставлена' : 'Ошибка выставления заявки'}
      </h2>
      
      <p className="text-gray-600 mb-6">{message}</p>
      
      <button onClick={onBack} className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600">
        Вернуться в портфель
      </button>
    </div>
  );
}

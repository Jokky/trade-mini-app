'use client';
import React from 'react';

interface Props {
  success: boolean;
  message: string;
  onBack: () => void;
}

export default function OrderResult({ success, message, onBack }: Props) {
  return (
    <div className="p-4 bg-white rounded-lg shadow text-center">
      <div className={`text-4xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
        {success ? '✓' : '✗'}
      </div>
      <h2 className="text-lg font-bold mb-2">
        {success ? 'Заявка успешно создана' : 'Ошибка создания заявки'}
      </h2>
      <p className="text-gray-600 mb-4">{message}</p>
      <button onClick={onBack} className="w-full bg-blue-500 text-white p-2 rounded">
        Вернуться в портфель
      </button>
    </div>
  );
}

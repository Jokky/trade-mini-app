'use client';

import React from 'react';

interface OrderResultProps {
  success: boolean;
  orderId?: string;
  error?: string;
  onBack: () => void;
}

export default function OrderResult({ success, orderId, error, onBack }: OrderResultProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
        {success ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Заявка отправлена</h2>
            <p className="text-gray-600 mb-4">Номер заявки: {orderId}</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">Ошибка</h2>
            <p className="text-red-600 mb-4">{error || 'Не удалось отправить заявку'}</p>
          </>
        )}
        <button onClick={onBack} className="w-full bg-blue-500 text-white py-3 rounded-lg">
          Вернуться в портфель
        </button>
      </div>
    </div>
  );
}

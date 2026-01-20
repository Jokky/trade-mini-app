'use client';
/**
 * Расширение для Portfolio - добавляет функционал заявок
 * 
 * ВАЖНО: Этот файл НЕ заменяет существующий Portfolio.tsx!
 * Он должен быть интегрирован в существующий компонент путём:
 * 1. Импорта OrderForm и PortfolioPosition
 * 2. Добавления useState для selectedPosition
 * 3. Добавления onClick на элементы позиций
 * 4. Рендера OrderForm когда selectedPosition !== null
 * 
 * Пример интеграции в существующий Portfolio.tsx:
 * 
 * import OrderForm, { PortfolioPosition } from './OrderForm';
 * 
 * // Внутри компонента Portfolio:
 * const [selectedPosition, setSelectedPosition] = useState<PortfolioPosition | null>(null);
 * 
 * // В месте рендера позиций добавить onClick:
 * <div onClick={() => setSelectedPosition(position)} className="cursor-pointer">
 *   ... существующий код отображения позиции ...
 * </div>
 * 
 * // В конце JSX добавить:
 * {selectedPosition && (
 *   <OrderForm 
 *     position={selectedPosition} 
 *     onClose={() => setSelectedPosition(null)} 
 *   />
 * )}
 */

import React, { useState } from 'react';
import OrderForm, { PortfolioPosition } from './OrderForm';

// Демо-данные для тестирования (в реальном приложении данные из API)
const DEMO_POSITIONS: PortfolioPosition[] = [
  { ticker: 'SBER', name: 'Сбербанк', quantity: 10, totalValue: 2650, profitLoss: 150, profitLossPercent: 6.0, instrumentId: 'SBER' },
  { ticker: 'GAZP', name: 'Газпром', quantity: 20, totalValue: 3200, profitLoss: -80, profitLossPercent: -2.4, instrumentId: 'GAZP' },
];

/** Демо-компонент для тестирования OrderForm */
export default function PortfolioWithOrders() {
  const [selectedPosition, setSelectedPosition] = useState<PortfolioPosition | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Портфель (демо)</h1>
      <p className="text-sm text-gray-500 mb-4">Кликните на инструмент для открытия формы заявки</p>
      
      <div className="space-y-3">
        {DEMO_POSITIONS.map((pos) => (
          <div
            key={pos.ticker}
            onClick={() => setSelectedPosition(pos)}
            className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <div>
                <span className="font-bold">{pos.ticker}</span>
                <span className="text-gray-500 ml-2">{pos.name}</span>
              </div>
              <div className="text-right">
                <div>{pos.totalValue.toLocaleString('ru-RU')} ₽</div>
                <div className={pos.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {pos.profitLoss >= 0 ? '+' : ''}{pos.profitLoss.toLocaleString('ru-RU')} ₽ ({pos.profitLossPercent}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPosition && (
        <OrderForm
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
}

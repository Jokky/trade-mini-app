'use client';

import React, { useState } from 'react';
import { createOrder, CreateOrderResponse } from '../services/orderApi';
import { Modal, Button, Input, Cell, Spinner } from '@telegram-apps/telegram-ui';

export interface OrderFormProps {
  ticker: string;
  classCode: string;
  instrumentName: string;
  onClose: () => void;
  onSuccess?: (response: CreateOrderResponse) => void;
  onError?: (error: string) => void;
}

type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';

export default function OrderForm({
  ticker,
  classCode,
  instrumentName,
  onClose,
  onSuccess,
  onError,
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isValid =
    quantity && parseInt(quantity) > 0 && (orderType === 'market' || (price && parseFloat(price) > 0));

  const handleSubmit = async (side: OrderSide) => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const response = await createOrder({
        ticker,
        classCode,
        side,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      });
      setResult({ success: true, message: `Заявка ${response.clientOrderId} успешно создана` });
      onSuccess?.(response);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка создания заявки';
      setResult({ success: false, message: errorMsg });
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <Modal open={true} onClose={onClose}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: result.success ? 'var(--tgui--link_color)' : 'var(--tgui--destructive_text_color)' }}>
            {result.success ? '✓' : '✗'}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            {result.success ? 'Успешно' : 'Ошибка'}
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--tgui--hint_color)' }}>
            {result.message}
          </p>
          <Button onClick={onClose} size="l" stretched>
            Вернуться в портфель
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div style={{ padding: '16px' }}>
        <Cell
          before={<div />}
          after={
            <Button mode="plain" onClick={onClose}>
              ×
            </Button>
          }
          subtitle={ticker}
        >
          {instrumentName}
        </Cell>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '16px' }}>
          <Button
            mode={orderType === 'market' ? 'primary' : 'secondary'}
            onClick={() => setOrderType('market')}
            style={{ flex: 1 }}
          >
            Рыночная
          </Button>
          <Button
            mode={orderType === 'limit' ? 'primary' : 'secondary'}
            onClick={() => setOrderType('limit')}
            style={{ flex: 1 }}
          >
            Лимитная
          </Button>
        </div>
        <Input
          type="number"
          placeholder="Количество, шт."
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ marginBottom: '12px' }}
        />
        {orderType === 'limit' && (
          <Input
            type="number"
            placeholder="Цена"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0.01"
            style={{ marginBottom: '12px' }}
          />
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button
            onClick={() => handleSubmit('buy')}
            disabled={!isValid || isLoading}
            mode="primary"
            style={{ flex: 1, backgroundColor: 'var(--tgui--button_positive_bg_color)' }}
          >
            {isLoading ? <Spinner size="s" /> : 'Купить'}
          </Button>
          <Button
            onClick={() => handleSubmit('sell')}
            disabled={!isValid || isLoading}
            mode="primary"
            style={{ flex: 1, backgroundColor: 'var(--tgui--destructive_text_color)' }}
          >
            {isLoading ? <Spinner size="s" /> : 'Продать'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

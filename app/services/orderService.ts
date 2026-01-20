/**
 * Order API Service
 * Issue #15: API integration for order submission
 */

import { OrderRequest, OrderResponse, OrderStatusResponse } from '../types/order';

const API_BASE_URL = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

export function generateClientOrderId(): string {
  // UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createOrder(
  order: OrderRequest,
  authToken: string
): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Ошибка создания заявки');
  }

  return response.json();
}

export async function getOrderStatus(
  clientOrderId: string,
  authToken: string
): Promise<OrderStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${clientOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Ошибка получения статуса заявки');
  }

  return response.json();
}

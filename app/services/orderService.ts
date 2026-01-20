/**
 * Order API service using proxy to avoid CORS issues
 */
import { CreateOrderRequest, OrderResponse } from '../types/order';

const API_BASE = '/api/bcs/trade-api-bff-operations/api/v1';

/**
 * Generate UUID v4 for clientOrderId
 */
export function generateClientOrderId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new order
 */
export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка создания заявки: ${response.status}`);
  }

  return response.json();
}

/**
 * Get order status by clientOrderId
 */
export async function getOrderStatus(clientOrderId: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE}/orders/${clientOrderId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Ошибка получения статуса: ${response.status}`);
  }

  return response.json();
}

/**
 * Order API Service for BCS Trade API
 * Handles order creation and status checking
 */

import { v4 as uuidv4 } from 'uuid';

export type OrderType = 'market' | 'limit';
export type OrderSide = 'buy' | 'sell';

export interface CreateOrderRequest {
  clientOrderId: string;
  instrumentId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
}

export interface OrderResponse {
  originalClientOrderId: string;
  status: string;
  message?: string;
}

export interface Instrument {
  id: string;
  name: string;
  ticker: string;
}

const API_BASE = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

/** Get auth token from Telegram WebApp initData */
function getAuthToken(): string {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
}

export function generateClientOrderId(): string {
  return uuidv4();
}

export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка создания заявки');
  }
  
  return response.json();
}

export async function getOrderStatus(orderId: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  });
  
  if (!response.ok) throw new Error('Ошибка получения статуса');
  return response.json();
}

declare global {
  interface Window { Telegram?: { WebApp?: { initData?: string } } }
}

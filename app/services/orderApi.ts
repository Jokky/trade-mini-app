/**
 * Order API Service for BCS Trade API
 * Handles order creation and status checking
 */

export interface CreateOrderRequest {
  clientOrderId: string;
  instrumentId: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
}

export interface CreateOrderResponse {
  originalClientOrderId: string;
  orderId: string;
  status: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  message?: string;
}

const API_BASE = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

/** Generate unique client order ID */
export function generateClientOrderId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Get auth token from Telegram WebApp */
function getAuthToken(): string {
  // Access Telegram WebApp initData for authentication
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    return (window as any).Telegram.WebApp.initData;
  }
  // Fallback for development
  return localStorage.getItem('authToken') || '';
}

/** Create a new order */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Ошибка создания заявки: ${response.status}`);
  }

  return response.json();
}

/** Get order status */
export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatusResponse> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/orders/${originalClientOrderId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Ошибка получения статуса: ${response.status}`);
  }

  return response.json();
}

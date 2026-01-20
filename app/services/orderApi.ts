export interface OrderRequest {
  clientOrderId: string;
  instrumentId: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
}

export interface OrderResponse {
  originalClientOrderId: string;
  orderId: string;
  status: string;
  message?: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  filledQuantity?: number;
  message?: string;
}

const BASE_URL = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

function getAuthHeaders(): HeadersInit {
  // TODO: Implement proper auth token retrieval from Telegram Mini App context
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function submitOrder(request: OrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `Ошибка: ${response.status}`);
  }
  
  return response.json();
}

export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatus> {
  const response = await fetch(`${BASE_URL}/orders/${originalClientOrderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка получения статуса: ${response.status}`);
  }
  
  return response.json();
}

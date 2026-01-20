import { v4 as uuidv4 } from 'uuid';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface CreateOrderRequest {
  clientOrderId: string;
  instrumentId: string;
  side: OrderSide;
  type: OrderType;
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
  filledQuantity?: number;
  message?: string;
}

const BASE_URL = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

export const generateClientOrderId = (): string => uuidv4();

export async function createOrder(request: CreateOrderRequest, authToken: string): Promise<CreateOrderResponse> {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка при создании заявки');
  }

  return response.json();
}

export async function getOrderStatus(originalClientOrderId: string, authToken: string): Promise<OrderStatusResponse> {
  const response = await fetch(`${BASE_URL}/orders/${originalClientOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Ошибка при получении статуса заявки');
  }

  return response.json();
}

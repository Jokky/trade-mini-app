/**
 * Order API Service for BCS Trade API
 * Handles order creation and status checking via /api/bcs proxy
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

export interface CreateOrderResponse {
  originalClientOrderId: string;
  orderId?: string;
  status: string;
  message?: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  filledQuantity?: number;
  message?: string;
}

/**
 * Creates a new order via /api/bcs proxy endpoint
 * Uses existing auth mechanism from the proxy
 */
export async function createOrder(
  instrumentId: string,
  side: OrderSide,
  type: OrderType,
  quantity: number,
  price?: number
): Promise<CreateOrderResponse> {
  const clientOrderId = uuidv4();
  
  const body: CreateOrderRequest = {
    clientOrderId,
    instrumentId,
    side,
    type,
    quantity,
  };
  
  if (type === 'limit' && price !== undefined) {
    body.price = price;
  }

  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '/trade-api-bff-operations/api/v1/orders',
      method: 'POST',
      body
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create order');
  }

  return response.json();
}

/**
 * Gets order status via /api/bcs proxy endpoint
 */
export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatusResponse> {
  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: `/trade-api-bff-operations/api/v1/orders/${originalClientOrderId}`,
      method: 'GET'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get order status');
  }

  return response.json();
}

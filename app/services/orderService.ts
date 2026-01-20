/**
 * Order service for API integration
 * Docs: https://trade-api.bcs.ru/http/operations/create
 */
import { OrderRequest, OrderResponse, OrderStatus } from '../types/order';

const API_BASE_URL = 'https://be.broker.ru/trade-api-bff-operations/api/v1';

export function generateClientOrderId(): string {
  return crypto.randomUUID();
}

export async function createOrder(request: OrderRequest, authToken: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create order: ${response.status}`);
  }

  return response.json();
}

export async function getOrderStatus(clientOrderId: string, authToken: string): Promise<OrderStatus> {
  const response = await fetch(`${API_BASE_URL}/orders/${clientOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get order status: ${response.status}`);
  }

  return response.json();
}

export function validateOrderRequest(request: Partial<OrderRequest>): string[] {
  const errors: string[] = [];
  
  if (!request.board) errors.push('Board is required');
  if (!request.symbol) errors.push('Symbol is required');
  if (!request.direction) errors.push('Direction is required');
  if (!request.quantity || request.quantity <= 0) errors.push('Quantity must be positive');
  if (!Number.isInteger(request.quantity)) errors.push('Quantity must be integer');
  if (!request.orderType) errors.push('Order type is required');
  if (request.orderType === 'limit' && (!request.price || request.price <= 0)) {
    errors.push('Price is required for limit orders');
  }
  
  return errors;
}

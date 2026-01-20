import { CreateOrderRequest, OrderResponse } from '../types/order';

const API_BASE = '/api/bcs';

export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createOrder', ...request }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Ошибка создания заявки' };
    }
    
    const data = await response.json();
    return { success: true, orderId: data.orderId, clientOrderId: request.clientOrderId };
  } catch (error) {
    return { success: false, error: 'Ошибка сети. Попробуйте позже.' };
  }
}

export async function getOrderStatus(clientOrderId: string): Promise<OrderResponse> {
  try {
    const response = await fetch(`${API_BASE}?action=orderStatus&id=${clientOrderId}`);
    if (!response.ok) {
      return { success: false, error: 'Не удалось получить статус заявки' };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Ошибка сети' };
  }
}

export function generateClientOrderId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

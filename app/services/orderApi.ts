/**
 * Order API Service - Создание и проверка статуса заявок
 * Использует существующий /api/bcs proxy с action-based форматом
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
  success: boolean;
  orderId?: string;
  originalClientOrderId?: string;
  status?: string;
  error?: string;
}

export interface OrderStatusResponse {
  success: boolean;
  status?: string;
  filledQuantity?: number;
  error?: string;
}

/** Генерация UUID v4 для clientOrderId */
export function generateClientOrderId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Создание заявки через /api/bcs proxy */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  try {
    const response = await fetch('/api/bcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createOrder',
        orderData: request
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        orderId: data.orderId,
        originalClientOrderId: data.originalClientOrderId || request.clientOrderId,
        status: data.status
      };
    }
    
    return { success: false, error: data.error || 'Ошибка создания заявки' };
  } catch (error) {
    return { success: false, error: 'Ошибка сети при создании заявки' };
  }
}

/** Получение статуса заявки */
export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatusResponse> {
  try {
    const response = await fetch('/api/bcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'orderStatus',
        originalClientOrderId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, status: data.status, filledQuantity: data.filledQuantity };
    }
    
    return { success: false, error: data.error || 'Ошибка получения статуса' };
  } catch (error) {
    return { success: false, error: 'Ошибка сети' };
  }
}

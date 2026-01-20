export interface CreateOrderRequest {
  instrumentId: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  message?: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filledQuantity?: number;
  averagePrice?: number;
}

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createOrder', ...request })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ошибка создания заявки');
  return data.data;
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'orderStatus', orderId })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ошибка получения статуса');
  return data.data;
}
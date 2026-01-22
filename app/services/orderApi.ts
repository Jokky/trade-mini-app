import { getToken } from './authStorage';

export interface CreateOrderRequest {
  ticker: string;
  classCode: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
}

export interface CreateOrderResponse {
  clientOrderId: string;
  status: string;
}

export interface OrderData {
  orderStatus: string;
  executionType?: string;
  orderQuantity: number;
  executedQuantity: number;
  remainedQuantity: number;
  ticker: string;
  classCode: string;
  side: '1' | '2';
  orderType: '1' | '2';
  averagePrice?: number;
  orderId: string;
  price?: number;
  currency?: string;
  transactionTime?: string;
}

export interface OrderStatusResponse {
  clientOrderId: string;
  originalClientOrderId: string;
  data: OrderData;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getRefreshToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
  }
  return token;
}

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const clientOrderId = generateUUID();
  const refreshToken = await getRefreshToken();

  // Валидация: для лимитных заявок цена обязательна
  if (request.type === 'limit' && (!request.price || request.price <= 0)) {
    throw new Error('Для лимитной заявки необходимо указать цену');
  }

  const body: any = {
    action: 'createOrder',
    clientOrderId,
    side: request.side === 'buy' ? '1' : '2',
    orderType: request.type === 'market' ? '1' : '2',
    orderQuantity: request.quantity,
    ticker: request.ticker,
    classCode: request.classCode,
  };

  // Для лимитных заявок цена обязательна, для рыночных - не передаем
  if (request.type === 'limit' && request.price) {
    body.price = request.price;
  }

  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createOrder',
      refreshToken,
      clientOrderId,
      side: request.side === 'buy' ? '1' : '2',
      orderType: request.type === 'market' ? '1' : '2',
      orderQuantity: request.quantity,
      ticker: request.ticker,
      classCode: request.classCode,
      price: request.price,
    }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ошибка создания заявки');
  return data.data;
}

export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatusResponse> {
  const refreshToken = await getRefreshToken();

  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'orderStatus', 
      refreshToken,
      originalClientOrderId 
    }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ошибка получения статуса');
  return data.data;
}

export async function cancelOrder(originalClientOrderId: string): Promise<CreateOrderResponse> {
  const clientOrderId = generateUUID();
  const refreshToken = await getRefreshToken();

  const response = await fetch('/api/bcs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'cancelOrder', 
      refreshToken,
      originalClientOrderId, 
      clientOrderId 
    }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ошибка отмены заявки');
  return data.data;
}

export function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    '0': 'Новая',
    '1': 'Частично исполнена',
    '2': 'Исполнена',
    '4': 'Отменена',
    '5': 'Заменена',
    '6': 'Отменяется',
    '8': 'Отклонена',
    '9': 'Заменяется',
    '10': 'Ожидает подтверждения',
  };
  return statusMap[status] || 'Неизвестный статус';
}

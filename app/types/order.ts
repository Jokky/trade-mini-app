/**
 * Order types for trading operations
 */

export type OrderDirection = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface CreateOrderRequest {
  board: string;
  symbol: string;
  direction: OrderDirection;
  quantity: number;
  orderType: OrderType;
  price?: number;
  clientOrderId: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  clientOrderId?: string;
  message?: string;
  error?: string;
}

export interface InstrumentForOrder {
  id: string;
  name: string;
  ticker: string;
  board: string;
  availableQuantity: number;
}

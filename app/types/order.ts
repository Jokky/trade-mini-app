/**
 * Order types for trading operations
 * API docs: https://trade-api.bcs.ru/http/operations/create
 */

export type OrderDirection = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface OrderRequest {
  board: string;
  symbol: string;
  direction: OrderDirection;
  quantity: number;
  orderType: OrderType;
  clientOrderId: string;
  price?: number; // Required only for limit orders
}

export interface OrderResponse {
  originalClientOrderId: string;
  transactionId?: string;
  status: OrderStatusType;
  message?: string;
}

export type OrderStatusType = 'pending' | 'filled' | 'rejected' | 'cancelled' | 'partial';

export interface OrderStatus {
  originalClientOrderId: string;
  status: OrderStatusType;
  filledQuantity?: number;
  remainingQuantity?: number;
  averagePrice?: number;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstrumentInfo {
  board: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  availableQuantity?: number;
}

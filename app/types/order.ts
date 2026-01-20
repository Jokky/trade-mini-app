/**
 * Types for order submission feature
 * Issue #15: Добавить форму подачи заявки по инструменту
 */

export type OrderDirection = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface OrderRequest {
  board: string;
  symbol: string;
  direction: OrderDirection;
  quantity: number;
  orderType: OrderType;
  price?: number; // Required only for limit orders
  clientOrderId: string; // UUID v4
}

export interface OrderResponse {
  orderId: string;
  clientOrderId: string;
  status: 'accepted' | 'rejected';
  message?: string;
}

export interface OrderStatusResponse {
  orderId: string;
  clientOrderId: string;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  filledQuantity?: number;
  remainingQuantity?: number;
  message?: string;
}

export interface Instrument {
  board: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice?: number;
}

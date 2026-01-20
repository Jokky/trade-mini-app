/**
 * Order types for trading API integration
 */

export type OrderType = 'market' | 'limit';
export type OrderDirection = 'buy' | 'sell';

export interface InstrumentInfo {
  id: string;
  name: string;
  ticker: string;
  board: string;
  availableQuantity: number;
}

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
  clientOrderId: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface OrderFormProps {
  instrument: InstrumentInfo;
  onSuccess: (response: OrderResponse) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export interface OrderResultProps {
  success: boolean;
  message: string;
  orderId?: string;
  onBackToPortfolio: () => void;
}

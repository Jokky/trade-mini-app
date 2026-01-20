/**
 * WebSocket types for BCS Trading API Portfolio
 * Documentation: https://trade-api.bcs.ru/websocket/portfolio
 */

export type WebSocketConnectionState = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error';

export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioData {
  totalValue: number;
  cash: number;
  positions: PortfolioPosition[];
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'portfolio' | 'heartbeat' | 'error' | 'subscribed';
  payload?: PortfolioData | string;
}

export interface PortfolioWebSocketConfig {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

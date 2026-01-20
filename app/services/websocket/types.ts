/**
 * WebSocket Portfolio Types for BCS Trading API
 * Reference: https://trade-api.bcs.ru/websocket/portfolio
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

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
  updatedAt: string;
}

export interface WebSocketMessage {
  type: 'portfolio' | 'heartbeat' | 'error' | 'auth';
  payload?: PortfolioData | string;
}

export interface PortfolioWebSocketConfig {
  url: string;
  token: string;
  onData: (data: PortfolioData) => void;
  onStateChange: (state: ConnectionState) => void;
  onError: (error: string) => void;
  maxReconnectAttempts?: number;
  httpFallback?: () => Promise<PortfolioData>;
}

/**
 * WebSocket Portfolio Types for BCS Trading API
 * Documentation: https://trade-api.bcs.ru/websocket/portfolio
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
}

export interface PortfolioData {
  totalValue: number;
  availableCash: number;
  positions: PortfolioPosition[];
  updatedAt: string;
}

export interface WebSocketMessage {
  type: 'portfolio' | 'heartbeat' | 'error' | 'subscribed';
  payload?: PortfolioData | string;
  timestamp?: number;
}

export interface WebSocketConfig {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectBaseDelay?: number;
  heartbeatInterval?: number;
}

export interface IPortfolioWebSocketService {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(callback: (data: PortfolioData) => void): () => void;
  getState(): ConnectionState;
  onStateChange(callback: (state: ConnectionState) => void): () => void;
}

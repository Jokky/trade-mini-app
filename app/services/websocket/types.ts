/**
 * WebSocket types for BCS Trading API Portfolio
 * Documentation: https://trade-api.bcs.ru/websocket/portfolio
 */

export type WebSocketConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/**
 * Portfolio position from BCS WebSocket API
 * This is the actual format returned by wss://ws.broker.ru/trade-api-bff-portfolio/api/v1/portfolio/ws
 */
export interface BCSPortfolioPosition {
  type: 'moneyLimit' | 'depoLimit' | 'futuresLimit' | 'futuresHolding' | 'otcLimit';
  account: string;
  exchange: string;
  ticker: string;
  displayName: string;
  baseAssetTicker: string;
  currency: string;
  upperType: string;
  instrumentType: string;
  term: 'T0' | 'T1' | 'T2' | 'T365';
  quantity: number;
  locked: number;
  balancePrice: number;
  currentPrice: number;
  balanceValue: number;
  balanceValueRub: number;
  balanceValueUsd: number;
  balanceValueEur: number;
  currentValue: number;
  currentValueRub: number;
  currentValueUsd: number;
  currentValueEur: number;
  unrealizedPL: number;
  unrealizedPercentPL: number;
  dailyPL: number;
  dailyPercentPL: number;
  portfolioShare: number;
  scale: number;
  minimumStep: number;
  board: string;
  priceUnit: string;
  faceValue: number;
  accruedIncome: number;
  isBlocked: boolean;
  isBlockedTradeAccount: boolean;
  lockedForFutures: number;
  ratioQuantity: number;
  expireDate: string;
}

export interface PortfolioWebSocketConfig {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

/**
 * БКС Trade API Types
 * Документация: https://trade-api.bcs.ru/http/portfolio
 */

export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BcsAuthConfig {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
}

export interface BcsPosition {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  value: number;
}

export interface BcsPortfolio {
  accountId: string;
  positions: BcsPosition[];
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  updatedAt: string;
}

export interface BcsApiError {
  code: number;
  message: string;
  isRateLimited: boolean;
  retryAfter?: number;
}

export type BcsAuthState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; tokens: BcsTokens }
  | { status: 'error'; error: string };
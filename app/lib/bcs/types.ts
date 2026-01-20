/**
 * БКС Trade API Types
 * Документация: https://trade-api.bcs.ru
 */

export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BcsPosition {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercent: number;
  currency: string;
}

export interface BcsPortfolio {
  accountId: string;
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  positions: BcsPosition[];
  updatedAt: string;
  currency: string;
}

export interface BcsAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface BcsApiError {
  code: string;
  message: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
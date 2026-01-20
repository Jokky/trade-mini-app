/**
 * BCS Trade API Types
 * Documentation: https://trade-api.bcs.ru
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BCSAccount {
  id: string;
  name: string;
  type: 'broker' | 'iis';
  currency: string;
}

export interface BCSPosition {
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  assetType: 'stock' | 'bond' | 'currency' | 'derivative';
}

export interface BCSBalance {
  currency: string;
  amount: number;
  blocked: number;
  available: number;
}

export interface BCSPortfolio {
  accountId: string;
  positions: BCSPosition[];
  balances: BCSBalance[];
  totalValue: number;
  totalPnl: number;
  updatedAt: Date;
}

export interface BCSAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
}

export interface BCSApiError {
  code: number;
  message: string;
  retryAfter?: number;
}

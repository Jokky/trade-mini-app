/**
 * BCS Trade API Types
 * Documentation: https://trade-api.bcs.ru
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BCSPosition {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  currency: string;
}

export interface BCSPortfolio {
  accountId: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  currency: string;
  positions: BCSPosition[];
  updatedAt: Date;
}

export interface BCSAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
}

export interface BCSApiError {
  code: number;
  message: string;
  retryAfter?: number;
}

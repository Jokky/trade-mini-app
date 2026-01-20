/**
 * БКС Trade API Types
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BCSAccount {
  accountId: string;
  name: string;
  type: 'broker' | 'iis';
}

export interface BCSPosition {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
}

export interface BCSPortfolio {
  accountId: string;
  positions: BCSPosition[];
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  updatedAt: Date;
}

export interface BCSAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface BCSApiError {
  code: string;
  message: string;
  status: number;
}

export type BCSApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BCSApiError };

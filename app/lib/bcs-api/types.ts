/**
 * BCS Trade API Types
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

export interface BCSAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BCSPortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
}

export interface BCSPortfolio {
  accountId: string;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positions: BCSPortfolioPosition[];
  currency: string;
  updatedAt: Date;
}

export interface BCSApiError {
  code: string;
  message: string;
  details?: string;
}

export interface BCSApiConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

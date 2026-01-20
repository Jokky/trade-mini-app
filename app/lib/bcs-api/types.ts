// BCS API Type Definitions
// Based on documentation: https://trade-api.bcs.ru/http/

export interface BCSAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface BCSPortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface BCSPortfolioResponse {
  accountId: string;
  totalValue: number;
  availableCash: number;
  blockedCash: number;
  positions: BCSPortfolioPosition[];
  lastUpdated: string;
}

export interface BCSApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface BCSClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  authUrl?: string;
  portfolioUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  cacheTtl?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

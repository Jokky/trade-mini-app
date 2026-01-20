// BCS API Type Definitions

export interface BCSTokenResponse {
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
  currency: string;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface BCSPortfolioResponse {
  accountId: string;
  totalValue: number;
  cashBalance: number;
  currency: string;
  positions: BCSPortfolioPosition[];
  lastUpdated: string;
}

export interface BCSApiError {
  error: string;
  error_description?: string;
  retry_after?: number;
}

export interface BCSApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface BCSClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  authUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

// TODO: Add runtime validation with Zod for API responses
// import { z } from 'zod';
// export const portfolioResponseSchema = z.object({ ... });
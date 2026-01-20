// BCS API Type Definitions

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
  cashBalance: number;
  positions: BCSPortfolioPosition[];
}

export interface BCSApiError {
  error: string;
  error_description?: string;
}

export interface BCSClientConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  authUrl?: string;
  portfolioUrl?: string;
}

export interface BCSApiResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

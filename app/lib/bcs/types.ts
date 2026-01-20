/**
 * БКС Trade API Types
 * Типы для интеграции с БКС Брокер Trade API
 */

// Auth configuration
export interface BcsAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

// Token response from OAuth
export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Portfolio position
export interface BcsPosition {
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

// Full portfolio data
export interface BcsPortfolio {
  accountId: string;
  positions: BcsPosition[];
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  currency: string;
  updatedAt: string;
}

// API error response
export interface BcsApiError {
  code: string;
  message: string;
  status: number;
}

// Session stored on server
export interface BcsSession {
  userId: string;
  tokens: BcsTokens;
  expiresAt: number;
}

/**
 * БКС Trade API Types
 * Типы для интеграции с БКС Брокер Trade API
 */

export interface BcsAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
}

export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp когда токен истекает
  tokenType: string;
}

export interface BcsPosition {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export interface BcsPortfolio {
  positions: BcsPosition[];
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  currency: string;
  updatedAt: string;
}

export interface BcsApiError {
  code: string;
  message: string;
  status: number;
}

// API Response types from БКС
export interface BcsRawPosition {
  symbol: string;
  name?: string;
  qty: number;
  avg_price: number;
  last_price: number;
}

export interface BcsRawPortfolioResponse {
  positions: BcsRawPosition[];
  currency?: string;
}
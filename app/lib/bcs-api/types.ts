/**
 * BCS Trade API Types
 * Documentation: https://trade-api.bcs.ru/http/authorization
 * Portfolio: https://trade-api.bcs.ru/http/portfolio
 */

// OAuth2 Token Response
export interface BCSTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds until expiration
  scope?: string;
}

// Stored token with metadata
export interface BCSStoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
}

// Portfolio Position
export interface BCSPosition {
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  currentValue: number;
  pnl: number; // profit and loss
  pnlPercent: number;
  currency: string;
}

// Portfolio Summary
export interface BCSPortfolio {
  accountId: string;
  positions: BCSPosition[];
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  currency: string;
  updatedAt: number;
}

// API Error Response
export interface BCSApiError {
  code: number;
  message: string;
  details?: string;
}

// API Configuration
export interface BCSApiConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  authUrl: string;
}

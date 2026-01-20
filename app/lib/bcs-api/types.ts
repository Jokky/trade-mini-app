// Type definitions for BCS Trade API

export interface BCS_API_CONFIG {
  clientId: string;
  clientSecret: string;
  // TODO: Add other configuration options as needed
}

export interface BCS_PORTFOLIO_ITEM {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
}

export interface BCS_PORTFOLIO_DATA {
  totalBalance: number;
  availableCash: number;
  positions: BCS_PORTFOLIO_ITEM[];
  // TODO: Add other portfolio fields from BCS API response
}

export interface BCS_PORTFOLIO_RESPONSE {
  success: boolean;
  data?: BCS_PORTFOLIO_DATA;
  error?: string;
}

export interface BCS_AUTH_RESPONSE {
  access_token: string;
  token_type: string;
  expires_in: number;
  // TODO: Add other OAuth response fields
}

// TODO: Add more type definitions for other BCS API endpoints

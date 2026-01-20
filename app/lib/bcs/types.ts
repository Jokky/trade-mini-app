/**
 * БКС Trade API Types
 * Documentation: https://trade-api.bcs.ru/http/portfolio
 */

export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currency: string;
}

export interface Portfolio {
  accountId: string;
  positions: PortfolioPosition[];
  totalValue: number;
  currency: string;
  updatedAt: string;
}

export interface BcsApiError {
  code: string;
  message: string;
}

// Calculated fields for UI
export interface PositionWithPnL extends PortfolioPosition {
  pnl: number;
  pnlPercent: number;
  marketValue: number;
}

export function calculatePnL(position: PortfolioPosition): PositionWithPnL {
  const marketValue = position.quantity * position.currentPrice;
  const costBasis = position.quantity * position.averagePrice;
  const pnl = marketValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  
  return { ...position, pnl, pnlPercent, marketValue };
}

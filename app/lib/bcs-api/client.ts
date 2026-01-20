/**
 * BCS Trade API Client
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  avgPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  accountId: string;
  positions: PortfolioPosition[];
  totalValue: number;
  totalProfitLoss: number;
  currency: string;
  updatedAt: string;
}

export interface BCSAccount {
  id: string;
  name: string;
  type: string;
}

const BCS_API_BASE = 'https://api.bcs.ru/trade/v1';

let cachedTokens: BCSTokens | null = null;
let portfolioCache: { data: Portfolio; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export async function authenticate(username: string, password: string): Promise<BCSTokens> {
  // TODO: Implement actual OAuth2 flow with BCS API
  // POST to authorization endpoint, handle response
  const response = await fetch(`${BCS_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, grant_type: 'password' }),
  });
  if (!response.ok) throw new Error('Authentication failed');
  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedTokens;
}

export async function refreshToken(): Promise<BCSTokens> {
  if (!cachedTokens?.refreshToken) throw new Error('No refresh token available');
  // TODO: Implement token refresh logic
  const response = await fetch(`${BCS_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: cachedTokens.refreshToken, grant_type: 'refresh_token' }),
  });
  if (!response.ok) throw new Error('Token refresh failed');
  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedTokens;
}

export async function getAccounts(): Promise<BCSAccount[]> {
  const tokens = await ensureValidToken();
  const response = await fetch(`${BCS_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function getPortfolio(accountId: string, forceRefresh = false): Promise<Portfolio> {
  if (!forceRefresh && portfolioCache && Date.now() - portfolioCache.timestamp < CACHE_TTL) {
    return portfolioCache.data;
  }
  const tokens = await ensureValidToken();
  const response = await fetch(`${BCS_API_BASE}/accounts/${accountId}/portfolio`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  const data = await response.json();
  portfolioCache = { data, timestamp: Date.now() };
  return data;
}

async function ensureValidToken(): Promise<BCSTokens> {
  if (!cachedTokens) throw new Error('Not authenticated');
  if (Date.now() >= cachedTokens.expiresAt - 60000) {
    return refreshToken();
  }
  return cachedTokens;
}

export function setTokens(tokens: BCSTokens): void {
  cachedTokens = tokens;
}

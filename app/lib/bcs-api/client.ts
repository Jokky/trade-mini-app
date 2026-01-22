/**
 * BCS Trade API Client
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
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

const BCS_AUTH_URL = 'https://be.broker.ru/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token';
const BCS_API_BASE = 'https://api.bcs.ru/trade/v1';

let cachedTokens: BCSTokens | null = null;
let portfolioCache: { data: Portfolio; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export type ClientId = 'trade-api-read' | 'trade-api-write';

export async function authenticate(refreshToken: string, clientId: ClientId = 'trade-api-read'): Promise<BCSTokens> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(BCS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Authentication failed');
  }

  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
  };
  return cachedTokens;
}

export async function refreshAccessToken(clientId: ClientId = 'trade-api-read'): Promise<BCSTokens> {
  if (!cachedTokens?.refreshToken) throw new Error('No refresh token available');

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: cachedTokens.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(BCS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Token refresh failed');
  }

  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
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
    return refreshAccessToken();
  }
  return cachedTokens;
}

export function setTokens(tokens: BCSTokens): void {
  cachedTokens = tokens;
}

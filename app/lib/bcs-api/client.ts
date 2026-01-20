/**
 * BCS Trade API Client
 * Documentation: https://trade-api.bcs.ru
 */

export interface BcsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export interface BcsAccount {
  id: string;
  name: string;
  type: string;
}

export interface BcsPosition {
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface BcsPortfolio {
  accountId: string;
  positions: BcsPosition[];
  totalValue: number;
  totalProfitLoss: number;
  currency: string;
  updatedAt: string;
}

const BCS_API_URL = 'https://trade-api.bcs.ru';

export class BcsApiClient {
  private cache: Map<string, { data: BcsPortfolio; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  getAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'portfolio accounts',
    });
    return `${BCS_API_URL}/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<BcsTokens> {
    const res = await fetch(`${BCS_API_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) throw new Error('Failed to exchange code');
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      userId: data.user_id || 'default',
    };
  }

  async refreshTokens(refreshToken: string, clientId: string, clientSecret: string): Promise<BcsTokens> {
    const res = await fetch(`${BCS_API_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) throw new Error('Failed to refresh token');
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      userId: data.user_id || 'default',
    };
  }

  async getAccounts(accessToken: string): Promise<BcsAccount[]> {
    const res = await fetch(`${BCS_API_URL}/api/v1/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  }

  async getPortfolio(accessToken: string, accountId: string, useCache = true): Promise<BcsPortfolio> {
    const cacheKey = `portfolio:${accountId}`;
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) return cached.data;
    }
    const res = await fetch(`${BCS_API_URL}/api/v1/accounts/${accountId}/portfolio`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    const data: BcsPortfolio = await res.json();
    this.cache.set(cacheKey, { data, expiresAt: Date.now() + this.CACHE_TTL });
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const bcsClient = new BcsApiClient();

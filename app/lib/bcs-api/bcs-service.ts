/**
 * BCS Trade API Service
 * Handles OAuth2 authorization and portfolio fetching
 */

import { BCSTokenResponse, BCSStoredToken, BCSPortfolio, BCSApiConfig, BCSApiError } from './types';

const DEFAULT_CONFIG: BCSApiConfig = {
  clientId: process.env.NEXT_PUBLIC_BCS_CLIENT_ID || '',
  clientSecret: process.env.BCS_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_BCS_REDIRECT_URI || '',
  baseUrl: 'https://api.bcs.ru/trade/v1',
  authUrl: 'https://oauth.bcs.ru',
};

const TOKEN_STORAGE_KEY = 'bcs_token';
const PORTFOLIO_CACHE_KEY = 'bcs_portfolio_cache';
const CACHE_TTL = 60000; // 1 minute

export class BCSService {
  private config: BCSApiConfig;

  constructor(config: Partial<BCSApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Generate OAuth2 authorization URL
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
      // TODO: Add required scopes from BCS documentation
    });
    return `${this.config.authUrl}/authorize?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCode(code: string): Promise<BCSStoredToken> {
    // TODO: Implement actual API call to BCS OAuth2 token endpoint
    // POST /oauth/token with grant_type=authorization_code
    const response: BCSTokenResponse = await this.fetchWithErrorHandling(
      `${this.config.authUrl}/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
        }),
      }
    );
    return this.storeToken(response);
  }

  // Refresh access token
  async refreshToken(): Promise<BCSStoredToken> {
    const stored = this.getStoredToken();
    if (!stored) throw new Error('No refresh token available');
    // TODO: Implement refresh token API call
    const response: BCSTokenResponse = await this.fetchWithErrorHandling(
      `${this.config.authUrl}/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: stored.refreshToken,
          client_id: this.config.clientId,
        }),
      }
    );
    return this.storeToken(response);
  }

  // Fetch portfolio data
  async getPortfolio(forceRefresh = false): Promise<BCSPortfolio> {
    if (!forceRefresh) {
      const cached = this.getCachedPortfolio();
      if (cached) return cached;
    }
    const token = await this.getValidToken();
    // TODO: Implement actual portfolio API call
    const data = await this.fetchWithErrorHandling(
      `${this.config.baseUrl}/portfolio`,
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );
    // TODO: Map API response to BCSPortfolio type
    const portfolio: BCSPortfolio = this.mapPortfolioResponse(data);
    this.cachePortfolio(portfolio);
    return portfolio;
  }

  // Get valid token (refresh if expired)
  private async getValidToken(): Promise<BCSStoredToken> {
    const stored = this.getStoredToken();
    if (!stored) throw new Error('Not authenticated');
    if (Date.now() >= stored.expiresAt - 60000) {
      return this.refreshToken();
    }
    return stored;
  }

  private storeToken(response: BCSTokenResponse): BCSStoredToken {
    const token: BCSStoredToken = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
    }
    return token;
  }

  private getStoredToken(): BCSStoredToken | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(TOKEN_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  private cachePortfolio(portfolio: BCSPortfolio): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify({ data: portfolio, cachedAt: Date.now() }));
  }

  private getCachedPortfolio(): BCSPortfolio | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(PORTFOLIO_CACHE_KEY);
    if (!cached) return null;
    const { data, cachedAt } = JSON.parse(cached);
    return Date.now() - cachedAt < CACHE_TTL ? data : null;
  }

  private mapPortfolioResponse(data: any): BCSPortfolio {
    // TODO: Map actual BCS API response structure
    return data as BCSPortfolio;
  }

  private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: BCSApiError = { code: response.status, message: this.getErrorMessage(response.status) };
      throw error;
    }
    return response.json();
  }

  private getErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      401: 'Требуется повторная авторизация',
      403: 'Доступ запрещен',
      429: 'Слишком много запросов, попробуйте позже',
      500: 'Ошибка сервера БКС',
    };
    return messages[status] || 'Неизвестная ошибка';
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(PORTFOLIO_CACHE_KEY);
  }
}

export const bcsService = new BCSService();

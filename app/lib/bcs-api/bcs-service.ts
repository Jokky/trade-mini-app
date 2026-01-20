/**
 * BCS Trade API Service
 * Handles authentication and portfolio data fetching
 */

import { BCSAuthTokens, BCSPortfolio, BCSApiConfig, BCSApiError } from './types';

const DEFAULT_CONFIG: BCSApiConfig = {
  baseUrl: process.env.BCS_API_URL || 'https://api.bcs.ru',
  clientId: process.env.BCS_CLIENT_ID || '',
  clientSecret: process.env.BCS_CLIENT_SECRET || '',
  redirectUri: process.env.BCS_REDIRECT_URI || '',
};

let cachedTokens: BCSAuthTokens | null = null;
let cachedPortfolio: BCSPortfolio | null = null;

export class BCSService {
  private config: BCSApiConfig;

  constructor(config: Partial<BCSApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Get OAuth authorization URL for user login */
  getAuthorizationUrl(): string {
    // TODO: Implement according to https://trade-api.bcs.ru/http/authorization
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'portfolio',
    });
    return `${this.config.baseUrl}/oauth/authorize?${params}`;
  }

  /** Exchange authorization code for tokens */
  async exchangeCodeForTokens(code: string): Promise<BCSAuthTokens> {
    // TODO: Implement token exchange
    // POST to /oauth/token with code, client_id, client_secret
    throw new Error('Not implemented: exchangeCodeForTokens');
  }

  /** Refresh access token using refresh token */
  async refreshTokens(refreshToken: string): Promise<BCSAuthTokens> {
    // TODO: Implement token refresh logic
    throw new Error('Not implemented: refreshTokens');
  }

  /** Check if tokens need refresh and refresh if needed */
  async ensureValidTokens(): Promise<BCSAuthTokens> {
    if (!cachedTokens) throw new Error('Not authenticated');
    if (Date.now() >= cachedTokens.expiresAt - 60000) {
      cachedTokens = await this.refreshTokens(cachedTokens.refreshToken);
    }
    return cachedTokens;
  }

  /** Fetch portfolio data from BCS API */
  async getPortfolio(accountId: string): Promise<BCSPortfolio> {
    // TODO: Implement according to https://trade-api.bcs.ru/http/portfolio
    const tokens = await this.ensureValidTokens();
    
    // Mock implementation - replace with actual API call
    const response = await fetch(`${this.config.baseUrl}/api/v1/portfolio/${accountId}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    
    if (!response.ok) {
      const error: BCSApiError = { code: 'API_ERROR', message: response.statusText };
      throw error;
    }
    
    cachedPortfolio = await response.json();
    return cachedPortfolio!;
  }

  /** Get cached portfolio if available */
  getCachedPortfolio(): BCSPortfolio | null {
    return cachedPortfolio;
  }

  /** Set tokens (call after OAuth callback) */
  setTokens(tokens: BCSAuthTokens): void {
    cachedTokens = tokens;
  }
}

export const bcsService = new BCSService();

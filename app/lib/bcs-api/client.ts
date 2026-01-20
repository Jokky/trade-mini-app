/**
 * БКС Trade API Client
 * Handles authentication and portfolio fetching
 */

import { BCSTokens, BCSAccount, BCSPortfolio, BCSApiResult, BCSAuthConfig } from './types';

const BCS_API_BASE = 'https://api.bcs.ru/trade/v1'; // TODO: Verify actual endpoint

export class BCSApiClient {
  private tokens: BCSTokens | null = null;
  private config: BCSAuthConfig;

  constructor(config: BCSAuthConfig) {
    this.config = config;
  }

  // TODO: Implement full OAuth2 flow per https://trade-api.bcs.ru/http/authorization
  async authenticate(authCode: string): Promise<BCSApiResult<BCSTokens>> {
    try {
      // TODO: Exchange auth code for tokens
      // POST to token endpoint with client credentials
      throw new Error('Not implemented - see BCS API docs for OAuth2 flow');
    } catch (error) {
      return { success: false, error: { code: 'AUTH_ERROR', message: String(error), status: 401 } };
    }
  }

  async refreshTokens(): Promise<BCSApiResult<BCSTokens>> {
    // TODO: Implement token refresh using refresh_token
    throw new Error('Not implemented');
  }

  async getAccounts(): Promise<BCSApiResult<BCSAccount[]>> {
    // TODO: Fetch user accounts from BCS API
    // GET /accounts or similar endpoint
    throw new Error('Not implemented');
  }

  async getPortfolio(accountId: string): Promise<BCSApiResult<BCSPortfolio>> {
    // TODO: Fetch portfolio per https://trade-api.bcs.ru/http/portfolio
    // Should include positions, balances, P&L calculations
    throw new Error('Not implemented');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // TODO: Add auth headers, handle token refresh on 401
    const response = await fetch(`${BCS_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.tokens?.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  setTokens(tokens: BCSTokens): void {
    this.tokens = tokens;
  }

  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expiresAt > Date.now();
  }
}

// Singleton instance - use env vars for config
export const bcsClient = new BCSApiClient({
  clientId: process.env.BCS_CLIENT_ID || '',
  clientSecret: process.env.BCS_CLIENT_SECRET || '',
  redirectUri: process.env.BCS_REDIRECT_URI || '',
});

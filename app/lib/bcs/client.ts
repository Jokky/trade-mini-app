/**
 * BCS Trade API Client
 * Docs: https://trade-api.bcs.ru/http/authorization
 */

import { BCSTokens, BCSPortfolio, BCSAuthConfig, BCSApiError } from './types';

const DEFAULT_BASE_URL = 'https://api.bcs.ru';

export class BCSClient {
  private config: BCSAuthConfig;
  private tokens: BCSTokens | null = null;

  constructor(config?: Partial<BCSAuthConfig>) {
    this.config = {
      clientId: process.env.BCS_CLIENT_ID || '',
      clientSecret: process.env.BCS_CLIENT_SECRET || '',
      redirectUri: process.env.BCS_REDIRECT_URI || '',
      baseUrl: process.env.BCS_API_URL || DEFAULT_BASE_URL,
      ...config,
    };
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'portfolio',
    });
    return `${this.config.baseUrl}/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<BCSTokens> {
    // TODO: Implement actual OAuth2 token exchange
    // POST /oauth/token with code, client_id, client_secret, grant_type=authorization_code
    throw new Error('Not implemented: exchangeCode');
  }

  async refreshTokens(): Promise<BCSTokens> {
    // TODO: Implement token refresh using refresh_token
    // POST /oauth/token with refresh_token, client_id, grant_type=refresh_token
    throw new Error('Not implemented: refreshTokens');
  }

  async getPortfolio(accountId: string): Promise<BCSPortfolio> {
    // TODO: Implement GET /api/v1/portfolio/{accountId}
    // Handle 401 -> refresh token, 429 -> respect retryAfter
    throw new Error('Not implemented: getPortfolio');
  }

  setTokens(tokens: BCSTokens): void {
    this.tokens = tokens;
  }

  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.expiresAt > Date.now();
  }

  private async handleApiError(response: Response): Promise<BCSApiError> {
    const error: BCSApiError = { code: response.status, message: response.statusText };
    if (response.status === 429) {
      error.retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    }
    return error;
  }
}

export const bcsClient = new BCSClient();

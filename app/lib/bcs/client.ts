/**
 * БКС Trade API Client
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

import { BcsTokens, Portfolio, BcsApiError } from './types';

const BCS_API_BASE = process.env.NEXT_PUBLIC_BCS_API_URL || 'https://api.bcs.ru';
const BCS_CLIENT_ID = process.env.BCS_CLIENT_ID || '';

export class BcsApiClient {
  private tokens: BcsTokens | null = null;

  async authorize(authCode: string): Promise<BcsTokens> {
    // TODO: Implement OAuth2 authorization code exchange
    // POST /oauth/token with grant_type=authorization_code
    const response = await fetch(`${BCS_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: BCS_CLIENT_ID,
      }),
    });
    
    if (!response.ok) {
      throw await this.handleError(response);
    }
    
    const data = await response.json();
    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return this.tokens;
  }

  async getPortfolio(accountId: string): Promise<Portfolio> {
    await this.ensureValidToken();
    
    const response = await fetch(`${BCS_API_BASE}/api/v1/portfolio?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${this.tokens?.accessToken}` },
    });
    
    if (!response.ok) {
      throw await this.handleError(response);
    }
    
    // TODO: Map BCS API response to Portfolio interface
    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokens || Date.now() >= this.tokens.expiresAt - 60000) {
      // TODO: Implement token refresh logic
      throw new Error('Token expired. Please re-authorize.');
    }
  }

  private async handleError(response: Response): Promise<BcsApiError> {
    const error = await response.json().catch(() => ({}));
    return { code: String(response.status), message: error.message || 'API Error' };
  }

  setTokens(tokens: BcsTokens): void {
    this.tokens = tokens;
  }
}

export const bcsClient = new BcsApiClient();

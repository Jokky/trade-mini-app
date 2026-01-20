/**
 * BCS Trade API Client
 * Handles OAuth2 authorization and portfolio data fetching
 */

import { BCSTokens, BCSAccount, BCSPortfolio, BCSAuthConfig, BCSApiError } from './types';

const DEFAULT_CONFIG: BCSAuthConfig = {
  clientId: process.env.BCS_CLIENT_ID || '',
  clientSecret: process.env.BCS_CLIENT_SECRET || '',
  redirectUri: process.env.BCS_REDIRECT_URI || '',
  authUrl: 'https://trade-api.bcs.ru/oauth/authorize',
  tokenUrl: 'https://trade-api.bcs.ru/oauth/token',
  apiBaseUrl: 'https://trade-api.bcs.ru/api/v1',
};

export class BCSClient {
  private config: BCSAuthConfig;
  private tokens: BCSTokens | null = null;

  constructor(config: Partial<BCSAuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Generate OAuth2 authorization URL with PKCE */
  getAuthorizationUrl(state: string, codeVerifier: string): string {
    // TODO: Implement PKCE code_challenge generation from codeVerifier
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
      // code_challenge: generateCodeChallenge(codeVerifier),
      // code_challenge_method: 'S256',
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  /** Exchange authorization code for tokens */
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<BCSTokens> {
    // TODO: Implement actual token exchange with BCS API
    // POST to tokenUrl with code, code_verifier, grant_type=authorization_code
    throw new Error('Not implemented: exchangeCodeForTokens');
  }

  /** Refresh access token using refresh token */
  async refreshAccessToken(): Promise<BCSTokens> {
    // TODO: Implement token refresh logic
    // POST to tokenUrl with refresh_token, grant_type=refresh_token
    throw new Error('Not implemented: refreshAccessToken');
  }

  /** Get user's brokerage accounts */
  async getAccounts(): Promise<BCSAccount[]> {
    // TODO: GET /accounts - fetch and map to BCSAccount[]
    return [];
  }

  /** Get portfolio for specific account */
  async getPortfolio(accountId: string): Promise<BCSPortfolio> {
    // TODO: GET /portfolio/{accountId} - fetch positions and balances
    return {
      accountId,
      positions: [],
      balances: [],
      totalValue: 0,
      totalPnl: 0,
      updatedAt: new Date(),
    };
  }

  /** Handle API errors with proper typing */
  private handleApiError(status: number, body: unknown): BCSApiError {
    // TODO: Parse error responses, handle 401/429/500 specifically
    return { code: status, message: 'API Error' };
  }

  setTokens(tokens: BCSTokens): void {
    this.tokens = tokens;
  }
}

export const bcsClient = new BCSClient();

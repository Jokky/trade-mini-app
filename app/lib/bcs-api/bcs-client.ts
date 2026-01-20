import {
  BCSAuthResponse,
  BCSPortfolioResponse,
  BCSApiError,
  BCSClientConfig,
  BCSApiResult
} from './types';

const DEFAULT_CONFIG = {
  baseUrl: 'https://trade-api.bcs.ru',
  authUrl: '/oauth2/token',
  portfolioUrl: '/http/portfolio'
} as const;

export class BCSClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private config: BCSClientConfig & typeof DEFAULT_CONFIG;

  constructor(config: BCSClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('BCS API credentials are missing');
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.authUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (!response.ok) {
        const error: BCSApiError = await response.json();
        throw new Error(`Authentication failed: ${error.error_description || error.error}`);
      }

      const authData: BCSAuthResponse = await response.json();
      this.accessToken = authData.access_token;
      this.tokenExpiry = Date.now() + (authData.expires_in * 1000);
    } catch (error) {
      console.error('BCS authentication error:', error);
      throw new Error('Failed to authenticate with BCS API');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate();
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, retry with fresh authentication
      await this.authenticate();
      return this.makeRequest(endpoint);
    }

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const error: BCSApiError = await response.json();
        errorMessage = error.error_description || error.error || errorMessage;
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getPortfolio(): Promise<BCSApiResult<BCSPortfolioResponse>> {
    try {
      const portfolioData = await this.makeRequest<BCSPortfolioResponse>(this.config.portfolioUrl);
      return {
        data: portfolioData,
        success: true
      };
    } catch (error) {
      console.error('BCS portfolio fetch error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
        success: false
      };
    }
  }
}

export function createBCSClient(): BCSClient {
  const clientId = process.env.BCS_CLIENT_ID;
  const clientSecret = process.env.BCS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('BCS_CLIENT_ID and BCS_CLIENT_SECRET environment variables are required');
  }

  return new BCSClient({ clientId, clientSecret });
}

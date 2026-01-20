import { BCSTokenResponse, BCSPortfolioResponse, BCSApiResponse, BCSClientConfig } from './types';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_URL = 'https://trade-api.bcs.ru/http';
const DEFAULT_AUTH_URL = 'https://trade-api.bcs.ru/oauth/token';

export class BCSClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private config: BCSClientConfig;
  private portfolioCache: { data: BCSPortfolioResponse; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(config: BCSClientConfig) {
    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      authUrl: DEFAULT_AUTH_URL,
      timeout: DEFAULT_TIMEOUT,
      maxRetries: DEFAULT_MAX_RETRIES,
      ...config
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('BCS API client ID and secret are required');
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(this.config.authUrl!, {
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
        const error = await response.json().catch(() => ({}));
        throw new Error(`Authentication failed: ${error.error_description || response.statusText}`);
      }

      const tokenData: BCSTokenResponse = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
    } catch (error) {
      throw new Error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const maxRetries = this.config.maxRetries!;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if token is expired or missing
        if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
          await this.authenticate();
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401 && attempt < maxRetries) {
          // Clear token and retry authentication on next attempt
          this.accessToken = null;
          this.tokenExpiry = null;
          continue;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
          // Exponential backoff for server errors
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${errorData.error || response.statusText} (${response.status})`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on network errors after max attempts
        if (attempt === maxRetries || error instanceof TypeError) {
          break;
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  async getPortfolio(accountId?: string): Promise<BCSApiResponse<BCSPortfolioResponse>> {
    try {
      // Check cache first
      if (this.portfolioCache && Date.now() - this.portfolioCache.timestamp < this.CACHE_TTL) {
        return { success: true, data: this.portfolioCache.data };
      }

      const endpoint = accountId ? `/portfolio?accountId=${accountId}` : '/portfolio';
      const portfolioData = await this.makeRequest<BCSPortfolioResponse>(endpoint);
      
      // Update cache
      this.portfolioCache = {
        data: portfolioData,
        timestamp: Date.now()
      };

      return { success: true, data: portfolioData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
        statusCode: error instanceof Error && 'status' in error ? (error as any).status : undefined
      };
    }
  }

  // TODO: Implement other API endpoints as needed
  // async getOrders(): Promise<BCSApiResponse<any>> { ... }
  // async getInstruments(): Promise<BCSApiResponse<any>> { ... }
}

export function createBCSClient(): BCSClient {
  const clientId = process.env.BCS_CLIENT_ID;
  const clientSecret = process.env.BCS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('BCS_CLIENT_ID and BCS_CLIENT_SECRET environment variables are required');
  }

  return new BCSClient({
    clientId,
    clientSecret,
  });
}
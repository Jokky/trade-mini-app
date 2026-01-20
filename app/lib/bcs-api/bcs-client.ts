import {
  BCSAuthResponse,
  BCSPortfolioResponse,
  BCSApiResponse,
  BCSClientConfig,
  CacheEntry
} from './types';

const DEFAULT_CONFIG = {
  baseUrl: 'https://trade-api.bcs.ru/http',
  authUrl: 'https://trade-api.bcs.ru/oauth2/token',
  portfolioUrl: 'https://trade-api.bcs.ru/http/portfolio',
  maxRetries: 3,
  retryDelay: 1000,
  cacheTtl: 30000 // 30 seconds
};

export class BCSClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private portfolioCache: Map<string, CacheEntry<BCSPortfolioResponse>> = new Map();
  private config: Required<BCSClientConfig>;
  private isAuthenticating = false;

  constructor(config: BCSClientConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('BCS_CLIENT_ID and BCS_CLIENT_SECRET must be provided');
    }
    
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * Authenticate with BCS API using OAuth 2.0 client credentials
   */
  private async authenticate(): Promise<void> {
    if (this.isAuthenticating) {
      // TODO: Implement proper queue for concurrent auth requests
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    this.isAuthenticating = true;
    
    try {
      const response = await fetch(this.config.authUrl, {
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
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data: BCSAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Check if token is valid and refresh if needed
   */
  private async ensureToken(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate();
    }
  }

  /**
   * Make request to BCS API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit,
    accountId?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let authRetryCount = 0;
    const maxAuthRetries = 1;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.ensureToken();

        const response = await fetch(endpoint, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (response.status === 401) {
          // Clear token and retry authentication
          this.accessToken = null;
          this.tokenExpiry = null;
          
          if (authRetryCount < maxAuthRetries) {
            authRetryCount++;
            // Don't increment attempt counter for auth retries
            attempt--;
            continue;
          }
          throw new Error('Authentication failed after retry');
        }

        if (response.status === 429) {
          // TODO: Implement rate limiting with Retry-After header
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Retry on network errors or 5xx status
        if (attempt < this.config.maxRetries && 
            (error instanceof TypeError || // Network error
             (error instanceof Error && error.message.includes('500')) ||
             (error instanceof Error && error.message.includes('502')) ||
             (error instanceof Error && error.message.includes('503')) ||
             (error instanceof Error && error.message.includes('504')))) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        break;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Get portfolio data for a specific account
   */
  async getPortfolio(accountId?: string): Promise<BCSApiResponse<BCSPortfolioResponse>> {
    const cacheKey = accountId || 'default';
    const cached = this.portfolioCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTtl) {
      return { data: cached.data, success: true };
    }

    try {
      // TODO: Implement proper query parameters for account filtering
      const url = accountId 
        ? `${this.config.portfolioUrl}?accountId=${encodeURIComponent(accountId)}`
        : this.config.portfolioUrl;
      
      const data = await this.makeRequest<BCSPortfolioResponse>(url, {
        method: 'GET',
      }, accountId);
      
      this.portfolioCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return { data, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch portfolio data';
      
      return { 
        error: errorMessage, 
        success: false 
      };
    }
  }

  /**
   * Clear cached portfolio data
   */
  clearCache(accountId?: string): void {
    if (accountId) {
      this.portfolioCache.delete(accountId);
    } else {
      this.portfolioCache.clear();
    }
  }
}

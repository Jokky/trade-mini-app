/**
 * БКС Trade API Client
 * Реализует OAuth2 авторизацию и получение портфеля
 */
import { BcsTokens, BcsPortfolio, BcsAuthConfig, BcsPosition } from './types';

const BCS_API_BASE = 'https://api.bcs.ru';
const BCS_AUTH_URL = 'https://oauth.bcs.ru/authorize';
const BCS_TOKEN_URL = 'https://oauth.bcs.ru/token';
const STORAGE_KEY = 'bcs_tokens';
const CACHE_KEY = 'bcs_portfolio_cache';

export class BcsClient {
  private config: BcsAuthConfig;

  constructor(config: BcsAuthConfig) {
    this.config = config;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      state,
    });
    return `${BCS_AUTH_URL}?${params}`;
  }

  async exchangeCode(code: string): Promise<BcsTokens> {
    const res = await fetch(BCS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
      }),
    });
    if (!res.ok) throw new Error('Token exchange failed');
    const data = await res.json();
    const tokens: BcsTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    this.saveTokens(tokens);
    return tokens;
  }

  async refreshTokens(): Promise<BcsTokens> {
    const current = this.getTokens();
    if (!current) throw new Error('No tokens to refresh');
    const res = await fetch(BCS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
        client_id: this.config.clientId,
      }),
    });
    if (!res.ok) { this.clearTokens(); throw new Error('Token refresh failed'); }
    const data = await res.json();
    const tokens: BcsTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || current.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    this.saveTokens(tokens);
    return tokens;
  }

  async getPortfolio(accountId: string): Promise<BcsPortfolio> {
    const tokens = await this.ensureValidTokens();
    const res = await fetch(`${BCS_API_BASE}/api/v1/portfolio?accountId=${accountId}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    const data = await res.json();
    const portfolio = this.mapPortfolio(data, accountId);
    this.cachePortfolio(portfolio);
    return portfolio;
  }

  private mapPortfolio(data: any, accountId: string): BcsPortfolio {
    const positions: BcsPosition[] = (data.positions || []).map((p: any) => ({
      ticker: p.ticker || p.symbol,
      name: p.name || p.ticker,
      quantity: p.quantity || 0,
      avgPrice: p.averagePrice || 0,
      currentPrice: p.currentPrice || 0,
      value: p.marketValue || 0,
      profit: p.unrealizedPnL || 0,
      profitPercent: p.unrealizedPnLPercent || 0,
      currency: p.currency || 'RUB',
    }));
    const totalValue = positions.reduce((s, p) => s + p.value, 0);
    const totalProfit = positions.reduce((s, p) => s + p.profit, 0);
    return { accountId, totalValue, totalProfit, totalProfitPercent: totalValue ? (totalProfit / totalValue) * 100 : 0, positions, updatedAt: new Date().toISOString(), currency: 'RUB' };
  }

  private async ensureValidTokens(): Promise<BcsTokens> {
    let tokens = this.getTokens();
    if (!tokens) throw new Error('Not authenticated');
    if (tokens.expiresAt < Date.now() + 60000) tokens = await this.refreshTokens();
    return tokens;
  }

  isAuthenticated(): boolean { return !!this.getTokens(); }
  getTokens(): BcsTokens | null { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
  private saveTokens(t: BcsTokens) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }
  clearTokens() { localStorage.removeItem(STORAGE_KEY); }
  getCachedPortfolio(): BcsPortfolio | null { try { const s = localStorage.getItem(CACHE_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
  private cachePortfolio(p: BcsPortfolio) { localStorage.setItem(CACHE_KEY, JSON.stringify(p)); }
}
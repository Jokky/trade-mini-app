import { NextRequest, NextResponse } from 'next/server';
import { BcsTokens, BcsPortfolio, BcsPosition } from '@/app/lib/bcs/types';

const BCS_TOKEN_URL = 'https://oauth.bcs.ru/token';
const BCS_API_BASE = 'https://api.bcs.ru/api/v1';

const getConfig = () => ({
  clientId: process.env.BCS_CLIENT_ID || '',
  clientSecret: process.env.BCS_CLIENT_SECRET || '',
  redirectUri: process.env.BCS_REDIRECT_URI || '',
});

// Token storage (use Redis/DB in production)
const tokenStore = new Map<string, { tokens: BcsTokens; expiresAt: number }>();

async function exchangeCodeForTokens(code: string): Promise<BcsTokens> {
  const config = getConfig();
  const response = await fetch(BCS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
  const data = await response.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, tokenType: data.token_type };
}

async function refreshAccessToken(refreshToken: string): Promise<BcsTokens> {
  const config = getConfig();
  const response = await fetch(BCS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: config.clientId, client_secret: config.clientSecret }),
  });
  if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);
  const data = await response.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, tokenType: data.token_type };
}

async function fetchPortfolioWithRetry(userId: string): Promise<BcsPortfolio> {
  const stored = tokenStore.get(userId);
  if (!stored) throw new Error('Not authenticated');
  
  let { tokens } = stored;
  if (Date.now() > stored.expiresAt - 60000) {
    tokens = await refreshAccessToken(tokens.refreshToken);
    tokenStore.set(userId, { tokens, expiresAt: Date.now() + tokens.expiresIn * 1000 });
  }

  const response = await fetch(`${BCS_API_BASE}/portfolio`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  if (response.status === 401) {
    tokens = await refreshAccessToken(tokens.refreshToken);
    tokenStore.set(userId, { tokens, expiresAt: Date.now() + tokens.expiresIn * 1000 });
    const retry = await fetch(`${BCS_API_BASE}/portfolio`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
    if (!retry.ok) throw new Error(`Portfolio fetch failed: ${retry.status}`);
    return mapPortfolio(await retry.json());
  }
  if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
  if (!response.ok) throw new Error(`Portfolio fetch failed: ${response.status}`);
  return mapPortfolio(await response.json());
}

function mapPortfolio(data: any): BcsPortfolio {
  const positions: BcsPosition[] = (data.positions || []).map((p: any) => {
    const value = p.quantity * p.currentPrice;
    const cost = p.quantity * p.avgPrice;
    const pnl = value - cost;
    return { ticker: p.ticker, name: p.name, quantity: p.quantity, avgPrice: p.avgPrice, currentPrice: p.currentPrice, value, pnl, pnlPercent: cost ? (pnl / cost) * 100 : 0, currency: p.currency || 'RUB' };
  });
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.avgPrice * p.quantity, 0);
  const totalPnl = totalValue - totalCost;
  return { accountId: data.accountId || '', positions, totalValue, totalCost, totalPnl, totalPnlPercent: totalCost ? (totalPnl / totalCost) * 100 : 0, currency: 'RUB', updatedAt: new Date().toISOString() };
}

export async function POST(request: NextRequest) {
  try {
    const { action, code, userId } = await request.json();
    if (action === 'auth' && code) {
      const tokens = await exchangeCodeForTokens(code);
      const id = userId || crypto.randomUUID();
      tokenStore.set(id, { tokens, expiresAt: Date.now() + tokens.expiresIn * 1000 });
      const res = NextResponse.json({ success: true, userId: id });
      res.cookies.set('bcs_session', id, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 86400 });
      return res;
    }
    if (action === 'portfolio') {
      const sessionId = request.cookies.get('bcs_session')?.value || userId;
      if (!sessionId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      const portfolio = await fetchPortfolioWithRetry(sessionId);
      return NextResponse.json(portfolio);
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

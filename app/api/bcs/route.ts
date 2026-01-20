import { NextRequest, NextResponse } from 'next/server';
import { BcsPortfolio, BcsPosition, BcsTokens, BcsRawPortfolioResponse } from '@/app/lib/bcs/types';

const BCS_TOKEN_URL = 'https://oauth.bcs.ru/token';
const BCS_API_URL = 'https://api.bcs.ru/api/v1';

function getConfig() {
  return {
    clientId: process.env.BCS_CLIENT_ID || '',
    clientSecret: process.env.BCS_CLIENT_SECRET || '',
    redirectUri: process.env.BCS_REDIRECT_URI || '',
  };
}

function mapPortfolio(raw: BcsRawPortfolioResponse): BcsPortfolio {
  let totalValue = 0, totalCost = 0;
  const positions: BcsPosition[] = raw.positions.map(p => {
    const value = p.qty * p.last_price;
    const cost = p.qty * p.avg_price;
    const pnl = value - cost;
    totalValue += value;
    totalCost += cost;
    return {
      ticker: p.symbol, name: p.name || p.symbol, quantity: p.qty,
      avgPrice: p.avg_price, currentPrice: p.last_price, value,
      pnl, pnlPercent: cost > 0 ? (pnl / cost) * 100 : 0,
    };
  });
  const totalPnl = totalValue - totalCost;
  return {
    positions, totalValue, totalCost, totalPnl,
    totalPnlPercent: totalCost > 0 ? (totalPnl / totalCost) * 100 : 0,
    currency: raw.currency || 'RUB', updatedAt: new Date().toISOString(),
  };
}

async function exchangeCode(code: string): Promise<BcsTokens> {
  const config = getConfig();
  const res = await fetch(BCS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code,
      client_id: config.clientId, client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token, refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000, tokenType: data.token_type || 'Bearer',
  };
}

async function refreshTokens(refreshToken: string): Promise<BcsTokens> {
  const config = getConfig();
  const res = await fetch(BCS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: refreshToken,
      client_id: config.clientId, client_secret: config.clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token, refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000, tokenType: data.token_type || 'Bearer',
  };
}

function setTokenCookies(res: NextResponse, tokens: BcsTokens) {
  const opts = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };
  res.cookies.set('bcs_access', tokens.accessToken, { ...opts, maxAge: 3600 });
  res.cookies.set('bcs_refresh', tokens.refreshToken, { ...opts, maxAge: 604800 });
  res.cookies.set('bcs_expires', String(tokens.expiresAt), { ...opts, maxAge: 3600 });
}

export async function GET(req: NextRequest) {
  const access = req.cookies.get('bcs_access')?.value;
  const refresh = req.cookies.get('bcs_refresh')?.value;
  if (!access) return NextResponse.json({ error: 'Not authenticated', code: 'AUTH_REQUIRED' }, { status: 401 });
  
  const fetchPortfolio = async (token: string): Promise<Response> => {
    return fetch(`${BCS_API_URL}/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
  };

  let res = await fetchPortfolio(access);
  if (res.status === 401 && refresh) {
    try {
      const newTokens = await refreshTokens(refresh);
      res = await fetchPortfolio(newTokens.accessToken);
      const response = NextResponse.json(mapPortfolio(await res.json()));
      setTokenCookies(response, newTokens);
      return response;
    } catch { return NextResponse.json({ error: 'Session expired', code: 'SESSION_EXPIRED' }, { status: 401 }); }
  }
  if (res.status === 429) return NextResponse.json({ error: 'Rate limited', code: 'RATE_LIMITED' }, { status: 429 });
  if (!res.ok) return NextResponse.json({ error: 'API error', code: 'API_ERROR' }, { status: res.status });
  return NextResponse.json(mapPortfolio(await res.json()));
}

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
  try {
    const tokens = await exchangeCode(code);
    const response = NextResponse.json({ success: true });
    setTokenCookies(response, tokens);
    return response;
  } catch (e) { return NextResponse.json({ error: 'Auth failed' }, { status: 401 }); }
}
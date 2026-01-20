import { NextRequest, NextResponse } from 'next/server';

const BCS_API_BASE = 'https://api.bcs.ru/trade/v1';
const CLIENT_ID = process.env.BCS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.BCS_CLIENT_SECRET || '';

interface TokenStore {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

const tokenStore: TokenStore = {};

async function refreshAccessToken(): Promise<string> {
  if (!tokenStore.refreshToken) throw new Error('No refresh token available');
  
  const res = await fetch(`${BCS_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenStore.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  
  if (!res.ok) throw new Error('Token refresh failed');
  const data = await res.json();
  tokenStore.accessToken = data.access_token;
  tokenStore.refreshToken = data.refresh_token;
  tokenStore.expiresAt = Date.now() + data.expires_in * 1000;
  return data.access_token;
}

async function getValidToken(): Promise<string> {
  if (tokenStore.accessToken && tokenStore.expiresAt && Date.now() < tokenStore.expiresAt - 60000) {
    return tokenStore.accessToken;
  }
  return refreshAccessToken();
}

export async function POST(req: NextRequest) {
  const { action, code, accountId } = await req.json();
  
  try {
    if (action === 'auth') {
      const res = await fetch(`${BCS_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });
      if (!res.ok) return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
      const data = await res.json();
      tokenStore.accessToken = data.access_token;
      tokenStore.refreshToken = data.refresh_token;
      tokenStore.expiresAt = Date.now() + data.expires_in * 1000;
      return NextResponse.json({ success: true });
    }
    
    if (action === 'accounts') {
      const token = await getValidToken();
      const res = await fetch(`${BCS_API_BASE}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return NextResponse.json({ error: 'Не удалось получить счета' }, { status: res.status });
      return NextResponse.json(await res.json());
    }
    
    if (action === 'portfolio') {
      const token = await getValidToken();
      const res = await fetch(`${BCS_API_BASE}/accounts/${accountId}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return NextResponse.json({ error: 'Не удалось получить портфель' }, { status: res.status });
      return NextResponse.json(await res.json());
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ошибка сервера';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

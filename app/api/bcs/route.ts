/**
 * Backend-for-Frontend proxy для БКС Trade API
 * Решает проблемы CORS и безопасного хранения client_secret
 */
import { NextRequest, NextResponse } from 'next/server';
import { BcsTokens, BcsPortfolio, BcsPosition } from '@/app/lib/bcs/types';

const BCS_API_URL = process.env.BCS_API_URL || 'https://api.bcs.ru';
const BCS_OAUTH_URL = process.env.BCS_OAUTH_URL || 'https://oauth.bcs.ru';
const CLIENT_ID = process.env.BCS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.BCS_CLIENT_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code, state, refreshToken, accessToken, savedState } = body;

    if (action === 'exchange') {
      // Проверка state для защиты от CSRF
      if (!state || !savedState || state !== savedState) {
        return NextResponse.json({ error: 'Invalid state parameter - possible CSRF attack' }, { status: 400 });
      }
      return await exchangeCodeForTokens(code);
    }

    if (action === 'refresh') {
      return await refreshAccessToken(refreshToken);
    }

    if (action === 'portfolio') {
      return await fetchPortfolio(accessToken);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function exchangeCodeForTokens(code: string): Promise<NextResponse> {
  // TODO: Implement actual БКС OAuth token exchange
  // POST to BCS_OAUTH_URL/token with client_id, client_secret, code, grant_type
  const mockTokens: BcsTokens = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresAt: Date.now() + 3600000
  };
  return NextResponse.json(mockTokens);
}

async function refreshAccessToken(refreshToken: string): Promise<NextResponse> {
  // TODO: Implement actual token refresh via БКС API
  const mockTokens: BcsTokens = {
    accessToken: 'refreshed_access_token',
    refreshToken: refreshToken,
    expiresAt: Date.now() + 3600000
  };
  return NextResponse.json(mockTokens);
}

async function fetchPortfolio(accessToken: string): Promise<NextResponse> {
  // TODO: Implement actual БКС portfolio fetch with rate limiting handling
  // Handle 429 errors with retryAfter header
  const mockPosition: BcsPosition = {
    ticker: 'SBER',
    name: 'Сбербанк',
    quantity: 100,
    avgPrice: 250,
    currentPrice: 280,
    pnl: 3000,
    pnlPercent: 12, // (pnl / (avgPrice * quantity)) * 100 = (3000 / 25000) * 100
    value: 28000
  };
  const totalCost = mockPosition.avgPrice * mockPosition.quantity;
  const mockPortfolio: BcsPortfolio = {
    accountId: 'demo-account',
    positions: [mockPosition],
    totalValue: 28000,
    totalPnl: 3000,
    totalPnlPercent: (3000 / totalCost) * 100, // Правильный расчет: прибыль / затраты
    updatedAt: new Date().toISOString()
  };
  return NextResponse.json(mockPortfolio);
}
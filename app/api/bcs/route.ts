import { NextRequest, NextResponse } from 'next/server';
import { bcsClient, BcsTokens } from '@/app/lib/bcs-api/client';
import { cookies } from 'next/headers';

const CLIENT_ID = process.env.BCS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.BCS_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.BCS_REDIRECT_URI || '';
const TOKEN_COOKIE = 'bcs_session';

function getTokensFromCookie(): BcsTokens | null {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(TOKEN_COOKIE)?.value;
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

function setTokensCookie(tokens: BcsTokens): void {
  const cookieStore = cookies();
  cookieStore.set(TOKEN_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

async function getValidTokens(): Promise<BcsTokens | null> {
  const tokens = getTokensFromCookie();
  if (!tokens) return null;
  if (tokens.expiresAt > Date.now() + 60000) return tokens;
  try {
    const newTokens = await bcsClient.refreshTokens(tokens.refreshToken, CLIENT_ID, CLIENT_SECRET);
    setTokensCookie(newTokens);
    return newTokens;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'auth-url') {
    return NextResponse.json({ url: bcsClient.getAuthUrl(CLIENT_ID, REDIRECT_URI) });
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    try {
      const tokens = await bcsClient.exchangeCode(code, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
      setTokensCookie(tokens);
      return NextResponse.json({ success: true });
    } catch (e) {
      return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
    }
  }

  if (action === 'accounts') {
    const tokens = await getValidTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const accounts = await bcsClient.getAccounts(tokens.accessToken);
      return NextResponse.json({ accounts });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
  }

  if (action === 'portfolio') {
    const accountId = searchParams.get('accountId');
    const refresh = searchParams.get('refresh') === 'true';
    if (!accountId) return NextResponse.json({ error: 'No accountId' }, { status: 400 });
    const tokens = await getValidTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      if (refresh) bcsClient.clearCache();
      const portfolio = await bcsClient.getPortfolio(tokens.accessToken, accountId, !refresh);
      return NextResponse.json({ portfolio });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
  }

  if (action === 'logout') {
    const cookieStore = cookies();
    cookieStore.delete(TOKEN_COOKIE);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

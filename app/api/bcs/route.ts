import { NextRequest, NextResponse } from 'next/server';
import * as bcsClient from '@/app/lib/bcs-api/client';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'authenticate': {
        const tokens = await bcsClient.authenticate(params.username, params.password);
        return NextResponse.json({ success: true, expiresAt: tokens.expiresAt });
      }
      case 'accounts': {
        const accounts = await bcsClient.getAccounts();
        return NextResponse.json({ success: true, accounts });
      }
      case 'portfolio': {
        const portfolio = await bcsClient.getPortfolio(params.accountId, params.forceRefresh);
        return NextResponse.json({ success: true, portfolio });
      }
      case 'refresh': {
        await bcsClient.refreshToken();
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

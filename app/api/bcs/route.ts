import { NextRequest, NextResponse } from 'next/server';
import * as bcsClient from '@/app/lib/bcs-api/client';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'authenticate': {
        const clientId = params.clientId || 'trade-api-read';
        const tokens = await bcsClient.authenticate(params.refreshToken, clientId);
        return NextResponse.json({
          success: true,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        });
      }
      case 'portfolio': {
        const portfolio = await bcsClient.getPortfolio(params.forceRefresh);
        return NextResponse.json({ success: true, data: portfolio });
      }
      case 'refresh': {
        const clientId = params.clientId || 'trade-api-read';
        await bcsClient.refreshAccessToken(clientId);
        return NextResponse.json({ success: true });
      }
      case 'createOrder': {
        const response = await bcsClient.createOrder({
          clientOrderId: params.clientOrderId,
          side: params.side,
          orderType: params.orderType,
          orderQuantity: params.orderQuantity,
          ticker: params.ticker,
          classCode: params.classCode,
          price: params.price,
        });
        return NextResponse.json({ success: true, data: response });
      }
      case 'orderStatus': {
        const response = await bcsClient.getOrderStatus(params.originalClientOrderId);
        return NextResponse.json({ success: true, data: response });
      }
      case 'cancelOrder': {
        const response = await bcsClient.cancelOrder(params.originalClientOrderId, params.clientOrderId);
        return NextResponse.json({ success: true, data: response });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('Authentication') || message.includes('invalid_grant') || message.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

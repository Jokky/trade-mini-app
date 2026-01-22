import { NextRequest, NextResponse } from 'next/server';
import * as bcsClient from '@/app/lib/bcs-api/client';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'authenticate': {
        const clientId = params.clientId || 'trade-api-write';
        const tokens = await bcsClient.authenticate(params.refreshToken, clientId);
        return NextResponse.json({
          success: true,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        });
      }
      case 'getAccessToken': {
        const clientId = params.clientId || 'trade-api-write';
        const tokens = await bcsClient.getAccessToken(clientId);
        return NextResponse.json({
          success: true,
          accessToken: tokens.accessToken,
          expiresAt: tokens.expiresAt,
        });
      }
      case 'portfolio': {
        const portfolio = await bcsClient.getPortfolio(params.forceRefresh);
        return NextResponse.json({ success: true, data: portfolio });
      }
      case 'refresh': {
        const clientId = params.clientId || 'trade-api-write';
        await bcsClient.refreshAccessToken(clientId);
        return NextResponse.json({ success: true });
      }
      case 'createOrder': {
        // Валидация: для лимитных заявок (orderType === '2') цена обязательна
        if (params.orderType === '2' && (!params.price || params.price <= 0)) {
          return NextResponse.json(
            { success: false, error: 'Для лимитной заявки необходимо указать цену' },
            { status: 400 }
          );
        }

        const orderRequest: bcsClient.CreateOrderRequest = {
          clientOrderId: params.clientOrderId,
          side: params.side,
          orderType: params.orderType,
          orderQuantity: params.orderQuantity,
          ticker: params.ticker,
          classCode: params.classCode,
        };

        // Для лимитных заявок добавляем цену, для рыночных - не передаем
        if (params.orderType === '2' && params.price) {
          orderRequest.price = params.price;
        }

        const response = await bcsClient.createOrder(orderRequest);
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

/**
 * BCS Trade API Client
 * Documentation: https://trade-api.bcs.ru/http/authorization
 */

export interface BCSTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface BCSPortfolioItem {
  type: 'moneyLimit' | 'depoLimit' | 'futuresLimit' | 'futuresHolding' | 'otcLimit';
  account: string;
  exchange: string;
  ticker: string;
  displayName: string;
  currency: string;
  upperType: 'CURRENCY' | 'RUSSIA' | 'FOREIGN' | 'OTC';
  instrumentType: string;
  term: 'T0' | 'T1' | 'T2' | 'T365';
  quantity: number;
  locked: number;
  balancePrice: number;
  currentPrice: number;
  balanceValue: number;
  balanceValueRub: number;
  currentValue: number;
  currentValueRub: number;
  unrealizedPL: number;
  unrealizedPercentPL: number;
  dailyPL: number;
  dailyPercentPL: number;
  portfolioShare: number;
  scale: number;
  minimumStep: number;
  board: string;
  priceUnit: string;
  faceValue?: number;
  accruedIncome?: number;
  logoLink?: string;
  isBlocked: boolean;
  isBlockedTradeAccount: boolean;
  ratioQuantity: number;
}

export interface CreateOrderRequest {
  clientOrderId: string;
  side: '1' | '2'; // 1 = buy, 2 = sell
  orderType: '1' | '2'; // 1 = market, 2 = limit
  orderQuantity: number;
  ticker: string;
  classCode: string;
  price?: number;
}

export interface CreateOrderResponse {
  clientOrderId: string;
  status: string;
}

export interface OrderData {
  messageType?: string;
  orderStatus: '0' | '1' | '2' | '4' | '5' | '6' | '8' | '9' | '10';
  executionType?: string;
  orderQuantity: number;
  executedQuantity: number;
  remainedQuantity: number;
  ticker: string;
  classCode: string;
  side: '1' | '2';
  orderType: '1' | '2';
  averagePrice?: number;
  orderId: string;
  price?: number;
  currency?: string;
  transactionTime?: string;
  tradeDate?: string;
  orderNumber?: string;
}

export interface OrderStatusResponse {
  clientOrderId: string;
  originalClientOrderId: string;
  data: OrderData;
}

const BCS_AUTH_URL = 'https://be.broker.ru/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token';
const BCS_PORTFOLIO_URL = 'https://be.broker.ru/trade-api-bff-portfolio/api/v1/portfolio';
const BCS_ORDERS_URL = 'https://be.broker.ru/trade-api-bff-operations/api/v1/orders';
const BCS_ORDERS_SEARCH_URL = 'https://be.broker.ru/trade-api-bff-order-details/api/v1/orders/search';

let cachedTokens: BCSTokens | null = null;
let portfolioCache: { data: BCSPortfolioItem[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export type ClientId = 'trade-api-read' | 'trade-api-write';

export async function authenticate(refreshToken: string, clientId: ClientId = 'trade-api-write'): Promise<BCSTokens> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(BCS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Authentication failed');
  }

  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
  };
  return cachedTokens;
}

export async function refreshAccessToken(clientId: ClientId = 'trade-api-write'): Promise<BCSTokens> {
  if (!cachedTokens?.refreshToken) throw new Error('No refresh token available');

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: cachedTokens.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(BCS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Token refresh failed');
  }

  const data = await response.json();
  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
  };
  return cachedTokens;
}

export async function getPortfolio(forceRefresh = false): Promise<BCSPortfolioItem[]> {
  if (!forceRefresh && portfolioCache && Date.now() - portfolioCache.timestamp < CACHE_TTL) {
    return portfolioCache.data;
  }
  const tokens = await ensureValidToken();
  const response = await fetch(BCS_PORTFOLIO_URL, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.type || 'Failed to fetch portfolio');
  }
  const data: BCSPortfolioItem[] = await response.json();
  portfolioCache = { data, timestamp: Date.now() };
  return data;
}

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  // Валидация: для лимитных заявок (orderType === '2') цена обязательна
  if (request.orderType === '2' && (!request.price || request.price <= 0)) {
    throw new Error('Для лимитной заявки необходимо указать цену');
  }

  const tokens = await ensureValidToken('trade-api-write');
  
  // Создаем объект запроса, исключая undefined поля
  const requestBody: any = {
    clientOrderId: request.clientOrderId,
    side: request.side,
    orderType: request.orderType,
    orderQuantity: request.orderQuantity,
    ticker: request.ticker,
    classCode: request.classCode,
  };

  // Для лимитных заявок добавляем цену
  if (request.orderType === '2' && request.price) {
    requestBody.price = request.price;
  }

  const response = await fetch(BCS_ORDERS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.errors?.[0]?.type || errorData.type || 'Failed to create order');
  }
  return response.json();
}

export async function getOrderStatus(originalClientOrderId: string): Promise<OrderStatusResponse> {
  const tokens = await ensureValidToken();
  const response = await fetch(`${BCS_ORDERS_URL}/${originalClientOrderId}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.type || 'Failed to get order status');
  }
  return response.json();
}

export async function cancelOrder(originalClientOrderId: string, clientOrderId: string): Promise<CreateOrderResponse> {
  const tokens = await ensureValidToken('trade-api-write');
  const response = await fetch(`${BCS_ORDERS_URL}/${originalClientOrderId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientOrderId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.type || 'Failed to cancel order');
  }
  return response.json();
}

async function ensureValidToken(clientId: ClientId = 'trade-api-write'): Promise<BCSTokens> {
  if (!cachedTokens) throw new Error('Not authenticated');
  if (Date.now() >= cachedTokens.expiresAt - 60000) {
    return refreshAccessToken(clientId);
  }
  return cachedTokens;
}

export async function getAccessToken(clientId: ClientId = 'trade-api-write'): Promise<BCSTokens> {
  return ensureValidToken(clientId);
}

export function setTokens(tokens: BCSTokens): void {
  cachedTokens = tokens;
}

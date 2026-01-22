/**
 * React hook for WebSocket portfolio subscription
 * Manages connection lifecycle with component mount/unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioWebSocketService } from '../services/websocket/portfolioWebSocket';
import { BCSPortfolioPosition, WebSocketConnectionState } from '../services/websocket/types';

const WS_URL = process.env.NEXT_PUBLIC_BCS_WS_PORTFOLIO_URL || 'wss://ws.broker.ru/trade-api-bff-portfolio/api/v1/portfolio/ws';

interface UsePortfolioWebSocketResult {
  positions: BCSPortfolioPosition[];
  connectionState: WebSocketConnectionState;
  reconnect: () => void;
}

export function usePortfolioWebSocket(token: string): UsePortfolioWebSocketResult {
  const [positions, setPositions] = useState<BCSPortfolioPosition[]>([]);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const serviceRef = useRef<PortfolioWebSocketService | null>(null);

  useEffect(() => {
    if (!token) return;

    const service = new PortfolioWebSocketService({ url: WS_URL, token });
    serviceRef.current = service;

    service.onData(setPositions);
    service.onStateChange(setConnectionState);
    service.connect();

    // Handle Telegram Mini App visibility changes
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        service.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      service.disconnect();
      serviceRef.current = null;
    };
  }, [token]);

  const reconnect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  return { positions, connectionState, reconnect };
}

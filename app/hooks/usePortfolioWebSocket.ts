/**
 * React hook for WebSocket portfolio subscription
 * Manages connection lifecycle with component mount/unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioWebSocketService } from '../services/websocket/portfolioWebSocket';
import { PortfolioData, WebSocketConnectionState } from '../services/websocket/types';

const WS_URL = process.env.NEXT_PUBLIC_BCS_WS_URL || 'wss://trade-api.bcs.ru/ws/portfolio';

interface UsePortfolioWebSocketResult {
  portfolio: PortfolioData | null;
  connectionState: WebSocketConnectionState;
  reconnect: () => void;
}

export function usePortfolioWebSocket(token: string): UsePortfolioWebSocketResult {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const serviceRef = useRef<PortfolioWebSocketService | null>(null);

  useEffect(() => {
    if (!token) return;

    const service = new PortfolioWebSocketService({ url: WS_URL, token });
    serviceRef.current = service;

    service.onData(setPortfolio);
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

  return { portfolio, connectionState, reconnect };
}

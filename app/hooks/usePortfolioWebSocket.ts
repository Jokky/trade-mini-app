import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioWebSocketService } from '../services/websocket/portfolioWebSocket';
import { ConnectionState, PortfolioData } from '../services/websocket/types';

interface UsePortfolioWebSocketResult {
  portfolio: PortfolioData | null;
  connectionState: ConnectionState;
  error: string | null;
  reconnect: () => void;
}

export function usePortfolioWebSocket(token: string): UsePortfolioWebSocketResult {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<PortfolioWebSocketService | null>(null);

  useEffect(() => {
    if (!token) return;

    // TODO: Get WebSocket URL from environment config
    const wsUrl = process.env.NEXT_PUBLIC_BCS_WS_URL || 'wss://trade-api.bcs.ru/websocket';
    
    serviceRef.current = new PortfolioWebSocketService({ url: wsUrl, token });
    
    const unsubscribeData = serviceRef.current.subscribe(setPortfolio);
    const unsubscribeState = serviceRef.current.onStateChange((state) => {
      setConnectionState(state);
      if (state === 'error') setError('Connection error occurred');
      if (state === 'connected') setError(null);
    });

    serviceRef.current.connect().catch(() => setError('Failed to connect'));

    // Handle Telegram Mini App lifecycle
    // TODO: Add Telegram WebApp event listeners for visibility changes

    return () => {
      unsubscribeData();
      unsubscribeState();
      serviceRef.current?.disconnect();
    };
  }, [token]);

  const reconnect = useCallback(() => {
    setError(null);
    serviceRef.current?.connect();
  }, []);

  return { portfolio, connectionState, error, reconnect };
}

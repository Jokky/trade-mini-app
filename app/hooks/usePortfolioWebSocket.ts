import { useEffect, useRef, useState, useCallback } from 'react';
import { PortfolioWebSocketService } from '../services/websocket/portfolioWebSocket';
import { ConnectionState, PortfolioData } from '../services/websocket/types';

const WS_URL = 'wss://trade-api.bcs.ru/websocket/portfolio';

async function fetchPortfolioHttp(token: string): Promise<PortfolioData> {
  const res = await fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('HTTP fetch failed');
  return res.json();
}

export function usePortfolioWebSocket(token: string | null) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<PortfolioWebSocketService | null>(null);

  const handleVisibilityChange = useCallback(() => {
    if (!serviceRef.current) return;
    if (document.hidden) {
      serviceRef.current.disconnect();
    } else if (token) {
      serviceRef.current.connect();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    serviceRef.current = new PortfolioWebSocketService({
      url: WS_URL,
      token,
      onData: setData,
      onStateChange: setState,
      onError: setError,
      httpFallback: () => fetchPortfolioHttp(token),
    });

    serviceRef.current.connect();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.Telegram?.WebApp?.onEvent?.('viewportChanged', handleVisibilityChange);

    return () => {
      serviceRef.current?.disconnect();
      serviceRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.Telegram?.WebApp?.offEvent?.('viewportChanged', handleVisibilityChange);
    };
  }, [token, handleVisibilityChange]);

  return { data, state, error };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        onEvent?: (event: string, callback: () => void) => void;
        offEvent?: (event: string, callback: () => void) => void;
      };
    };
  }
}

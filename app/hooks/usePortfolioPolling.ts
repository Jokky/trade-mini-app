/**
 * React hook for HTTP portfolio polling
 * Polls portfolio data every 5 seconds using HTTP requests
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BCSPortfolioItem } from '../lib/bcs-api/client';
import { getToken } from '../services/authStorage';

interface UsePortfolioPollingResult {
  positions: BCSPortfolioItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL = 5000; // 5 seconds

export function usePortfolioPolling(): UsePortfolioPollingResult {
  const [positions, setPositions] = useState<BCSPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const refreshToken = await getToken();
      if (!refreshToken) {
        setError('Токен не найден. Пожалуйста, войдите в систему.');
        setIsLoading(false);
        return;
      }
      const res = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'portfolio', 
          refreshToken,
          forceRefresh 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPositions(data.data || []);
        setIsLoading(false);
      } else {
        setError(data.error || 'Ошибка получения портфеля');
        setIsLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка получения портфеля';
      setError(message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPortfolio(true);

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchPortfolio(false);
      }
    }, POLL_INTERVAL);

    // Handle visibility changes - pause polling when tab is hidden
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
        // Immediately fetch when tab becomes visible
        fetchPortfolio(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchPortfolio]);

  const refresh = useCallback(() => {
    fetchPortfolio(true);
  }, [fetchPortfolio]);

  return { positions, isLoading, error, refresh };
}

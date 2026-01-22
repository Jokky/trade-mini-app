/**
 * WebSocket service for BCS Trading API Portfolio
 * Handles connection lifecycle, reconnection, and message parsing
 *
 * API sends portfolio data as a direct array of BCSPortfolioPosition[]
 * No explicit subscription message required - data flows immediately after connection
 */

import { WebSocketConnectionState, BCSPortfolioPosition, PortfolioWebSocketConfig } from './types';

export class PortfolioWebSocketService {
  private ws: WebSocket | null = null;
  private state: WebSocketConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private config: PortfolioWebSocketConfig;
  private onDataCallback?: (data: BCSPortfolioPosition[]) => void;
  private onStateChangeCallback?: (state: WebSocketConnectionState) => void;

  constructor(config: PortfolioWebSocketConfig) {
    this.config = { reconnectAttempts: 5, reconnectInterval: 1000, ...config };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setState('connecting');

    // BCS WebSocket requires token in URL (browser WebSocket doesn't support custom headers)
    const url = new URL(this.config.url);
    url.searchParams.set('token', this.config.token);

    this.ws = new WebSocket(url.toString());

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      // No subscription message needed - server sends data automatically
    };

    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = () => this.setState('error');
    this.ws.onclose = () => this.handleClose();
  }

  disconnect(): void {
    this.reconnectAttempts = this.config.reconnectAttempts!; // Prevent reconnect
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  onData(callback: (data: BCSPortfolioPosition[]) => void): void {
    this.onDataCallback = callback;
  }

  onStateChange(callback: (state: WebSocketConnectionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // BCS API sends portfolio as a direct array of positions
      if (Array.isArray(data)) {
        this.onDataCallback?.(data as BCSPortfolioPosition[]);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }

  private handleClose(): void {
    this.setState('disconnected');
    if (this.reconnectAttempts < this.config.reconnectAttempts!) {
      const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), delay);
    }
  }

  private setState(state: WebSocketConnectionState): void {
    this.state = state;
    this.onStateChangeCallback?.(state);
  }

  getState(): WebSocketConnectionState {
    return this.state;
  }
}

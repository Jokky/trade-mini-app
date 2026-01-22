/**
 * WebSocket service for BCS Trading API Portfolio
 * Handles connection lifecycle, reconnection, and message parsing
 */

import { WebSocketConnectionState, WebSocketMessage, PortfolioData, PortfolioWebSocketConfig } from './types';

export class PortfolioWebSocketService {
  private ws: WebSocket | null = null;
  private state: WebSocketConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private config: PortfolioWebSocketConfig;
  private onDataCallback?: (data: PortfolioData) => void;
  private onStateChangeCallback?: (state: WebSocketConnectionState) => void;

  constructor(config: PortfolioWebSocketConfig) {
    this.config = { reconnectAttempts: 5, reconnectInterval: 1000, ...config };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.setState('connecting');
    this.ws = new WebSocket(this.config.url, [`Bearer-${this.config.token}`]);
    
    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.subscribe();
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

  onData(callback: (data: PortfolioData) => void): void {
    this.onDataCallback = callback;
  }

  onStateChange(callback: (state: WebSocketConnectionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  private subscribe(): void {
    this.ws?.send(JSON.stringify({ action: 'subscribe', channel: 'portfolio' }));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === 'portfolio' && message.payload) {
        this.onDataCallback?.(message.payload as PortfolioData);
      }
      // TODO: Handle heartbeat responses
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

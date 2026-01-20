import { ConnectionState, PortfolioData, PortfolioWebSocketConfig, WebSocketMessage } from './types';

export class PortfolioWebSocketService {
  private ws: WebSocket | null = null;
  private config: PortfolioWebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private state: ConnectionState = 'disconnected';

  constructor(config: PortfolioWebSocketConfig) {
    this.config = { maxReconnectAttempts: 5, ...config };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.setState('connecting');
    
    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (e) => this.handleMessage(e);
      this.ws.onerror = () => this.handleError('Connection error');
      this.ws.onclose = () => this.handleClose();
    } catch (err) {
      this.handleError('Failed to create WebSocket');
    }
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.token }));
    this.ws?.send(JSON.stringify({ type: 'subscribe', channel: 'portfolio' }));
    this.startHeartbeat();
    this.setState('connected');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const msg: WebSocketMessage = JSON.parse(event.data);
      if (msg.type === 'portfolio' && msg.payload) {
        this.config.onData(msg.payload as PortfolioData);
      } else if (msg.type === 'error') {
        this.config.onError(msg.payload as string || 'Unknown error');
      }
    } catch {
      this.config.onError('Invalid message format');
    }
  }

  private handleError(message: string): void {
    this.setState('error');
    this.config.onError(message);
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.setState('disconnected');
    
    if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), delay);
    } else {
      this.triggerHttpFallback();
    }
  }

  private async triggerHttpFallback(): Promise<void> {
    if (this.config.httpFallback) {
      try {
        const data = await this.config.httpFallback();
        this.config.onData(data);
      } catch {
        this.config.onError('HTTP fallback also failed');
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.config.onStateChange(state);
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  getState(): ConnectionState { return this.state; }
}

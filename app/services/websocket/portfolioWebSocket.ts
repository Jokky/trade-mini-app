import { ConnectionState, PortfolioData, WebSocketConfig, WebSocketMessage, IPortfolioWebSocketService } from './types';

export class PortfolioWebSocketService implements IPortfolioWebSocketService {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private config: WebSocketConfig;
  private reconnectAttempt = 0;
  private subscribers: Set<(data: PortfolioData) => void> = new Set();
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = { reconnectAttempts: 5, reconnectBaseDelay: 1000, heartbeatInterval: 30000, ...config };
  }

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return;
    this.setState('connecting');
    
    return new Promise((resolve, reject) => {
      try {
        // TODO: Verify exact WebSocket URL from BCS documentation
        this.ws = new WebSocket(`${this.config.url}?token=${this.config.token}`);
        
        this.ws.onopen = () => {
          this.setState('connected');
          this.reconnectAttempt = 0;
          this.startHeartbeat();
          this.sendSubscription();
          resolve();
        };
        
        this.ws.onmessage = (event) => this.handleMessage(event);
        this.ws.onerror = () => this.setState('error');
        this.ws.onclose = () => this.handleClose();
      } catch (error) {
        this.setState('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  subscribe(callback: (data: PortfolioData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getState(): ConnectionState { return this.state; }

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.stateListeners.forEach(cb => cb(state));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      // TODO: Adjust parsing based on actual BCS API message format
      if (message.type === 'portfolio' && message.payload) {
        this.subscribers.forEach(cb => cb(message.payload as PortfolioData));
      }
    } catch { /* TODO: Add error logging */ }
  }

  private handleClose(): void {
    this.stopHeartbeat();
    if (this.reconnectAttempt < (this.config.reconnectAttempts || 5)) {
      const delay = (this.config.reconnectBaseDelay || 1000) * Math.pow(2, this.reconnectAttempt);
      this.reconnectAttempt++;
      setTimeout(() => this.connect(), delay);
    } else {
      this.setState('disconnected');
      // TODO: Implement HTTP fallback here
    }
  }

  private sendSubscription(): void {
    // TODO: Adjust subscription message format per BCS API docs
    this.ws?.send(JSON.stringify({ action: 'subscribe', channel: 'portfolio' }));
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }
}

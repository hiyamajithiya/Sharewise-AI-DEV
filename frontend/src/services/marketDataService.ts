// Real-time market data service for NSE integration

export interface MarketQuote {
  symbol: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

export interface OptionChainData {
  underlying_symbol: string;
  underlying_price: number;
  strikes: { [strike: string]: any };
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'quote_update' | 'option_chain_update' | 'error' | 'subscription_response' | 'pong';
  symbol?: string;
  underlying?: string;
  data?: any;
  message?: string;
  results?: any[];
  timestamp?: string;
}

class MarketDataService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, Set<(data: MarketQuote) => void>> = new Map();
  private optionSubscribers: Map<string, Set<(data: OptionChainData) => void>> = new Map();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private statusCallbacks: Set<(status: string) => void> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();

  constructor() {
    this.connect();
  }

  private connect() {
    // DISABLED: WebSocket connections until backend WebSocket server is ready
    console.log('Market data WebSocket connection disabled - using REST API instead');
    this.setConnectionStatus('disconnected');
    return;

    /* 
    // Original WebSocket connection code commented out to avoid TypeScript errors
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionStatus('connecting');
    
    // Get auth token
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No auth token found - WebSocket connection skipped');
      this.setConnectionStatus('error');
      return;
    }

    // Construct WebSocket URL - connect to backend on port 8000
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//localhost:8000/ws/market-data/`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Market data WebSocket connected');
        this.setConnectionStatus('connected');
        this.reconnectAttempts = 0;
        
        // Start ping interval
        this.startPing();
        
        // Resubscribe to previously subscribed symbols
        if (this.subscribedSymbols.size > 0) {
          this.subscribeToSymbols(Array.from(this.subscribedSymbols));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Market data WebSocket disconnected:', event.code, event.reason);
        this.setConnectionStatus('disconnected');
        this.stopPing();
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect();
          }, delay);
        } else {
          this.setConnectionStatus('error');
        }
      };

      this.ws.onerror = (error) => {
        console.error('Market data WebSocket error:', error);
        this.setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.setConnectionStatus('error');
    }
    */
  }

  private setConnectionStatus(status: typeof this.connectionStatus) {
    this.connectionStatus = status;
    this.statusCallbacks.forEach(callback => callback(status));
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'quote_update':
        if (message.symbol && message.data) {
          this.notifySubscribers(message.symbol, message.data);
        }
        break;
        
      case 'option_chain_update':
        if (message.underlying && message.data) {
          this.notifyOptionSubscribers(message.underlying, message.data);
        }
        break;
        
      case 'subscription_response':
        console.log('Subscription response:', message.results);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.message);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private notifySubscribers(symbol: string, data: MarketQuote) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  private notifyOptionSubscribers(underlying: string, data: OptionChainData) {
    const callbacks = this.optionSubscribers.get(underlying);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in option subscriber callback:', error);
        }
      });
    }
  }

  public subscribeToQuote(symbol: string, callback: (data: MarketQuote) => void): () => void {
    // Add callback to subscribers
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Subscribe via WebSocket
    this.subscribeToSymbols([symbol]);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
          this.unsubscribeFromSymbols([symbol]);
        }
      }
    };
  }

  public subscribeToOptionChain(underlying: string, callback: (data: OptionChainData) => void): () => void {
    // Add callback to option subscribers
    if (!this.optionSubscribers.has(underlying)) {
      this.optionSubscribers.set(underlying, new Set());
    }
    this.optionSubscribers.get(underlying)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.optionSubscribers.get(underlying);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.optionSubscribers.delete(underlying);
        }
      }
    };
  }

  public subscribeToConnectionStatus(callback: (status: string) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Send current status immediately
    callback(this.connectionStatus);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private subscribeToSymbols(symbols: string[]) {
    // WebSocket disabled - store symbols for future use when WebSocket is enabled
    console.log('WebSocket subscription disabled, storing symbols:', symbols);
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
  }

  private unsubscribeFromSymbols(symbols: string[]) {
    // WebSocket disabled - remove from stored symbols
    console.log('WebSocket unsubscription disabled, removing symbols:', symbols);
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
  }

  public disconnect() {
    this.stopPing();
    this.subscribedSymbols.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  public reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// REST API methods for market data
export class MarketDataAPI {
  private static API_BASE_URL: string = (process.env.REACT_APP_API_URL as string) || 'http://localhost:8000/api';

  private static getHeaders() {
    let accessToken: string | undefined;
    try {
      const stored = localStorage.getItem('auth_tokens');
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed?.access;
      }
    } catch (_) {
      // ignore parsing errors and proceed without token
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }

  static async getQuote(symbol: string): Promise<MarketQuote | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/market-data/quote/${encodeURIComponent(symbol)}/`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'success' ? data.data : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  static async getBulkQuotes(symbols: string[]): Promise<{ [symbol: string]: MarketQuote }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/market-data/quotes/bulk/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ symbols })
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'success' ? data.data : {};
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching bulk quotes:', error);
      return {};
    }
  }

  static async getOptionChain(underlying: string, expiry?: string): Promise<OptionChainData | null> {
    try {
      const url = new URL(`${this.API_BASE_URL}/market-data/option-chain/${encodeURIComponent(underlying)}/`);
      if (expiry) {
        url.searchParams.append('expiry', expiry);
      }

      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'success' ? data.data : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching option chain:', error);
      return null;
    }
  }

  static async getMarketStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/market-data/market-status/`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching market status:', error);
      return null;
    }
  }

  static async searchSymbols(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/market-data/search/?q=${encodeURIComponent(query)}`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'success' ? data.results : [];
      }
      
      return [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  static async subscribeToSymbols(symbols: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/market-data/subscribe/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ symbols })
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error subscribing to symbols:', error);
      return null;
    }
  }
}
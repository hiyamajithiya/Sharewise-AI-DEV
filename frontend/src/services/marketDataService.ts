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
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionStatus('connecting');
    
    // Get auth token
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No auth token found');
      this.setConnectionStatus('error');
      return;
    }

    // Construct WebSocket URL using environment variable
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    const fullWsUrl = `${wsUrl}/market-data/`;
    
    try {
      this.ws = new WebSocket(fullWsUrl);
      
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
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbols: symbols
      }));
      
      symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    } else {
      // Store for later subscription when connected
      symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    }
  }

  private unsubscribeFromSymbols(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbols: symbols
      }));
    }
    
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
  private static getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  static async getQuote(symbol: string): Promise<MarketQuote | null> {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/market-data/quote/${symbol}/`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          symbol: data.symbol,
          last_price: data.last_price,
          change: data.change,
          change_percent: data.change_percent,
          volume: data.volume,
          timestamp: data.timestamp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  static async getBulkQuotes(symbols: string[]): Promise<{ [symbol: string]: MarketQuote }> {
    try {
      const response = await fetch('/api/market-data/quotes/bulk/', {
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
      const url = new URL(`/api/market-data/option-chain/${underlying}/`, window.location.origin);
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
      const response = await fetch('/api/market-data/market-status/', {
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
      const response = await fetch(`/api/market-data/search/?q=${encodeURIComponent(query)}`, {
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
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/market-data/subscribe/`, {
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
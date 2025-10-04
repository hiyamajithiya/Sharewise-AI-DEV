import { useState, useEffect } from 'react';

interface MarketQuote {
  symbol: string;
  last_price: number;
  change: number;
  change_percent: number;
  open_price: number;
  high_price: number;
  low_price: number;
  previous_close: number;
  timestamp: string;
  data_source: string;
}

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avg_price: number;
}

export const useLiveMarketData = (symbols: string[] = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']) => {
  const [marketData, setMarketData] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const data: Record<string, MarketQuote> = {};
        
        for (const symbol of symbols) {
          try {
            const response = await fetch(`/api/market-data/quote/${symbol}/`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const result = await response.json();
            if (result.status === 'success') {
              data[symbol] = result.data;
            }
          } catch (error) {
            console.error(`Failed to fetch ${symbol}:`, error);
          }
        }
        
        setMarketData(data);
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  // Calculate portfolio value with market data
  const calculatePortfolioValue = (holdings: PortfolioHolding[]) => {
    return holdings.reduce((total, holding) => {
      const quote = marketData[holding.symbol];
      if (quote) {
        return total + (quote.last_price * holding.quantity);
      }
      return total + (holding.avg_price * holding.quantity); // Fallback to avg price
    }, 0);
  };

  // Get market data for specific symbol
  const getQuote = (symbol: string): MarketQuote | null => {
    return marketData[symbol] || null;
  };

  // Check if market is open (simplified - you might want more sophisticated logic)
  const isMarketOpen = (): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Simple US market hours check (9:30 AM - 4 PM ET, Mon-Fri)
    // This is very simplified and doesn't account for holidays or exact timezone
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  };

  return {
    marketData,
    loading,
    error,
    calculatePortfolioValue,
    getQuote,
    isMarketOpen: isMarketOpen(),
  };
};

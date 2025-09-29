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
  shares: number;
  avgCost: number;
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
        setError(null);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  // Calculate portfolio metrics from live data
  const calculatePortfolioMetrics = (holdings: PortfolioHolding[]) => {
    let totalValue = 0;
    let totalCost = 0;
    let dayChange = 0;

    holdings.forEach(holding => {
      const quote = marketData[holding.symbol];
      if (quote) {
        const currentValue = quote.last_price * holding.shares;
        const costBasis = holding.avgCost * holding.shares;
        const dayChangeValue = (quote.change * holding.shares);
        
        totalValue += currentValue;
        totalCost += costBasis;
        dayChange += dayChangeValue;
      }
    });

    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalValue: Math.round(totalValue),
      dayChange: Math.round(dayChange),
      dayChangePercent: parseFloat(dayChangePercent.toFixed(2)),
      totalPnL: Math.round(totalPnL),
      totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
      investedAmount: Math.round(totalCost),
    };
  };

  return { 
    marketData, 
    loading, 
    error, 
    calculatePortfolioMetrics,
    isDataAvailable: Object.keys(marketData).length > 0
  };
};

// Default holdings removed - portfolio data should come from backend API

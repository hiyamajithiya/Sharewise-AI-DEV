import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const LiveMarketWidget: React.FC = () => {
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/market-data/quote/AAPL/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status === 'success') {
          setMarketData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress />;
  if (!marketData) return <Typography>No market data available</Typography>;

  const isPositive = marketData.change >= 0;

  return (
    <Card sx={{ minWidth: 275, m: 1 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {marketData.symbol} - Live Quote
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4">${marketData.last_price}</Typography>
          {isPositive ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
        </Box>
        <Typography 
          variant="body2" 
          color={isPositive ? 'success.main' : 'error.main'}
        >
          {isPositive ? '+' : ''}{marketData.change.toFixed(2)} ({marketData.change_percent.toFixed(2)}%)
        </Typography>
        <Typography variant="caption" display="block">
          Source: {marketData.data_source}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LiveMarketWidget;

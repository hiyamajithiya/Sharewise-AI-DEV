import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Speed,
  TrendingDown,
} from '@mui/icons-material';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('1M');
  const { analyticsData, loading } = useAnalyticsData(timeframe);
  const { performanceMetrics } = analyticsData;

  if (loading) {
    return <Typography>Loading analytics...</Typography>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        System Analytics
      </Typography>
      
      <Grid container spacing={3}>
        {performanceMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">{metric.title}</Typography>
                <Typography variant="h4">{metric.value}</Typography>
                <Typography color={metric.color}>{metric.change}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  ButtonGroup,
  Button,
  Paper,
  Chip,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Speed,
  TrendingDown,
  BarChart,
  AccountBalance,
  Timeline,
  PieChart,
  Refresh,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { RootState } from '../store';
import { selectTestingState } from '../store/slices/testingSlice';
import { 
  AnalyticsData, 
  AnalyticsOverview,
  AnalyticsPerformance,
  AnalyticsRiskMetrics,
  TradingActivity,
  SectorAnalysis,
  UserInsights,
  CorrelationData 
} from '../types';

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('1M');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'BASIC';

  const timeframePeriods = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
  ];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getAnalyticsData(timeframe);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderOverviewMetrics = () => {
    if (!analyticsData?.overview) return null;

    const { overview } = analyticsData;
    
    const metrics = [
      {
        title: 'Total Users',
        value: overview.totalUsers.toLocaleString(),
        change: `${overview.activeUsers} active`,
        color: 'primary' as const,
        icon: <AccountBalance />,
      },
      {
        title: 'Total Trades',
        value: overview.totalTrades.toLocaleString(),
        change: `₹${(overview.totalVolume / 100000).toFixed(1)}L volume`,
        color: 'success' as const,
        icon: <Timeline />,
      },
      {
        title: 'Profitable Users',
        value: overview.profitableUsers.toLocaleString(),
        change: `Avg: ${overview.averageReturn.toFixed(1)}%`,
        color: overview.averageReturn >= 0 ? 'success' as const : 'error' as const,
        icon: <TrendingUp />,
      },
      {
        title: 'System Health',
        value: '98.5%',
        change: 'Last 30 days',
        color: 'info' as const,
        icon: <Speed />,
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '8px', 
                    backgroundColor: `${metric.color}.light`,
                    color: `${metric.color}.main`,
                    mr: 2 
                  }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metric.value}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: metric.color === 'error' ? 'error.main' : 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {metric.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderTopPerformers = () => {
    if (!analyticsData?.overview?.topPerformers) return null;

    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Top Performers
        </Typography>
        <Grid container spacing={2}>
          {analyticsData.overview.topPerformers.slice(0, 6).map((performer, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box sx={{ 
                p: 2, 
                borderRadius: '8px', 
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {performer.username}
                </Typography>
                <Typography variant="h6" color="success.main">
                  +{performer.returns.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sharpe: {performer.sharpeRatio.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderSectorAnalysis = () => {
    if (!analyticsData?.sectorAnalysis) return null;

    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Sector Analysis
        </Typography>
        <Grid container spacing={2}>
          {analyticsData.sectorAnalysis.slice(0, 8).map((sector, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {sector.sector}
                </Typography>
                <Typography 
                  variant="h6" 
                  color={sector.performance >= 0 ? 'success.main' : 'error.main'}
                >
                  {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sector.allocation.toFixed(1)}% allocation
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  if (loading && !analyticsData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Skeleton width={200} height={40} />
          <Skeleton width={100} height={32} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px' }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📊 Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`${subscriptionTier} Plan`}
            sx={{ 
              fontWeight: 600,
              backgroundColor: '#f0f9ff',
              color: '#1e40af',
              border: '1px solid #3b82f6'
            }} 
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Timeframe Selection */}
      <Box sx={{ mb: 4 }}>
        <ButtonGroup variant="outlined" size="small">
          {timeframePeriods.map((period) => (
            <Button
              key={period.value}
              variant={timeframe === period.value ? 'contained' : 'outlined'}
              onClick={() => setTimeframe(period.value)}
              sx={{ 
                borderRadius: timeframe === period.value ? '6px' : '0',
                fontWeight: timeframe === period.value ? 600 : 400
              }}
            >
              {period.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Overview Metrics */}
      {renderOverviewMetrics()}

      {/* Top Performers */}
      {renderTopPerformers()}

      {/* Sector Analysis */}
      {renderSectorAnalysis()}

      {/* Performance Summary */}
      {analyticsData?.performance && (
        <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Performance Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Risk-Adjusted Returns
                </Typography>
                <Typography variant="h5">
                  {analyticsData.performance.periodicReturns?.[0]?.returns.toFixed(2) || 'N/A'}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Benchmark Comparison
                </Typography>
                <Typography variant="h5" color="success.main">
                  +{(analyticsData.performance.benchmarkComparison?.alpha || 0).toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default Analytics;

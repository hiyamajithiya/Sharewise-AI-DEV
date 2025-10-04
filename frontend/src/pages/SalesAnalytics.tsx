import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Assignment,
  Refresh,
  Business,
  Star,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { SalesAnalyticsData, SalesMetrics, SalesRepPerformance, TopCustomer, LeadSource } from '../types';
import apiService from '../services/api';

const SalesAnalytics: React.FC = () => {
  // State management
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch sales analytics data
  const fetchAnalyticsData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await apiService.getSalesAnalyticsData();
      setAnalyticsData(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch sales analytics data:', err);
      setError(err.message || 'Failed to load sales analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle refresh
  const handleRefreshData = useCallback(() => {
    fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  // Auto-refresh every 5 minutes for sales data
  useEffect(() => {
    fetchAnalyticsData();
    
    const interval = setInterval(() => {
      fetchAnalyticsData(true);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Format time helper
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 95) return '#4caf50';
    if (performance >= 80) return '#ff9800';
    return '#f44336';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Enterprise': return 'secondary';
      case 'Professional': return 'primary';
      case 'Basic': return 'default';
      default: return 'default';
    }
  };

  // Loading skeleton component
  const MetricSkeleton = () => (
    <Card
      sx={{
        background: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e0e0e0',
        borderRadius: '16px',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Error display component
  if (error && !analyticsData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f5f7fa',
          p: 3,
        }}
      >
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={() => fetchAnalyticsData()}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              Sales Analytics
            </Typography>
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 400 }}>
              Performance metrics and sales team insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {lastRefreshed && (
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </Typography>
            )}
            <IconButton
              onClick={handleRefreshData}
              disabled={refreshing}
              sx={{
                background: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} sx={{ color: '#1F2937' }} />
              ) : (
                <Refresh sx={{ color: '#1F2937' }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MetricSkeleton />
              </Grid>
            ))
          ) : (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                        <AttachMoney sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {formatCurrency(analyticsData?.salesMetrics.revenue || 0)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Total Revenue
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {(analyticsData?.salesMetrics.revenueGrowth || 0) > 0 ? (
                              <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                            ) : (
                              <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: (analyticsData?.salesMetrics.revenueGrowth || 0) > 0 ? '#4caf50' : '#f44336',
                                fontWeight: 600,
                              }}
                            >
                              {(analyticsData?.salesMetrics.revenueGrowth || 0) > 0 ? '+' : ''}
                              {analyticsData?.salesMetrics.revenueGrowth?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                        <People sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {analyticsData?.salesMetrics.totalLeads || 0}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Total Leads
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {(analyticsData?.salesMetrics.leadsGrowth || 0) > 0 ? (
                              <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                            ) : (
                              <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{ 
                                color: (analyticsData?.salesMetrics.leadsGrowth || 0) > 0 ? '#4caf50' : '#f44336', 
                                fontWeight: 600 
                              }}
                            >
                              {(analyticsData?.salesMetrics.leadsGrowth || 0) > 0 ? '+' : ''}
                              {analyticsData?.salesMetrics.leadsGrowth?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.3)', mr: 2 }}>
                        <BarChart sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {analyticsData?.salesMetrics.conversionRate?.toFixed(1) || 0}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Conversion Rate
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {(analyticsData?.salesMetrics.conversionGrowth || 0) > 0 ? (
                              <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                            ) : (
                              <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{ 
                                color: (analyticsData?.salesMetrics.conversionGrowth || 0) > 0 ? '#4caf50' : '#f44336', 
                                fontWeight: 600 
                              }}
                            >
                              {(analyticsData?.salesMetrics.conversionGrowth || 0) > 0 ? '+' : ''}
                              {analyticsData?.salesMetrics.conversionGrowth?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.3)', mr: 2 }}>
                        <Assignment sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {formatCurrency(analyticsData?.salesMetrics.avgDealSize || 0)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Avg Deal Size
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {(analyticsData?.salesMetrics.dealSizeGrowth || 0) > 0 ? (
                              <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                            ) : (
                              <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{ 
                                color: (analyticsData?.salesMetrics.dealSizeGrowth || 0) > 0 ? '#4caf50' : '#f44336', 
                                fontWeight: 600 
                              }}
                            >
                              {(analyticsData?.salesMetrics.dealSizeGrowth || 0) > 0 ? '+' : ''}
                              {analyticsData?.salesMetrics.dealSizeGrowth?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        <Grid container spacing={3}>
          {/* Sales Team Performance */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Sales Team Performance
                </Typography>
                
                <TableContainer component={Paper} sx={{ background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                          Sales Rep
                        </TableCell>
                        <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                          Revenue
                        </TableCell>
                        <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                          Deals
                        </TableCell>
                        <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                          Conversion
                        </TableCell>
                        <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                          Target Progress
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        // Loading skeletons for table rows
                        Array.from({ length: 4 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                                <Box>
                                  <Skeleton variant="text" width="120px" height={20} />
                                  <Skeleton variant="text" width="80px" height={16} />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell><Skeleton variant="text" width="80px" /></TableCell>
                            <TableCell><Skeleton variant="text" width="40px" /></TableCell>
                            <TableCell><Skeleton variant="text" width="60px" /></TableCell>
                            <TableCell><Skeleton variant="rectangular" width="100%" height={20} /></TableCell>
                          </TableRow>
                        ))
                      ) : analyticsData?.salesTeamPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6B7280' }}>
                            No sales team data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        analyticsData?.salesTeamPerformance.map((rep, index) => (
                          <TableRow key={rep.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                  {rep.avatar}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                    {rep.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                    {rep.role}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#1F2937', fontWeight: 600 }}>
                              {formatCurrency(rep.revenue)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={rep.deals}
                                size="small"
                                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1F2937' }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#1F2937' }}>
                              {rep.conversionRate.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={rep.performance}
                                  sx={{
                                    width: 80,
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getPerformanceColor(rep.performance),
                                    },
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: getPerformanceColor(rep.performance),
                                    minWidth: '40px',
                                    fontWeight: 600,
                                  }}
                                >
                                  {rep.performance.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Lead Sources Performance
                </Typography>
                
                <Grid container spacing={2}>
                  {loading ? (
                    // Loading skeletons for lead sources
                    Array.from({ length: 4 }).map((_, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card
                          sx={{
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                                <Skeleton variant="text" width="80px" height={20} />
                              </Box>
                              <Skeleton variant="rectangular" width={60} height={20} />
                            </Box>
                            <Skeleton variant="text" width="70%" height={16} />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : analyticsData?.leadSources.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 4, 
                        color: '#6B7280',
                      }}>
                        <Typography variant="body2">
                          No lead source data available
                        </Typography>
                      </Box>
                    </Grid>
                  ) : (
                    analyticsData?.leadSources.map((source, index) => (
                      <Grid item xs={12} sm={6} key={source.id}>
                        <Card
                          sx={{
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: source.color, width: 32, height: 32, mr: 2 }}>
                                  <Business sx={{ fontSize: '1rem' }} />
                                </Avatar>
                                <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                  {source.source}
                                </Typography>
                              </Box>
                              <Chip
                                label={`${source.count} leads`}
                                size="small"
                                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#1F2937' }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                Conversion:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                {source.conversion.toFixed(1)}%
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers & Monthly Trends */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Top Customers
                </Typography>
                
                <List>
                  {loading ? (
                    // Loading skeletons for customers
                    Array.from({ length: 4 }).map((_, index) => (
                      <Box key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Skeleton variant="circular" width={40} height={40} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Skeleton variant="text" width="60%" height={20} />
                                <Skeleton variant="rectangular" width={60} height={20} />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Skeleton variant="text" width="40%" height={16} />
                                <Skeleton variant="text" width="30%" height={16} />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 3 && <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
                      </Box>
                    ))
                  ) : analyticsData?.topCustomers.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      color: '#6B7280',
                    }}>
                      <Typography variant="body2">
                        No customer data available
                      </Typography>
                    </Box>
                  ) : (
                    analyticsData?.topCustomers.map((customer, index) => (
                      <Box key={customer.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <Business sx={{ color: '#1F2937' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                  {customer.name}
                                </Typography>
                                <Chip
                                  label={customer.tier}
                                  size="small"
                                  color={getTierColor(customer.tier) as any}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
                                  {formatCurrency(customer.value)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {customer.deals} deals
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < analyticsData.topCustomers.length - 1 && (
                          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </Box>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Monthly Trends Summary */}
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Monthly Trends
                </Typography>
                
                <Grid container spacing={2}>
                  {loading ? (
                    // Loading skeletons for monthly trends
                    Array.from({ length: 3 }).map((_, index) => (
                      <Grid item xs={12} key={index}>
                        <Card
                          sx={{
                            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Skeleton variant="text" width="40%" height={28} />
                              <Skeleton variant="circular" width={20} height={20} />
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <Skeleton variant="text" width="45%" height={16} />
                              <Skeleton variant="text" width="30%" height={16} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : analyticsData?.monthlyTrends.length === 0 ? (
                    <Grid item xs={12}>
                      <Card
                        sx={{
                          background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                        }}
                      >
                        <CardContent sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            No monthly trends data available
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ) : (
                    analyticsData?.monthlyTrends.slice(-3).map((month, index) => (
                      <Grid item xs={12} key={month.month}>
                        <Card
                          sx={{
                            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                {month.month}
                              </Typography>
                              <Star sx={{ color: '#ffd700', fontSize: '1.2rem' }} />
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                Revenue: {formatCurrency(month.revenue)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                {month.leads} leads
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SalesAnalytics;
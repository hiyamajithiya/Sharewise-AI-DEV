import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
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
  TrendingUp,
  TrendingDown,
  People,
  AccountBalance,
  MonitorHeart,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { SystemMetrics, TradingStrategy, SystemAlert, TradingMonitorData } from '../types';
import apiService from '../services/api';

const TradingMonitor: React.FC = () => {
  // State management
  const [monitorData, setMonitorData] = useState<TradingMonitorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch trading monitor data
  const fetchMonitorData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await apiService.getTradingMonitorData();
      setMonitorData(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch trading monitor data:', err);
      setError(err.message || 'Failed to load trading monitor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle refresh
  const handleRefreshData = useCallback(() => {
    fetchMonitorData(true);
  }, [fetchMonitorData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMonitorData();
    
    const interval = setInterval(() => {
      fetchMonitorData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMonitorData]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <Warning color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'success': return <CheckCircle color="success" />;
      case 'info': return <Schedule color="info" />;
      default: return <Schedule color="info" />;
    }
  };

  // Loading skeleton component
  const MetricSkeleton = () => (
    <Card
      sx={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Error display component
  if (error && !monitorData) {
    return (
      <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={() => fetchMonitorData()}>
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
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', p: 3 }}>
        {/* Header */}
        <Box 
          sx={{ 
            mb: 4, 
            p: 3,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1F2937',
                mb: 1,
              }}
            >
              Trading Monitor
            </Typography>
            <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 400 }}>
              Real-time system monitoring and trading oversight
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
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                '&:hover': { background: '#e5e7eb' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} sx={{ color: '#374151' }} />
              ) : (
                <Refresh sx={{ color: '#374151' }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* System Metrics */}
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
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#3B82F6', mr: 2 }}>
                        <People sx={{ color: 'white' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {monitorData?.systemMetrics.totalUsers.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Total Users
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#10B981', mr: 2 }}>
                        <TrendingUp sx={{ color: 'white' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {monitorData?.systemMetrics.activeTraders.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Active Traders
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#3B82F6', mr: 2 }}>
                        <AccountBalance sx={{ color: 'white' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {monitorData?.systemMetrics.totalVolume || '$0'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Daily Volume
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#10B981', mr: 2 }}>
                        <MonitorHeart sx={{ color: 'white' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {monitorData?.systemMetrics.systemHealth || 0}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          System Health
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={monitorData?.systemMetrics.systemHealth || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#10B981',
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        <Grid container spacing={3}>
          {/* Active Strategies */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: 400,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Active Trading Strategies
                </Typography>
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: 'none',
                    flex: 1,
                    overflow: 'auto',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          color: '#374151', 
                          fontWeight: 600,
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                        }}>
                          Strategy Name
                        </TableCell>
                        <TableCell sx={{ 
                          color: '#374151', 
                          fontWeight: 600,
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                        }}>
                          Users
                        </TableCell>
                        <TableCell sx={{ 
                          color: '#374151', 
                          fontWeight: 600,
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                        }}>
                          Performance
                        </TableCell>
                        <TableCell sx={{ 
                          color: '#374151', 
                          fontWeight: 600,
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                        }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        // Loading skeletons for table rows
                        Array.from({ length: 4 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Skeleton variant="text" width="80%" />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Skeleton variant="text" width="60%" />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Skeleton variant="text" width="70%" />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Skeleton variant="rectangular" width={60} height={24} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : monitorData?.activeStrategies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6B7280' }}>
                            No active strategies found
                          </TableCell>
                        </TableRow>
                      ) : (
                        monitorData?.activeStrategies.map((strategy) => (
                          <TableRow key={strategy.id}>
                            <TableCell sx={{ 
                              color: '#1F2937',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {strategy.name}
                            </TableCell>
                            <TableCell sx={{ 
                              color: '#1F2937',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {strategy.users.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {strategy.performance > 0 ? (
                                  <TrendingUp sx={{ color: '#10B981', mr: 1 }} />
                                ) : (
                                  <TrendingDown sx={{ color: '#EF4444', mr: 1 }} />
                                )}
                                <Typography
                                  sx={{
                                    color: strategy.performance > 0 ? '#10B981' : '#EF4444',
                                    fontWeight: 600,
                                  }}
                                >
                                  {strategy.performance > 0 ? '+' : ''}
                                  {strategy.performance}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                              <Chip
                                label={strategy.status.toUpperCase()}
                                color={getStatusColor(strategy.status) as any}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* System Alerts */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: 400,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Recent Alerts
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {loading ? (
                    // Loading skeletons for alerts
                    Array.from({ length: 4 }).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            p: 2,
                            borderRadius: '12px',
                            background: '#f9fafb',
                            border: '1px solid #f3f4f6',
                          }}
                        >
                          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2, mt: 0.5 }} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width="40%" height={16} />
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : monitorData?.recentAlerts.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      color: '#6B7280',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CheckCircle sx={{ fontSize: 48, color: '#10B981', mb: 1 }} />
                      <Typography variant="body2">
                        No recent alerts
                      </Typography>
                      <Typography variant="caption">
                        All systems are running smoothly
                      </Typography>
                    </Box>
                  ) : (
                    monitorData?.recentAlerts.map((alert, index) => (
                      <Box key={alert.id}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            mb: 2,
                            p: 2,
                            borderRadius: '12px',
                            background: '#f9fafb',
                            border: '1px solid #f3f4f6',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                            },
                          }}
                        >
                          <Box sx={{ mr: 2, mt: 0.5 }}>
                            {getAlertIcon(alert.type)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ color: '#1F2937', mb: 0.5, fontWeight: 500 }}>
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {formatTimeAgo(alert.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                        {index < monitorData.recentAlerts.length - 1 && (
                          <Box sx={{ height: 8 }} />
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </Box>
  );
};

export default TradingMonitor;
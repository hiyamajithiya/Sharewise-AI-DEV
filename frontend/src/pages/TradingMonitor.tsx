import React from 'react';
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
} from '@mui/icons-material';

const TradingMonitor: React.FC = () => {
  const handleRefreshData = () => {
    // Simulate data refresh for trading monitor
    console.log('Refreshing trading monitor data...');
    
    // Show loading state briefly
    const refreshStartTime = Date.now();
    
    // Simulate API call delay for refreshing all data
    setTimeout(() => {
      const refreshDuration = Date.now() - refreshStartTime;
      console.log(`Trading monitor data refreshed in ${refreshDuration}ms`);
      
      // In a real application, this would:
      // 1. Fetch updated system metrics from the backend
      // 2. Refresh active strategies data
      // 3. Get latest system alerts
      // 4. Update user counts and trading volumes
      // 5. Refresh system health status
      
      // For now, we'll just log the refresh action
      console.log('Updated data:', {
        systemMetrics: 'Refreshed system metrics',
        activeStrategies: 'Updated strategy performance',
        alerts: 'Fetched latest system alerts',
        timestamp: new Date().toISOString()
      });
      
    }, 1000);
  };

  // Mock data for trading monitoring
  const systemMetrics = {
    totalUsers: 2847,
    activeTraders: 1234,
    totalVolume: '$45.2M',
    systemHealth: 98.5,
  };

  const activeStrategies = [
    { id: 1, name: 'Mean Reversion AI', users: 245, performance: 12.4, status: 'active' },
    { id: 2, name: 'Momentum Scanner', users: 189, performance: 8.7, status: 'active' },
    { id: 3, name: 'Options Wheel Bot', users: 156, performance: 15.2, status: 'active' },
    { id: 4, name: 'Swing Trade AI', users: 203, performance: -2.1, status: 'warning' },
  ];

  const recentAlerts = [
    { id: 1, type: 'warning', message: 'High volatility detected in TSLA strategy', time: '2 min ago' },
    { id: 2, type: 'error', message: 'API connection timeout for Broker XYZ', time: '5 min ago' },
    { id: 3, type: 'success', message: 'Daily profit target achieved by 89 users', time: '12 min ago' },
    { id: 4, type: 'info', message: 'Market hours ending in 30 minutes', time: '18 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Warning color="error" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Schedule color="info" />;
    }
  };

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
          <IconButton
            onClick={handleRefreshData}
            sx={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              '&:hover': { background: '#e5e7eb' },
            }}
          >
            <Refresh sx={{ color: '#374151' }} />
          </IconButton>
        </Box>

        {/* System Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                      {systemMetrics.totalUsers.toLocaleString()}
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
                      {systemMetrics.activeTraders.toLocaleString()}
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
                      {systemMetrics.totalVolume}
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
                      {systemMetrics.systemHealth}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      System Health
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemMetrics.systemHealth}
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
                      {activeStrategies.map((strategy) => (
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
                            {strategy.users}
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
                      ))}
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
                  {recentAlerts.map((alert, index) => (
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
                            {alert.time}
                          </Typography>
                        </Box>
                      </Box>
                      {index < recentAlerts.length - 1 && (
                        <Box sx={{ height: 8 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </Box>
  );
};

export default TradingMonitor;
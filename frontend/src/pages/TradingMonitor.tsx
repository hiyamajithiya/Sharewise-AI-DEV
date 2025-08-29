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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <Box 
          sx={{ 
            mb: 4, 
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
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
                color: 'white',
                mb: 1,
              }}
            >
              Trading Monitor
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              Real-time system monitoring and trading oversight
            </Typography>
          </Box>
          <IconButton
            sx={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': { background: 'rgba(255,255,255,0.2)' },
            }}
          >
            <Refresh sx={{ color: 'white' }} />
          </IconButton>
        </Box>

        {/* System Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                    <People sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {systemMetrics.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <TrendingUp sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {systemMetrics.activeTraders.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <AccountBalance sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {systemMetrics.totalVolume}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <MonitorHeart sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {systemMetrics.systemHealth}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                height: 'fit-content',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Active Trading Strategies
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Strategy Name
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Users
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Performance
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeStrategies.map((strategy) => (
                        <TableRow key={strategy.id}>
                          <TableCell sx={{ color: 'white' }}>{strategy.name}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{strategy.users}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {strategy.performance > 0 ? (
                                <TrendingUp sx={{ color: '#4caf50', mr: 1 }} />
                              ) : (
                                <TrendingDown sx={{ color: '#f44336', mr: 1 }} />
                              )}
                              <Typography
                                sx={{
                                  color: strategy.performance > 0 ? '#4caf50' : '#f44336',
                                  fontWeight: 600,
                                }}
                              >
                                {strategy.performance > 0 ? '+' : ''}
                                {strategy.performance}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                height: 'fit-content',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Recent Alerts
                </Typography>
                <Box>
                  {recentAlerts.map((alert, index) => (
                    <Box key={alert.id}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ mr: 2, mt: 0.5 }}>
                          {getAlertIcon(alert.type)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {alert.time}
                          </Typography>
                        </Box>
                      </Box>
                      {index < recentAlerts.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TradingMonitor;
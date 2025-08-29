import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ShowChart,
  Speed,
  Psychology,
  Settings,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  BarChart,
  Timeline,
  AccountBalance,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-trading-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedTrading: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Sample data for demonstration
  const algorithmicStrategies = [
    { id: 1, name: 'Momentum Breakout', status: 'RUNNING', pnl: 12450, trades: 24, winRate: 68.5 },
    { id: 2, name: 'Mean Reversion', status: 'PAUSED', pnl: -2340, trades: 15, winRate: 45.2 },
    { id: 3, name: 'Arbitrage Bot', status: 'STOPPED', pnl: 8760, trades: 89, winRate: 72.1 },
  ];

  const riskMetrics = [
    { title: 'Portfolio VaR', value: '₹45,230', subtitle: 'Daily 95% VaR', color: 'warning' as const },
    { title: 'Sharpe Ratio', value: '1.24', subtitle: 'Risk-adjusted returns', color: 'success' as const },
    { title: 'Max Drawdown', value: '8.5%', subtitle: 'Historical maximum', color: 'error' as const },
    { title: 'Beta', value: '0.87', subtitle: 'Market correlation', color: 'info' as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'PAUSED': return 'warning';
      case 'STOPPED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ 
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
      }
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header with glassmorphism */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700, 
            mb: 1, 
            color: '#1F2937',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          }}>
            Advanced Trading
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            {isTestingMode && selectedUser
              ? `Testing advanced trading features for ${selectedUser.role} role`
              : 'Professional algorithmic trading, risk management, and portfolio optimization tools'
            }
          </Typography>
        </Box>

        {/* Elite Feature Notice */}
        <Box sx={{
          mb: 4,
          p: 2,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <Typography variant="body2" sx={{ color: '#1F2937' }}>
            <strong>🌟 Elite Feature:</strong> These advanced trading tools are available exclusively to Elite subscribers. 
            Features include algorithmic trading, advanced risk management, custom indicators, and institutional-grade analytics.
          </Typography>
        </Box>

      {/* Risk Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {riskMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={metric.title}
              value={metric.value}
              icon={<BarChart />}
              color={metric.color}
              subtitle={metric.subtitle}
            />
          </Grid>
        ))}
      </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ 
          mb: 3,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#1F2937',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white',
            },
          }}
        >
          <Tab
            icon={<Psychology />}
            label="Algorithmic Trading"
            iconPosition="start"
          />
          <Tab
            icon={<Speed />}
            label="Risk Management"
            iconPosition="start"
          />
          <Tab
            icon={<ShowChart />}
            label="Advanced Charts"
            iconPosition="start"
          />
          <Tab
            icon={<Timeline />}
            label="Portfolio Optimizer"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Algorithmic Trading */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Active Trading Algorithms
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<PlayArrow />}
                    sx={{
                      background: '#f5f7fa',
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                      },
                    }}
                  >
                    Deploy New Strategy
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#1F2937', fontWeight: 700 }}>Strategy Name</TableCell>
                        <TableCell sx={{ color: '#1F2937', fontWeight: 700 }}>Status</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>P&L (₹)</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>Trades</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>Win Rate</TableCell>
                        <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {algorithmicStrategies.map((strategy) => (
                        <TableRow key={strategy.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {strategy.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={strategy.status}
                              color={getStatusColor(strategy.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={strategy.pnl >= 0 ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 600 }}
                            >
                              {strategy.pnl >= 0 ? '+' : ''}₹{strategy.pnl.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1F2937' }}>{strategy.trades}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={strategy.winRate >= 60 ? 'success.main' : 'text.primary'}
                            >
                              {strategy.winRate}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary">
                              <Settings />
                            </IconButton>
                            <IconButton size="small" color="success">
                              <PlayArrow />
                            </IconButton>
                            <IconButton size="small" color="warning">
                              <Pause />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Stop />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Quick Deploy
                </Typography>

                <Box sx={{ space: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Strategy Template</InputLabel>
                    <Select label="Strategy Template" defaultValue="">
                      <MenuItem value="momentum">Momentum Breakout</MenuItem>
                      <MenuItem value="meanrev">Mean Reversion</MenuItem>
                      <MenuItem value="arbitrage">Statistical Arbitrage</MenuItem>
                      <MenuItem value="grid">Grid Trading</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Capital Allocation"
                    type="number"
                    defaultValue="100000"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: '₹',
                    }}
                  />

                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Risk Management"
                    sx={{ mb: 2, display: 'block' }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    sx={{ mb: 1 }}
                  >
                    Deploy Strategy
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Settings />}
                  >
                    Advanced Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Risk Management */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Position Risk Monitor
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Risk Alert:</strong> Portfolio exposure exceeds 85% of allocated capital
                  </Typography>
                </Alert>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Portfolio Heat: 78%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={78} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Button variant="outlined" fullWidth startIcon={<Refresh />}>
                  Rebalance Portfolio
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Risk Limits
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Position Size
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      ₹2.5L
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Daily Loss Limit
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      ₹50K
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sector Concentration
                    </Typography>
                    <Typography variant="h6">
                      25%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Leverage Ratio
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      2.1x
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Advanced Charts */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Advanced Technical Analysis
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Professional charting with 100+ technical indicators, 
                custom drawing tools, multi-timeframe analysis, and advanced pattern recognition.
              </Typography>
            </Alert>

            <Box 
              sx={{ 
                height: 400, 
                backgroundColor: 'grey.100', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6" color="text.secondary">
                📊 Advanced Chart Placeholder
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Volume Profile
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Market Depth
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Heat Map
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Scanner
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Portfolio Optimizer */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Portfolio Optimization Engine
                </Typography>
                
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Optimization Complete:</strong> Suggested rebalancing could improve 
                    risk-adjusted returns by 12.3% while reducing volatility by 8.1%.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current vs. Optimized Allocation
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Sharpe Ratio
                      </Typography>
                      <Typography variant="h6">1.24</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Optimized Sharpe Ratio
                      </Typography>
                      <Typography variant="h6" color="success.main">1.39</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Button variant="contained" color="primary" sx={{ mr: 2 }}>
                  Apply Optimization
                </Button>
                <Button variant="outlined">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Optimization Settings
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Optimization Goal</InputLabel>
                  <Select label="Optimization Goal" defaultValue="sharpe">
                    <MenuItem value="sharpe">Maximize Sharpe Ratio</MenuItem>
                    <MenuItem value="return">Maximize Returns</MenuItem>
                    <MenuItem value="risk">Minimize Risk</MenuItem>
                    <MenuItem value="diversify">Maximize Diversification</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Target Return (%)"
                  type="number"
                  defaultValue="15"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Max Risk (%)"
                  type="number"
                  defaultValue="20"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AccountBalance />}
                >
                  Run Optimization
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      </Container>
    </Box>
  );
};

export default AdvancedTrading;
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  PieChart,
  Timeline,
  Assessment,
  MoreVert,
  Visibility,
  Download,
  Refresh,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';

const Portfolio: React.FC = () => {
  const [viewMode, setViewMode] = useState<'holdings' | 'performance' | 'analysis'>('holdings');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'BASIC';

  // Tier-based portfolio features
  const getTierFeatures = (tier: string): {
    maxHoldings: number;
    portfolioValue: number;
    advancedAnalytics: boolean;
    riskAnalysis: boolean;
    rebalanceAlerts: boolean;
    exportReports: boolean;
    color: string;
    label: string;
  } => {
    switch (tier) {
      case 'BASIC':
        return {
          maxHoldings: 10,
          portfolioValue: 50000,
          advancedAnalytics: false,
          riskAnalysis: false,
          rebalanceAlerts: false,
          exportReports: false,
          color: 'info',
          label: 'Basic Plan'
        };
      case 'PRO':
        return {
          maxHoldings: 50,
          portfolioValue: 250000,
          advancedAnalytics: true,
          riskAnalysis: true,
          rebalanceAlerts: true,
          exportReports: false,
          color: 'success',
          label: 'Pro Plan'
        };
      case 'ELITE':
        return {
          maxHoldings: -1, // Unlimited
          portfolioValue: 1000000,
          advancedAnalytics: true,
          riskAnalysis: true,
          rebalanceAlerts: true,
          exportReports: true,
          color: 'warning',
          label: 'Elite Plan'
        };
      default:
        return getTierFeatures('BASIC');
    }
  };

  const tierFeatures = getTierFeatures(subscriptionTier);

  // Mock portfolio data based on tier
  const portfolioData = {
    totalValue: Math.min(125000, tierFeatures.portfolioValue),
    dayChange: 2500,
    dayChangePercent: 2.04,
    totalPnL: 15000,
    totalPnLPercent: 13.64,
    investedAmount: 110000,
    cashBalance: 15000,
  };

  // Mock holdings data - filtered by tier
  const allHoldings = [
    { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 50, avgPrice: 2200, currentPrice: 2485.50, sector: 'Energy', tier: 'BASIC' },
    { id: 2, symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 25, avgPrice: 3100, currentPrice: 3245.75, sector: 'IT', tier: 'BASIC' },
    { id: 3, symbol: 'INFY', name: 'Infosys Limited', quantity: 100, avgPrice: 1550, currentPrice: 1678.90, sector: 'IT', tier: 'BASIC' },
    { id: 4, symbol: 'HDFC', name: 'HDFC Bank', quantity: 75, avgPrice: 1350, currentPrice: 1456.30, sector: 'Banking', tier: 'PRO' },
    { id: 5, symbol: 'ICICI', name: 'ICICI Bank', quantity: 60, avgPrice: 820, currentPrice: 892.15, sector: 'Banking', tier: 'PRO' },
    { id: 6, symbol: 'ADANIENT', name: 'Adani Enterprises', quantity: 30, avgPrice: 2800, currentPrice: 3150.00, sector: 'Infrastructure', tier: 'ELITE' },
    { id: 7, symbol: 'ASIANPAINT', name: 'Asian Paints', quantity: 40, avgPrice: 3200, currentPrice: 3485.25, sector: 'Consumer Goods', tier: 'ELITE' },
  ];

  const getFilteredHoldings = () => {
    if (subscriptionTier === 'BASIC') return allHoldings.filter(h => h.tier === 'BASIC').slice(0, tierFeatures.maxHoldings);
    if (subscriptionTier === 'PRO') return allHoldings.filter(h => ['BASIC', 'PRO'].includes(h.tier)).slice(0, tierFeatures.maxHoldings);
    return allHoldings; // ELITE gets all
  };

  const holdings = getFilteredHoldings();

  // Calculate portfolio metrics
  const calculateHoldingMetrics = (holding: any) => {
    const marketValue = holding.quantity * holding.currentPrice;
    const investedValue = holding.quantity * holding.avgPrice;
    const pnl = marketValue - investedValue;
    const pnlPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice * 100);
    
    return { marketValue, investedValue, pnl, pnlPercent };
  };

  // Sector allocation
  const getSectorAllocation = () => {
    const sectors: { [key: string]: number } = {};
    holdings.forEach(holding => {
      const { marketValue } = calculateHoldingMetrics(holding);
      sectors[holding.sector] = (sectors[holding.sector] || 0) + marketValue;
    });
    
    const total = Object.values(sectors).reduce((sum, value) => sum + value, 0);
    return Object.entries(sectors).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / total * 100).toFixed(1)
    }));
  };

  const sectorAllocation = getSectorAllocation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const portfolioStats = [
    {
      title: 'Portfolio Value',
      value: `₹${portfolioData.totalValue.toLocaleString()}`,
      change: `+${portfolioData.totalPnLPercent}%`,
      changeType: 'positive' as const,
      icon: <AccountBalance />,
      color: 'primary' as const,
      subtitle: `Max: ₹${tierFeatures.portfolioValue.toLocaleString()}`,
    },
    {
      title: "Today's P&L",
      value: `₹${portfolioData.dayChange.toLocaleString()}`,
      change: `${portfolioData.dayChangePercent >= 0 ? '+' : ''}${portfolioData.dayChangePercent}%`,
      changeType: (portfolioData.dayChangePercent >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      icon: portfolioData.dayChangePercent >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: (portfolioData.dayChangePercent >= 0 ? 'success' : 'error') as 'success' | 'error',
      subtitle: 'Daily performance',
    },
    {
      title: 'Total P&L',
      value: `₹${portfolioData.totalPnL.toLocaleString()}`,
      change: `${portfolioData.totalPnLPercent >= 0 ? '+' : ''}${portfolioData.totalPnLPercent}%`,
      changeType: (portfolioData.totalPnLPercent >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      icon: portfolioData.totalPnLPercent >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: (portfolioData.totalPnLPercent >= 0 ? 'success' : 'error') as 'success' | 'error',
      subtitle: 'Overall returns',
    },
    {
      title: 'Cash Balance',
      value: `₹${portfolioData.cashBalance.toLocaleString()}`,
      change: 'Available',
      changeType: 'positive' as const,
      icon: <AccountBalance />,
      color: 'info' as const,
      subtitle: 'Buying power',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Portfolio Dashboard 💼
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isTestingMode && selectedUser
                ? `Testing portfolio for ${selectedUser.role} role - ${subscriptionTier} tier`
                : `Your ${subscriptionTier} portfolio with ${holdings.length} holdings`
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={tierFeatures.label} 
              color={tierFeatures.color as any} 
              sx={{ fontWeight: 600, fontSize: '0.875rem' }} 
            />
            <IconButton onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
        <Divider />
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <Refresh sx={{ mr: 1 }} /> Refresh Data
        </MenuItem>
        <MenuItem onClick={handleMenuClose} disabled={!tierFeatures.exportReports}>
          <Download sx={{ mr: 1 }} /> Export Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} /> View Performance
        </MenuItem>
      </Menu>

      {/* Tier Limitations Alert */}
      {subscriptionTier === 'BASIC' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Basic Plan:</strong> Maximum {tierFeatures.maxHoldings} holdings, 
            portfolio value up to ₹{tierFeatures.portfolioValue.toLocaleString()}.
            <strong> Upgrade for advanced analytics and risk management!</strong>
          </Typography>
        </Alert>
      )}

      {/* Portfolio Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {portfolioStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* View Mode Tabs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'holdings' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('holdings')}
            startIcon={<PieChart />}
          >
            Holdings
          </Button>
          <Button
            variant={viewMode === 'performance' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('performance')}
            startIcon={<Timeline />}
            disabled={!tierFeatures.advancedAnalytics}
          >
            Performance
          </Button>
          <Button
            variant={viewMode === 'analysis' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('analysis')}
            startIcon={<Assessment />}
            disabled={!tierFeatures.riskAnalysis}
          >
            Risk Analysis
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {viewMode === 'holdings' && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Your Holdings
                  <Badge badgeContent={holdings.length} color="primary" sx={{ ml: 2 }}>
                    <PieChart />
                  </Badge>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tierFeatures.maxHoldings === -1 
                    ? 'Unlimited holdings' 
                    : `${holdings.length}/${tierFeatures.maxHoldings} holdings`}
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Stock</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Avg Price</strong></TableCell>
                      <TableCell><strong>Current Price</strong></TableCell>
                      <TableCell><strong>Market Value</strong></TableCell>
                      <TableCell><strong>P&L</strong></TableCell>
                      <TableCell><strong>P&L %</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holdings.map((holding) => {
                      const metrics = calculateHoldingMetrics(holding);
                      return (
                        <TableRow key={holding.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {holding.symbol}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {holding.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>₹{holding.avgPrice.toLocaleString()}</TableCell>
                          <TableCell>₹{holding.currentPrice.toLocaleString()}</TableCell>
                          <TableCell>₹{metrics.marketValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: metrics.pnl >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 600 
                              }}
                            >
                              {metrics.pnl >= 0 ? '+' : ''}₹{metrics.pnl.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: metrics.pnlPercent >= 0 ? 'success.main' : 'error.main',
                                  fontWeight: 600 
                                }}
                              >
                                {metrics.pnlPercent >= 0 ? '+' : ''}{metrics.pnlPercent.toFixed(2)}%
                              </Typography>
                              {metrics.pnlPercent >= 0 ? 
                                <TrendingUp color="success" sx={{ ml: 0.5, fontSize: 16 }} /> : 
                                <TrendingDown color="error" sx={{ ml: 0.5, fontSize: 16 }} />
                              }
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {viewMode === 'performance' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Performance Analysis
              </Typography>
              {tierFeatures.advancedAnalytics ? (
                <Box
                  sx={{
                    height: 400,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Timeline sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6">Advanced Performance Charts</Typography>
                    <Typography variant="body2">
                      Interactive performance tracking and portfolio analytics will be integrated here
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Upgrade to Pro or Elite</strong> to access advanced performance analytics, 
                    portfolio benchmarking, and historical performance tracking.
                  </Typography>
                </Alert>
              )}
            </Paper>
          )}

          {viewMode === 'analysis' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risk Analysis & Recommendations
              </Typography>
              {tierFeatures.riskAnalysis ? (
                <Box
                  sx={{
                    height: 400,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6">Portfolio Risk Analysis</Typography>
                    <Typography variant="body2">
                      Risk metrics, diversification analysis, and rebalancing recommendations
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Upgrade to Pro or Elite</strong> to access comprehensive risk analysis, 
                    portfolio diversification insights, and automated rebalancing alerts.
                  </Typography>
                </Alert>
              )}
            </Paper>
          )}
        </Grid>

        {/* Sector Allocation & Insights */}
        <Grid item xs={12} lg={4}>
          {/* Sector Allocation */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Sector Allocation
            </Typography>
            {sectorAllocation.map((sector, index) => (
              <Box key={sector.sector} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{sector.sector}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {sector.percentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(sector.percentage)} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
          </Paper>

          {/* Portfolio Insights */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Portfolio Insights
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  Well diversified across {sectorAllocation.length} sectors
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  Strong performance with +{portfolioData.totalPnLPercent}% returns
                </Typography>
              </Box>
              {tierFeatures.rebalanceAlerts && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning color="warning" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    Consider rebalancing IT sector allocation
                  </Typography>
                </Box>
              )}
            </Box>

            {!tierFeatures.rebalanceAlerts && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Upgrade for automated rebalancing alerts and portfolio optimization suggestions.
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" fullWidth>
                Add Money
              </Button>
              <Button variant="outlined" fullWidth>
                Place Order
              </Button>
              <Button 
                variant="outlined" 
                fullWidth 
                disabled={!tierFeatures.exportReports}
              >
                Download Report
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Portfolio;
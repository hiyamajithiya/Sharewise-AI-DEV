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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  Assessment,
  Timeline,
  PieChart,
  ShowChart,
  Download,
  Refresh,
  FilterList,
  Visibility,
  TrendingDown,
  AccountBalance,
  Speed,
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
      id={`analytics-tabpanel-${index}`}
      style={{ 
        flex: 1, 
        overflow: 'auto', 
        display: value === index ? 'block' : 'none',
        height: '100%',
        margin: 0,
        padding: 0
      }}
    >
      {value === index && <Box sx={{ p: 1.5, height: '100%', overflow: 'auto', m: 0 }}>{children}</Box>}
    </div>
  );
}

const Analytics: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('1M');

  const handleExportData = () => {
    // Create comprehensive analytics data
    const analyticsData = {
      title: 'ShareWise AI Analytics Export',
      exportedAt: new Date().toISOString(),
      timeframe: timeframe,
      performanceMetrics: performanceMetrics.map(metric => ({
        title: metric.title,
        value: metric.value,
        change: metric.change,
        color: metric.color
      })),
      topStrategies: topPerformingStrategies.map(strategy => ({
        name: strategy.name,
        returns: strategy.returns,
        trades: strategy.trades,
        winRate: strategy.winRate,
        sharpe: strategy.sharpe
      })),
      riskAnalytics: riskAnalytics.map(risk => ({
        metric: risk.metric,
        value: risk.value,
        status: risk.status,
        description: risk.description
      })),
      summary: {
        totalPortfolioValue: '₹2,45,670',
        overallWinRate: '68.2%',
        sharpeRatio: '1.47',
        maxDrawdown: '12.3%',
        topPerformingStrategy: 'NIFTY Momentum (+34.2%)'
      }
    };

    // Convert to JSON and create downloadable file
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `sharewise-analytics-${timeframe.toLowerCase()}-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`Analytics data exported for ${timeframe} timeframe`);
  };

  const handleRefreshData = () => {
    // Simulate data refresh
    console.log('Refreshing analytics data...');
    
    // Show loading state briefly
    const refreshStartTime = Date.now();
    
    // Simulate API call delay
    setTimeout(() => {
      const refreshDuration = Date.now() - refreshStartTime;
      console.log(`Analytics data refreshed in ${refreshDuration}ms`);
      
      // In a real app, this would trigger a Redux action or API call
      // to fetch the latest data from the backend
      
      // Force a re-render by updating the timeframe briefly
      const currentTimeframe = timeframe;
      setTimeframe('REFRESHING');
      setTimeout(() => {
        setTimeframe(currentTimeframe);
      }, 100);
      
    }, 800);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateReport = () => {
    // Generate and download report
    console.log('Generating custom report with selected parameters...');
    
    // Create sample report data without circular references
    const reportData = {
      title: 'Custom Analytics Report',
      generatedAt: new Date().toISOString(),
      timeframe: timeframe,
      metrics: performanceMetrics.map(metric => ({
        title: metric.title,
        value: metric.value,
        change: metric.change,
        color: metric.color
      })),
      strategies: topPerformingStrategies.map(strategy => ({
        name: strategy.name,
        returns: strategy.returns,
        trades: strategy.trades,
        winRate: strategy.winRate,
        sharpe: strategy.sharpe
      })),
      risk: riskAnalytics.map(risk => ({
        metric: risk.metric,
        value: risk.value,
        status: risk.status,
        description: risk.description
      }))
    };
    
    // Convert to JSON and create downloadable file
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const handlePreviewReport = () => {
    // Open preview in new window
    console.log('Opening report preview...');
    
    // Create HTML content for preview
    const previewContent = `
      <html>
        <head>
          <title>Analytics Report Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
            .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .metric h3 { margin: 0; color: #333; }
            .metric p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ShareWise AI Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Timeframe: ${timeframe}</p>
          </div>
          
          <h2>Performance Metrics</h2>
          ${performanceMetrics.map(metric => `
            <div class="metric">
              <h3>${metric.title}</h3>
              <p>Value: ${metric.value}</p>
              <p>Change: ${metric.change}</p>
            </div>
          `).join('')}
          
          <h2>Top Performing Strategies</h2>
          ${topPerformingStrategies.map(strategy => `
            <div class="metric">
              <h3>${strategy.name}</h3>
              <p>Returns: +${strategy.returns}%</p>
              <p>Trades: ${strategy.trades}</p>
              <p>Win Rate: ${strategy.winRate}%</p>
              <p>Sharpe Ratio: ${strategy.sharpe}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    // Open preview window
    const previewWindow = window.open('', 'reportPreview', 'width=800,height=600,scrollbars=yes');
    if (previewWindow) {
      previewWindow.document.write(previewContent);
      previewWindow.document.close();
    }
  };

  // Sample analytics data
  const performanceMetrics = [
    { title: 'Total Returns', value: '₹2,45,670', change: '+23.4%', color: 'success' as const, icon: <TrendingUp /> },
    { title: 'Win Rate', value: '68.2%', change: '+5.1%', color: 'primary' as const, icon: <Assessment /> },
    { title: 'Sharpe Ratio', value: '1.47', change: '+0.23', color: 'info' as const, icon: <Speed /> },
    { title: 'Max Drawdown', value: '12.3%', change: '-2.1%', color: 'warning' as const, icon: <TrendingDown /> },
  ];

  const topPerformingStrategies = [
    { name: 'NIFTY Momentum', returns: 34.2, trades: 127, winRate: 72.4, sharpe: 1.68 },
    { name: 'Bank Sector Play', returns: 28.7, trades: 89, winRate: 69.1, sharpe: 1.52 },
    { name: 'IT Stock Picker', returns: 22.1, trades: 156, winRate: 65.8, sharpe: 1.34 },
    { name: 'Pharma Swing', returns: 19.8, trades: 67, winRate: 63.2, sharpe: 1.28 },
  ];

  const riskAnalytics = [
    { metric: 'Portfolio Beta', value: '0.89', status: 'good', description: 'Lower than market volatility' },
    { metric: 'Value at Risk (1 day)', value: '₹12,450', status: 'moderate', description: '95% confidence level' },
    { metric: 'Expected Shortfall', value: '₹18,760', status: 'moderate', description: 'Conditional VaR' },
    { metric: 'Correlation Risk', value: '0.73', status: 'high', description: 'High sector concentration' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ 
      height: '100vh',
      background: '#f5f7fa',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Container maxWidth="xl" sx={{ py: 2, position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          mb: 2,
          p: 2,
          borderRadius: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 1, 
                color: '#1F2937',
              }}>
                Advanced Analytics
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                {isTestingMode && selectedUser
                  ? `Testing advanced analytics for ${selectedUser.role} role`
                  : 'Comprehensive performance analysis, risk metrics, and trading insights'
                }
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ 
                minWidth: 120,
                height: '40px',
                '& .MuiInputLabel-root': { color: '#6B7280' },
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  color: '#1F2937',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
                '& .MuiSelect-icon': {
                  color: '#6B7280',
                },
              }}>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeframe}
                  label="Timeframe"
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <MenuItem value="1D">1 Day</MenuItem>
                  <MenuItem value="1W">1 Week</MenuItem>
                  <MenuItem value="1M">1 Month</MenuItem>
                  <MenuItem value="3M">3 Months</MenuItem>
                  <MenuItem value="1Y">1 Year</MenuItem>
                  <MenuItem value="ALL">All Time</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                startIcon={<Download />}
                onClick={handleExportData}
                sx={{
                  height: '40px',
                  color: '#1F2937',
                  borderColor: '#e0e0e0',
                  borderRadius: '15px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#d1d5db',
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Export
              </Button>
              <IconButton 
                onClick={handleRefreshData}
                sx={{ 
                  color: '#1F2937',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Box>

      {/* Elite Feature Notice */}
        <Box sx={{
          mb: 2,
          p: 1.5,
          borderRadius: '15px',
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}>
        <Typography variant="body2">
          <strong>🌟 Elite Analytics:</strong> Advanced performance metrics, risk analysis, attribution analysis, 
          and custom reporting tools available exclusively to Elite subscribers.
        </Typography>
      </Box>

      {/* Performance Overview */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        {performanceMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.change.includes('+') ? 'positive' : 'negative'}
              icon={metric.icon}
              color={metric.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Tabs */}
        <Paper sx={{ 
          mb: 2,
          borderRadius: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: 40,
            height: 40,
            flexShrink: 0,
            '& .MuiTabs-root': {
              minHeight: 40,
            },
            '& .MuiTab-root': {
              color: '#6B7280',
              fontWeight: 600,
              minHeight: 40,
              height: 40,
              py: 0,
              px: 2,
              fontSize: '0.875rem',
            },
            '& .Mui-selected': {
              color: '#667eea',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea',
            },
            '& .MuiTabs-flexContainer': {
              height: 40,
            },
          }}
        >
          <Tab
            icon={<BarChart />}
            label="Performance Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="Risk Analytics"
            iconPosition="start"
          />
          <Tab
            icon={<PieChart />}
            label="Attribution Analysis"
            iconPosition="start"
          />
          <Tab
            icon={<ShowChart />}
            label="Custom Reports"
            iconPosition="start"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
        {/* Performance Analysis */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Portfolio Performance Chart
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined">Returns</Button>
                    <Button size="small" variant="outlined">Cumulative</Button>
                    <Button size="small" variant="outlined">Drawdown</Button>
                  </Box>
                </Box>

                <Box 
                  sx={{ 
                    height: 200, 
                    backgroundColor: 'grey.100', 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    📈 Performance Chart Placeholder
                  </Typography>
                </Box>

                <Alert severity="success" sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <strong>Outstanding Performance:</strong> Portfolio outperformed NIFTY 50 by 8.3% with 23% lower volatility.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                  Top Performing Strategies
                </Typography>

                {topPerformingStrategies.map((strategy, index) => (
                  <Box key={index} sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                        {strategy.name}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                        +{strategy.returns}%
                      </Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Trades</Typography>
                        <Typography variant="body2" sx={{ color: '#1F2937' }}>{strategy.trades}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Win Rate</Typography>
                        <Typography variant="body2" sx={{ color: '#1F2937' }}>{strategy.winRate}%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Sharpe</Typography>
                        <Typography variant="body2" sx={{ color: '#1F2937' }}>{strategy.sharpe}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

        <TabPanel value={tabValue} index={1}>
        {/* Risk Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                  Risk Metrics Overview
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#1F2937', fontWeight: 600 }}>Risk Metric</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600 }}>Value</TableCell>
                        <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskAnalytics.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {item.metric}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {item.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {item.value}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.status.toUpperCase()}
                              color={getStatusColor(item.status) as any}
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

          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                  Risk Concentration
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom sx={{ color: '#374151' }}>
                    Sector Concentration: Banking (35%)
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={35} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom sx={{ color: '#374151' }}>
                    Single Stock Exposure: Max 8.5%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={8.5} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom sx={{ color: '#374151' }}>
                    Market Cap Bias: Large Cap (72%)
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={72} 
                    color="info"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Alert severity="warning" sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <strong>High Sector Concentration:</strong> Consider diversifying beyond banking sector.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

        <TabPanel value={tabValue} index={2}>
        {/* Attribution Analysis */}
        <Card sx={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
              Performance Attribution Analysis
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2, py: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                <strong>Coming Soon:</strong> Detailed attribution analysis showing returns breakdown.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      Asset Allocation
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, color: '#10b981', fontWeight: 700 }}>
                      +2.3%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Sector/Asset mix contribution
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Timeline sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      Security Selection
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, color: '#10b981', fontWeight: 700 }}>
                      +5.7%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Stock picking effectiveness
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      Market Timing
                    </Typography>
                    <Typography variant="h4" color="error.main" sx={{ my: 1 }}>
                      -0.8%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Entry/exit timing impact
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

        <TabPanel value={tabValue} index={3}>
        {/* Custom Reports */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                  Custom Report Builder
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Professional Reporting:</strong> Create custom reports with your choice of metrics, 
                    timeframes, and visualizations. Schedule automated delivery via email.
                  </Typography>
                </Alert>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Report Type</InputLabel>
                      <Select label="Report Type">
                        <MenuItem value="performance">Performance Summary</MenuItem>
                        <MenuItem value="risk">Risk Analysis</MenuItem>
                        <MenuItem value="attribution">Attribution Report</MenuItem>
                        <MenuItem value="custom">Custom Metrics</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select label="Frequency">
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Format</InputLabel>
                      <Select label="Format">
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="email">Email Summary</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<Assessment />}
                    onClick={handleGenerateReport}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                      },
                    }}
                  >
                    Generate Report
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Visibility />}
                    onClick={handlePreviewReport}
                    sx={{
                      color: '#1F2937',
                      borderColor: '#e0e0e0',
                      '&:hover': {
                        borderColor: '#d1d5db',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                  Scheduled Reports
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1F2937' }}>Daily Performance Summary</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Last sent: Today 6:00 AM
                  </Typography>
                  <Chip label="Active" size="small" sx={{ mt: 1, backgroundColor: '#00e676', color: 'black', fontWeight: 600 }} />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1F2937' }}>Weekly Risk Report</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Last sent: Monday 8:00 AM
                  </Typography>
                  <Chip label="Active" size="small" sx={{ mt: 1, backgroundColor: '#00e676', color: 'black', fontWeight: 600 }} />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1F2937' }}>Monthly Attribution</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Next: 1st of next month
                  </Typography>
                  <Chip label="Scheduled" color="info" size="small" sx={{ mt: 1 }} />
                </Box>

                <Button variant="outlined" fullWidth startIcon={<FilterList />}>
                  Manage Schedules
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </TabPanel>
      </Paper>
      </Container>
    </Box>
  );
};

export default Analytics;
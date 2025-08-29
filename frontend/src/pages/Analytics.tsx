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
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Analytics: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('1M');

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
      minHeight: '100vh',
      background: '#f5f7fa',
      position: 'relative'
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header with glassmorphism */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 1, 
                color: 'white',
                textShadow: '1px 1px 3px rgba(0,0,0,0.2)',
              }}>
                Advanced Analytics
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
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
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: 'white' },
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
                sx={{
                  height: '40px',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '15px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Export
              </Button>
              <IconButton sx={{ color: 'white' }}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Box>

      {/* Elite Feature Notice */}
        <Box sx={{
          mb: 4,
          p: 2,
          borderRadius: '15px',
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
        <Typography variant="body2">
          <strong>🌟 Elite Analytics:</strong> Advanced performance metrics, risk analysis, attribution analysis, 
          and custom reporting tools available exclusively to Elite subscribers.
        </Typography>
      </Box>

      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
          mb: 3,
          borderRadius: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: '#6b7280',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              color: '#1976d2',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
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
      </Paper>

      {/* Tab Content */}
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
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
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
                    height: 300, 
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

                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Outstanding Performance:</strong> Your portfolio has outperformed NIFTY 50 by 8.3% 
                    over the selected period with 23% lower volatility.
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
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
                  Top Performing Strategies
                </Typography>

                {topPerformingStrategies.map((strategy, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.15)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white' }}>
                        {strategy.name}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#00e676', fontWeight: 700, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        +{strategy.returns}%
                      </Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Trades</Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>{strategy.trades}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Win Rate</Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>{strategy.winRate}%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sharpe</Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>{strategy.sharpe}</Typography>
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
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
                  Risk Metrics Overview
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Risk Metric</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Value</TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskAnalytics.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                              {item.metric}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {item.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
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
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
                  Risk Concentration
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Sector Concentration: Banking (35%)
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={35} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Single Stock Exposure: Max 8.5%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={8.5} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Market Cap Bias: Large Cap (72%)
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={72} 
                    color="info"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>High Sector Concentration:</strong> Consider diversifying beyond banking sector 
                    to reduce concentration risk.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Attribution Analysis */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Performance Attribution Analysis
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Detailed attribution analysis showing how much of your returns 
                came from asset allocation, security selection, timing, and interaction effects.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Asset Allocation
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, color: '#00e676', fontWeight: 700, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                      +2.3%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sector/Asset mix contribution
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Timeline sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Security Selection
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, color: '#00e676', fontWeight: 700, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                      +5.7%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock picking effectiveness
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Market Timing
                    </Typography>
                    <Typography variant="h4" color="error.main" sx={{ my: 1 }}>
                      -0.8%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
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
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
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
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
                  Scheduled Reports
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>Daily Performance Summary</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Last sent: Today 6:00 AM
                  </Typography>
                  <Chip label="Active" size="small" sx={{ mt: 1, backgroundColor: '#00e676', color: 'black', fontWeight: 600 }} />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>Weekly Risk Report</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Last sent: Monday 8:00 AM
                  </Typography>
                  <Chip label="Active" size="small" sx={{ mt: 1, backgroundColor: '#00e676', color: 'black', fontWeight: 600 }} />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>Monthly Attribution</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
      </Container>
    </Box>
  );
};

export default Analytics;
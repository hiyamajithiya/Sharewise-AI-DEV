import React from 'react';
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
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Assignment,
  Refresh,
  Person,
  Business,
  CheckCircle,
  Schedule,
  Star,
} from '@mui/icons-material';

const SalesAnalytics: React.FC = () => {
  // Mock data for sales analytics
  const salesMetrics = {
    revenue: 425000,
    revenueGrowth: 23.5,
    totalLeads: 156,
    leadsGrowth: 12.3,
    conversionRate: 18.5,
    conversionGrowth: 5.2,
    avgDealSize: 45000,
    dealSizeGrowth: -8.1,
  };

  const salesTeamPerformance = [
    {
      name: 'Sarah Connor',
      avatar: 'SC',
      role: 'Senior Sales Manager',
      revenue: 125000,
      deals: 8,
      conversionRate: 22.5,
      target: 150000,
      performance: 83.3,
    },
    {
      name: 'Mike Johnson',
      avatar: 'MJ',
      role: 'Sales Representative',
      revenue: 98000,
      deals: 6,
      conversionRate: 18.2,
      target: 100000,
      performance: 98.0,
    },
    {
      name: 'Lisa Park',
      avatar: 'LP',
      role: 'Account Executive',
      revenue: 112000,
      deals: 7,
      conversionRate: 20.1,
      target: 120000,
      performance: 93.3,
    },
    {
      name: 'Tom Anderson',
      avatar: 'TA',
      role: 'Sales Representative',
      revenue: 90000,
      deals: 5,
      conversionRate: 15.8,
      target: 95000,
      performance: 94.7,
    },
  ];

  const monthlyTrends = [
    { month: 'Jan', revenue: 45000, leads: 23, deals: 4 },
    { month: 'Feb', revenue: 52000, leads: 28, deals: 5 },
    { month: 'Mar', revenue: 61000, leads: 31, deals: 6 },
    { month: 'Apr', revenue: 58000, leads: 29, deals: 5 },
    { month: 'May', revenue: 67000, leads: 35, deals: 7 },
    { month: 'Jun', revenue: 73000, leads: 38, deals: 8 },
  ];

  const topCustomers = [
    { name: 'TechCorp Inc.', value: 75000, tier: 'Enterprise', deals: 3 },
    { name: 'FinancePlus', value: 65000, tier: 'Professional', deals: 2 },
    { name: 'Invest Group LLC', value: 55000, tier: 'Professional', deals: 2 },
    { name: 'Hedge Fund Solutions', value: 85000, tier: 'Enterprise', deals: 4 },
  ];

  const leadSources = [
    { source: 'Website', count: 45, conversion: 22.2, color: '#4caf50' },
    { source: 'Referrals', count: 38, conversion: 28.9, color: '#2196f3' },
    { source: 'LinkedIn', count: 32, conversion: 18.8, color: '#0077b5' },
    { source: 'Conferences', count: 25, conversion: 32.0, color: '#ff9800' },
    { source: 'Cold Calls', count: 16, conversion: 12.5, color: '#9c27b0' },
  ];

  const getPerformanceColor = (performance: number) => {
    if (performance >= 95) return '#4caf50';
    if (performance >= 80) return '#ff9800';
    return '#f44336';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Enterprise': return 'secondary';
      case 'Professional': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              Performance metrics and sales team insights
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

        {/* Key Metrics */}
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
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <AttachMoney sx={{ color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      ${(salesMetrics.revenue / 1000).toFixed(0)}K
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Total Revenue
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {salesMetrics.revenueGrowth > 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: salesMetrics.revenueGrowth > 0 ? '#4caf50' : '#f44336',
                            fontWeight: 600,
                          }}
                        >
                          {salesMetrics.revenueGrowth > 0 ? '+' : ''}{salesMetrics.revenueGrowth}%
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <People sx={{ color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {salesMetrics.totalLeads}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Total Leads
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                        <Typography
                          variant="caption"
                          sx={{ color: '#4caf50', fontWeight: 600 }}
                        >
                          +{salesMetrics.leadsGrowth}%
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.3)', mr: 2 }}>
                    <BarChart sx={{ color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {salesMetrics.conversionRate}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Conversion Rate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp sx={{ color: '#4caf50', fontSize: '1rem' }} />
                        <Typography
                          variant="caption"
                          sx={{ color: '#4caf50', fontWeight: 600 }}
                        >
                          +{salesMetrics.conversionGrowth}%
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
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.3)', mr: 2 }}>
                    <Assignment sx={{ color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      ${(salesMetrics.avgDealSize / 1000).toFixed(0)}K
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Avg Deal Size
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDown sx={{ color: '#f44336', fontSize: '1rem' }} />
                        <Typography
                          variant="caption"
                          sx={{ color: '#f44336', fontWeight: 600 }}
                        >
                          {salesMetrics.dealSizeGrowth}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Sales Team Performance */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Sales Team Performance
                </Typography>
                
                <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Sales Rep
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Revenue
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Deals
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Conversion
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                          Target Progress
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesTeamPerformance.map((rep, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                {rep.avatar}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                                  {rep.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {rep.role}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                            ${rep.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rep.deals}
                              size="small"
                              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {rep.conversionRate}%
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
                                {rep.performance}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Lead Sources Performance
                </Typography>
                
                <Grid container spacing={2}>
                  {leadSources.map((source, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card
                        sx={{
                          background: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: source.color, width: 32, height: 32, mr: 2 }}>
                                <Business sx={{ fontSize: '1rem' }} />
                              </Avatar>
                              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                {source.source}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${source.count} leads`}
                              size="small"
                              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              Conversion:
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                              {source.conversion}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers & Monthly Trends */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Top Customers
                </Typography>
                
                <List>
                  {topCustomers.map((customer, index) => (
                    <Box key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <Business sx={{ color: 'white' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
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
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                                ${customer.value.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {customer.deals} deals
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topCustomers.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      )}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Monthly Trends Summary */}
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Monthly Trends
                </Typography>
                
                <Grid container spacing={2}>
                  {monthlyTrends.slice(-3).map((month, index) => (
                    <Grid item xs={12} key={index}>
                      <Card
                        sx={{
                          background: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              {month.month}
                            </Typography>
                            <Star sx={{ color: '#ffd700', fontSize: '1.2rem' }} />
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              Revenue: ${month.revenue.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {month.leads} leads
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
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
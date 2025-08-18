import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Refresh,
  Add,
  Shield,
  Person,
  ExitToApp,
  SupervisorAccount,
  AdminPanelSettings,
  Support,
  SellOutlined,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import StatCard from '../components/common/StatCard';
import DataTable, { TableColumn } from '../components/common/DataTable';
import { startTesting, exitTesting, selectTestingState } from '../store/slices/testingSlice';
import AddUserModal from '../components/admin/AddUserModal';

const Dashboard: React.FC = () => {
  const [activeTab] = useState(0);
  const [userRole, setUserRole] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;

  const fetchUserRole = async () => {
    try {
      const apiService = (await import('../services/api')).default;
      const roleData = await apiService.get('/users/roles/');
      console.log('User role data:', roleData);
      setUserRole(roleData);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      // If the user is logged in as super admin, show the panel anyway
      if (user?.role === 'SUPER_ADMIN') {
        setUserRole({ permissions: { is_super_admin: true, is_staff_member: true } });
      } else {
        setUserRole({ permissions: { is_staff_member: false } });
      }
    }
  };

  const fetchAllUsers = async () => {
    try {
      const apiService = (await import('../services/api')).default;
      const usersData: any = await apiService.get('/users/admin/all-users/');
      setAllUsers(usersData.results || usersData);
    } catch (error) {
      console.error('Failed to fetch all users:', error);
      setAllUsers([]);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const apiService = (await import('../services/api')).default;
      const systemData: any = await apiService.get('/users/system/info/');
      setSystemInfo(systemData);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      setSystemInfo(null);
    }
  };

  const handleUserSelection = (selectedUser: any) => {
    dispatch(startTesting({ selectedUser, originalUser: user }));
    console.log('Testing as user:', selectedUser);
  };

  const exitTestingMode = () => {
    dispatch(exitTesting());
  };

  const getEffectiveUser = () => {
    return isTestingMode && selectedUser ? selectedUser : user;
  };


  const canAccessRoleTesting = userRole?.permissions?.is_super_admin || 
                                userRole?.permissions?.is_support_team || 
                                user?.role === 'SUPER_ADMIN' ||
                                user?.role === 'SUPPORT';

  useEffect(() => {
    fetchUserRole();
    fetchSystemInfo();
  }, []);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', userRole);
    console.log('Can access role testing:', canAccessRoleTesting);
    if (canAccessRoleTesting) {
      fetchAllUsers();
    }
  }, [canAccessRoleTesting, user, userRole]);

  const portfolioStats = {
    totalValue: 125000,
    todayPnl: 2500,
    todayPnlPercent: 2.04,
    totalPnl: 15000,
    totalPnlPercent: 13.64,
  };


  const recentSignals = [
    {
      symbol: 'RELIANCE',
      signal_type: 'BUY',
      entry_price: 2485.50,
      target_price: 2650.00,
      confidence_score: 0.87,
      timestamp: '2025-01-08T09:30:00Z',
      status: 'Active',
    },
    {
      symbol: 'TCS',
      signal_type: 'SELL',
      entry_price: 3245.75,
      target_price: 3100.00,
      confidence_score: 0.92,
      timestamp: '2025-01-08T10:15:00Z',
      status: 'Executed',
    },
    {
      symbol: 'INFY',
      signal_type: 'BUY',
      entry_price: 1678.90,
      target_price: 1750.00,
      confidence_score: 0.78,
      timestamp: '2025-01-08T11:00:00Z',
      status: 'Pending',
    },
  ];

  const signalColumns: TableColumn[] = [
    { id: 'symbol', label: 'Symbol', minWidth: 100 },
    { id: 'signal_type', label: 'Type', minWidth: 80 },
    { id: 'entry_price', label: 'Entry Price', minWidth: 120, align: 'right' },
    { id: 'target_price', label: 'Target', minWidth: 120, align: 'right' },
    { 
      id: 'confidence_score', 
      label: 'Confidence', 
      minWidth: 100, 
      align: 'center',
      format: (value: number) => `${Math.round(value * 100)}%`
    },
    { id: 'status', label: 'Status', minWidth: 100 },
  ];

  const topHoldings = [
    { symbol: 'RELIANCE', quantity: 50, current_price: 2485.50, pnl_percent: 5.2 },
    { symbol: 'TCS', quantity: 25, current_price: 3245.75, pnl_percent: -2.1 },
    { symbol: 'INFY', quantity: 100, current_price: 1678.90, pnl_percent: 8.7 },
    { symbol: 'HDFC', quantity: 75, current_price: 1456.30, pnl_percent: 3.4 },
  ];

  const holdingColumns: TableColumn[] = [
    { id: 'symbol', label: 'Symbol', minWidth: 100 },
    { id: 'quantity', label: 'Qty', minWidth: 80, align: 'center' },
    { id: 'current_price', label: 'Price', minWidth: 120, align: 'right' },
    { id: 'pnl_percent', label: 'P&L %', minWidth: 100, align: 'right' },
  ];

  const getUserTierFeatures = (subscriptionTier: string) => {
    const tierFeatures = {
      BASIC: {
        maxStrategies: 3,
        maxSignals: 10,
        aiStudioAccess: false,
        advancedAnalytics: false,
        customIndicators: false,
        portfolioValue: '₹50,000',
        tierColor: 'info',
        tierLabel: 'Basic Plan'
      },
      PRO: {
        maxStrategies: 10,
        maxSignals: 50,
        aiStudioAccess: true,
        advancedAnalytics: true,
        customIndicators: false,
        portfolioValue: '₹2,50,000',
        tierColor: 'success',
        tierLabel: 'Pro Plan'
      },
      ELITE: {
        maxStrategies: -1,
        maxSignals: -1,
        aiStudioAccess: true,
        advancedAnalytics: true,
        customIndicators: true,
        portfolioValue: '₹10,00,000',
        tierColor: 'warning',
        tierLabel: 'Elite Plan'
      }
    };
    return tierFeatures[subscriptionTier as keyof typeof tierFeatures] || tierFeatures.BASIC;
  };

  const getRoleDashboardContent = (effectiveUser: any) => {
    const userRole = effectiveUser?.role || 'USER';
    
    switch (userRole) {
      case 'SUPER_ADMIN':
        return renderSuperAdminDashboard(effectiveUser);
      case 'SUPPORT':
        return renderSupportDashboard(effectiveUser);
      case 'SALES':
        return renderSalesDashboard(effectiveUser);
      case 'USER':
      default:
        return renderUserDashboard(effectiveUser);
    }
  };

  const renderSuperAdminDashboard = (effectiveUser: any) => (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={systemInfo?.total_users?.toString() || '5'}
            change={systemInfo?.recent_registrations_24h ? `+${systemInfo.recent_registrations_24h} today` : '+2 today'}
            changeType="positive"
            icon={<Person />}
            color="primary"
            subtitle="System users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Verified Users"
            value={systemInfo?.verified_users?.toString() || '5'}
            change={`${Math.round((systemInfo?.verified_users || 5) / (systemInfo?.total_users || 5) * 100)}% verified`}
            changeType="positive"
            icon={<CheckCircle />}
            color="success"
            subtitle="Email verified"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Super Admins"
            value={systemInfo?.super_admins?.toString() || '1'}
            change="System administrators"
            changeType="neutral"
            icon={<AdminPanelSettings />}
            color="error"
            subtitle="Full access users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Support Team"
            value={systemInfo?.support_team?.toString() || '1'}
            change="Support staff"
            changeType="neutral"
            icon={<Support />}
            color="info"
            subtitle="Customer support"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🔧 Super Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You have complete access to all system features, user management, analytics, and configuration settings.
            </Typography>
            
            {systemInfo && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  User Breakdown:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Regular Users: {systemInfo.regular_users || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Sales Team: {systemInfo.sales_team || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Support Team: {systemInfo.support_team || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Super Admins: {systemInfo.super_admins || 0}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📊 Recent Activity
            </Typography>
            {systemInfo?.recent_registrations_7d !== undefined ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  New registrations in the last:
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
                  {systemInfo.recent_registrations_24h}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  in the last 24 hours
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600, mb: 0.5 }}>
                  {systemInfo.recent_registrations_7d}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  in the last 7 days
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Recent activity data will be displayed here.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  const renderSupportDashboard = (effectiveUser: any) => (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Open Tickets"
            value="12"
            change="-3 today"
            changeType="positive"
            icon={<Support />}
            color="warning"
            subtitle="Support requests"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Users Helped"
            value="85"
            change="+12 today"
            changeType="positive"
            icon={<Person />}
            color="success"
            subtitle="This week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Avg Response"
            value="2.5h"
            change="-30min"
            changeType="positive"
            icon={<TrendingDown />}
            color="info"
            subtitle="Response time"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🎧 Support Team Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Access user support tools, ticket management, and customer assistance features.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  const renderSalesDashboard = (effectiveUser: any) => (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Monthly Sales"
            value="₹85,000"
            change="+25%"
            changeType="positive"
            icon={<SellOutlined />}
            color="success"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="New Leads"
            value="24"
            change="+8 today"
            changeType="positive"
            icon={<Person />}
            color="primary"
            subtitle="Potential customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Conversion Rate"
            value="15.2%"
            change="+2.1%"
            changeType="positive"
            icon={<TrendingUp />}
            color="info"
            subtitle="Lead to customer"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📈 Sales Team Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track sales performance, manage leads, and monitor conversion rates.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  const renderUserDashboard = (effectiveUser: any) => {
    const features = getUserTierFeatures(effectiveUser?.subscription_tier || 'BASIC');
    
    const userQuickStats = [
      {
        title: 'Portfolio Value',
        value: features.portfolioValue,
        change: '+13.64%',
        changeType: 'positive' as const,
        icon: <AccountBalance />,
        color: 'primary' as const,
        subtitle: `Max allowed (${features.tierLabel})`,
      },
      {
        title: "Today's P&L",
        value: `₹${portfolioStats.todayPnl.toLocaleString()}`,
        change: `${portfolioStats.todayPnl >= 0 ? '+' : ''}${portfolioStats.todayPnlPercent}%`,
        changeType: (portfolioStats.todayPnl >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
        icon: portfolioStats.todayPnl >= 0 ? <TrendingUp /> : <TrendingDown />,
        color: (portfolioStats.todayPnl >= 0 ? 'success' : 'error') as 'success' | 'error',
        subtitle: 'Daily performance',
      },
      {
        title: 'Active Strategies',
        value: features.maxStrategies === -1 ? '15' : `${Math.min(3, features.maxStrategies)}`,
        change: features.maxStrategies === -1 ? 'Unlimited' : `${features.maxStrategies} max`,
        changeType: 'positive' as const,
        icon: <ShowChart />,
        color: features.tierColor as any,
        subtitle: `${features.tierLabel} limit`,
      },
    ];

    return (
    <>
      <Paper sx={{ p: 2, mb: 3, bgcolor: `${features.tierColor}.light`, border: `1px solid`, borderColor: `${features.tierColor}.main` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: `${features.tierColor}.main` }}>
              {features.tierLabel} - {effectiveUser?.first_name || 'User'}'s Trading Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {features.maxStrategies === -1 ? 'Unlimited strategies & signals' : 
               `${features.maxStrategies} strategies, ${features.maxSignals} signals`}
              {features.aiStudioAccess ? ' • AI Studio Access' : ''}
              {features.advancedAnalytics ? ' • Advanced Analytics' : ''}
              {features.customIndicators ? ' • Custom Indicators' : ''}
            </Typography>
          </Box>
          <Chip 
            label={features.tierLabel} 
            color={features.tierColor as any} 
            sx={{ fontWeight: 600, fontSize: '0.875rem' }} 
          />
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userQuickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ height: '100%' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Trading Signals
                </Typography>
                <Button size="small" sx={{ textTransform: 'none' }}>
                  View All
                </Button>
              </Box>
            </Box>
            <DataTable
              columns={signalColumns}
              rows={recentSignals}
              maxHeight={400}
              onRowClick={(row) => console.log('Signal clicked:', row)}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ height: '100%' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Holdings
                </Typography>
                <Button size="small" sx={{ textTransform: 'none' }}>
                  View Portfolio
                </Button>
              </Box>
            </Box>
            <DataTable
              columns={holdingColumns}
              rows={topHoldings}
              maxHeight={400}
              onRowClick={(row) => console.log('Holding clicked:', row)}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Market Overview
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined">
                  1D
                </Button>
                <Button size="small" variant="contained">
                  1W
                </Button>
                <Button size="small" variant="outlined">
                  1M
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 250,
                backgroundColor: '#F9FAFB',
                borderRadius: 2,
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1">
                📈 Interactive market charts will be integrated here with real-time data
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {canAccessRoleTesting && (
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 4, 
            p: 3, 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SupervisorAccount color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  User Testing Panel
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on any user to test their interface and permissions
                </Typography>
              </Box>
            </Box>
            {isTestingMode && selectedUser && (
              <Button
                variant="contained"
                onClick={exitTestingMode}
                startIcon={<ExitToApp />}
                color="secondary"
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Exit Testing Mode
              </Button>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={selectedUser ? allUsers.findIndex(user => user.id === selectedUser.id) : false}
              onChange={(e, newValue) => {
                if (newValue !== false && allUsers[newValue]) {
                  handleUserSelection(allUsers[newValue]);
                }
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3
                }
              }}
            >
              {allUsers.map((testUser, index) => (
                <Tab
                  key={testUser.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {testUser.role === 'SUPER_ADMIN' && <AdminPanelSettings fontSize="small" />}
                      {testUser.role === 'SUPPORT' && <Support fontSize="small" />}
                      {testUser.role === 'SALES' && <SellOutlined fontSize="small" />}
                      {testUser.role === 'USER' && <Person fontSize="small" />}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1 }}>
                          {testUser.first_name} {testUser.last_name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1 }}>
                          {testUser.role} - {testUser.subscription_tier || 'BASIC'}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ 
                    textTransform: 'none', 
                    minWidth: 120,
                    py: 1,
                    borderRadius: '8px 8px 0 0',
                    mx: 0.5,
                    bgcolor: selectedUser?.id === testUser.id ? 'primary.light' : 'transparent',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    }
                  }}
                />
              ))}
              {isTestingMode && (
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ExitToApp fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Exit Testing
                      </Typography>
                    </Box>
                  }
                  onClick={exitTestingMode}
                  sx={{ 
                    textTransform: 'none',
                    color: 'error.main',
                    borderRadius: '8px 8px 0 0',
                    mx: 0.5,
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.contrastText'
                    }
                  }}
                />
              )}
            </Tabs>
          </Box>

          {isTestingMode && selectedUser && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, py: 0.5 }}
              icon={<Shield fontSize="small" />}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Testing as {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.role}) - {selectedUser.subscription_tier || 'BASIC'}
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                  {isTestingMode && selectedUser 
                    ? `${selectedUser.first_name}'s Dashboard` 
                    : 'Welcome back!'
                  } 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isTestingMode && selectedUser
                    ? `Testing interface for ${selectedUser.role} role`
                    : "Here's what's happening with your investments today"
                  }
                </Typography>
              </Box>
              {/* Role-specific action buttons */}
              {(() => {
                const effectiveUser = getEffectiveUser();
                const userRole = effectiveUser?.role || 'USER';
                
                return (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Refresh button - available to all roles */}
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      sx={{ borderRadius: '8px' }}
                    >
                      Refresh
                    </Button>
                    
                    {/* Role-specific action buttons */}
                    {userRole === 'SUPER_ADMIN' && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ borderRadius: '8px' }}
                        onClick={() => setAddUserModalOpen(true)}
                      >
                        Add User
                      </Button>
                    )}
                    
                    {userRole === 'SUPPORT' && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ borderRadius: '8px' }}
                        onClick={() => alert('Support ticket system will be implemented')}
                      >
                        New Ticket
                      </Button>
                    )}
                    
                    {userRole === 'SALES' && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ borderRadius: '8px' }}
                        onClick={() => alert('CRM system for managing leads will be implemented')}
                      >
                        Add Lead
                      </Button>
                    )}
                    
                    {userRole === 'USER' && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ borderRadius: '8px' }}
                        onClick={() => navigate('/strategies?create=true')}
                      >
                        New Strategy
                      </Button>
                    )}
                  </Box>
                );
              })()}
            </Box>
            <Divider />
          </Box>

          {getRoleDashboardContent(getEffectiveUser())}
        </>
      )}

      {/* Add User Modal */}
      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onUserAdded={() => {
          fetchAllUsers(); // Refresh the users list
          fetchSystemInfo(); // Refresh system stats
        }}
      />
    </Container>
  );
};

export default Dashboard;
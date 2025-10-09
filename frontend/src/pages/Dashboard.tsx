import React, { useState, useEffect, useCallback } from 'react';
import { useLiveMarketData } from '../hooks/useLiveMarketData';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  LinearProgress,
  Avatar,
  IconButton,
  Fade,
  Slide,
  Zoom,
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Refresh,
  Add,
  Person,
  AdminPanelSettings,
  Support,
  SellOutlined,
  CheckCircle,
  Dashboard as DashboardIcon,
  Analytics,
  Speed,
  Star,
  Timeline,
  ErrorOutline,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import DataTable, { TableColumn } from '../components/common/DataTable';
import { MarketDataAPI } from '../services/marketDataService';
import LiveMarketWidget from '../components/common/LiveMarketWidget';
import apiService from '../services/api';
import { 
  DashboardData, 
  PortfolioStats, 
  Holding, 
  TradingSignal, 
  AdminDashboardData,
  SupportDashboardData,
  SalesDashboardData,
  MarketOverview 
} from '../types';
// Removed AddUserModal import - now using User Management page

// Custom styles for clean modern design
const styles = {
  gradientBackground: {
    minHeight: '100vh',
    background: '#f5f7fa',
    position: 'relative',
  },
  glassCard: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
  },
  gradientCard: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
  },
  roleAvatar: {
    width: 60,
    height: 60,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    border: '3px solid white',
  },
  animatedButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
    },
  },
};

const Dashboard: React.FC = () => {
  // State management
  const [activeTab] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [supportData, setSupportData] = useState<SupportDashboardData | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboardData | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const { marketData, loading: marketLoading } = useLiveMarketData(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']);
  const [marketPeriod, setMarketPeriod] = useState('1W');
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);

  const signalColumns: TableColumn[] = [
    { id: "symbol", label: "Symbol", minWidth: 100 },
    { id: "signal_type", label: "Signal", minWidth: 80 },
    { id: "entry_price", label: "Entry Price", minWidth: 120, format: (value) => `$${value?.toFixed(2)}` },
    { id: "target_price", label: "Target Price", minWidth: 120, format: (value) => value ? `$${value.toFixed(2)}` : 'N/A' },
    { id: "confidence_score", label: "Confidence", minWidth: 100, format: (value) => `${(value * 100)?.toFixed(1)}%` },
    { id: "executed", label: "Status", minWidth: 100, format: (value) => value ? "Executed" : "Active" },
  ];

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const userRole = user?.role || 'USER';
      
      // Add delay to prevent rate limiting
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Fetch common dashboard data
      const commonData = await apiService.getDashboardData();
      setDashboardData(commonData);

      // Add delay between requests
      await delay(200);

      // Fetch role-specific data
      switch (userRole) {
        case 'SUPER_ADMIN':
          const adminDashboardData = await apiService.getAdminDashboardData();
          setAdminData(adminDashboardData);
          break;
        case 'SUPPORT':
          const supportDashboardData = await apiService.getSupportDashboardData();
          setSupportData(supportDashboardData);
          break;
        case 'SALES':
          const salesDashboardData = await apiService.getSalesDashboardData();
          setSalesData(salesDashboardData);
          break;
        default:
          // USER role - common data is sufficient
          break;
      }

      // Also fetch system info
      const systemData = await apiService.get('/users/system/info/');
      setSystemInfo(systemData);
      
      setLastRefreshed(new Date());
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.response?.data?.detail || 'Failed to load dashboard data. Please try again.');
      
      // Fallback to basic system info on error
      try {
        const systemData = await apiService.get('/users/system/info/');
        setSystemInfo(systemData);
      } catch (systemError) {
        console.error('Failed to fetch system info:', systemError);
        setSystemInfo(null);
      }
    }
  }, [user?.role]);

  // Refresh dashboard data
  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      await apiService.refreshDashboardData();
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Failed to refresh dashboard data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getEffectiveUser = () => {
    return user;
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };

    initializeDashboard();
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        handleRefreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshing, loading]);

  // Get current portfolio stats or use defaults
  const portfolioStats: PortfolioStats = dashboardData?.portfolioStats || {
    totalValue: 0,
    todayPnl: 0,
    todayPnlPercent: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    allocatedCapital: 0,
    availableFunds: 0,
    activePositions: 0,
    currency: 'INR'
  };

  // Get current holdings or use empty array
  const topHoldings: Holding[] = dashboardData?.topHoldings || [];

  // Get recent signals or use empty array
  const recentSignals: TradingSignal[] = dashboardData?.recentSignals || [];

  const holdingColumns: TableColumn[] = [
    { id: 'symbol', label: 'Symbol', minWidth: 100 },
    { id: 'quantity', label: 'Qty', minWidth: 80, align: 'center' },
    { id: 'current_price', label: 'Price', minWidth: 120, align: 'right' },
    { id: 'pnl_percent', label: 'P&L %', minWidth: 100, align: 'right' },
  ];

  // Format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Format currency values
  const formatCurrency = (value: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${value.toLocaleString()}`;
  };

  const getUserTierFeatures = (subscriptionTier: string) => {
    const tierFeatures = {
      BASIC: {
        maxStrategies: 3,
        maxSignals: 10,
        aiStudioAccess: false,
        advancedAnalytics: false,
        customIndicators: false,
        portfolioValue: formatCurrency(portfolioStats.totalValue),
        tierColor: 'info',
        tierLabel: 'Basic Plan'
      },
      PRO: {
        maxStrategies: 10,
        maxSignals: 50,
        aiStudioAccess: true,
        advancedAnalytics: true,
        customIndicators: false,
        portfolioValue: formatCurrency(portfolioStats.totalValue),
        tierColor: 'success',
        tierLabel: 'Pro Plan'
      },
      ELITE: {
        maxStrategies: -1,
        maxSignals: -1,
        aiStudioAccess: true,
        advancedAnalytics: true,
        customIndicators: true,
        portfolioValue: formatCurrency(portfolioStats.totalValue),
        tierColor: 'warning',
        tierLabel: 'Elite Plan'
      }
    };
    return tierFeatures[subscriptionTier as keyof typeof tierFeatures] || tierFeatures.BASIC;
  };

  // Error retry component
  const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <Card sx={{ ...styles.glassCard, p: 4, textAlign: 'center' }}>
      <ErrorOutline sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#EF4444', mb: 2 }}>
        Failed to Load Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
        {error}
      </Typography>
      <Button
        variant="contained"
        onClick={onRetry}
        sx={styles.animatedButton}
        startIcon={<Refresh />}
      >
        Retry
      </Button>
    </Card>
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <>
      <Skeleton variant="rectangular" height={80} sx={{ mb: 3, borderRadius: 2 }} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        {[1, 2].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </>
  );

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
      {/* Role Header */}
      <Fade in timeout={600}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          border: 'none',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          mb: 3, 
          p: 2.5 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ ...styles.roleAvatar, width: 50, height: 50, mr: 2.5 }}>
              <AdminPanelSettings sx={{ fontSize: 26, color: 'white' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 800, 
                color: 'white',
                textShadow: '1px 1px 3px rgba(0,0,0,0.2)',
                mb: 0.3 
              }}>
                Super Admin Control Center
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '0.95rem'
              }}>
                Complete system oversight and management capabilities
              </Typography>
            </Box>
            <Chip 
              label="SUPER ADMIN" 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                height: '26px'
              }} 
            />
          </Box>
        </Card>
      </Fade>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: "Total Users",
            value: loading ? <Skeleton width={40} /> : (adminData?.systemMetrics?.totalUsers?.toString() || systemInfo?.total_users?.toString() || '0'),
            change: loading ? <Skeleton width={60} /> : (adminData?.systemMetrics?.totalUsers || systemInfo?.recent_registrations_24h ? `+${adminData?.systemMetrics?.totalUsers || systemInfo.recent_registrations_24h} today` : '+0 today'),
            icon: <Person />,
            color: "#667eea",
            delay: 100
          },
          {
            title: "Verified Users",
            value: loading ? <Skeleton width={40} /> : (adminData?.systemMetrics?.totalUsers?.toString() || systemInfo?.verified_users?.toString() || '0'),
            change: loading ? <Skeleton width={60} /> : `${Math.round(((adminData?.systemMetrics?.totalUsers || systemInfo?.verified_users || 0) / (adminData?.systemMetrics?.totalUsers || systemInfo?.total_users || 1)) * 100)}% verified`,
            icon: <CheckCircle />,
            color: "#10B981",
            delay: 200
          },
          {
            title: "Active Strategies",
            value: loading ? <Skeleton width={40} /> : (adminData?.systemMetrics?.activeTraders?.toString() || '0'),
            change: loading ? <Skeleton width={60} /> : "Live strategies",
            icon: <ShowChart />,
            color: "#F59E0B",
            delay: 300
          },
          {
            title: "System Health",
            value: loading ? <Skeleton width={40} /> : `${adminData?.systemHealth?.uptime || '99.9%'}`,
            change: loading ? <Skeleton width={60} /> : "Uptime",
            icon: <Speed />,
            color: "#3B82F6",
            delay: 400
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Zoom in timeout={stat.delay}>
              <Card sx={{ ...styles.glassCard, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: stat.color,
                      mb: 0.5,
                      textShadow: `0 2px 4px ${stat.color}20`
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '15px',
                    background: `${stat.color}15`,
                    color: stat.color,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `${stat.color}25`,
                      transform: 'rotate(10deg) scale(1.1)',
                    }
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

{/* Live Market Data Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Live Market Data
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <LiveMarketWidget />
        </Grid>
      </Grid>

      {/* Main Content Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Slide direction="right" in timeout={800}>
            <Card sx={{ ...styles.glassCard, p: 3, height: '350px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  mr: 2
                }}>
                  <DashboardIcon sx={{ color: '#667eea', fontSize: 30 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  System Overview
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, lineHeight: 1.5 }}>
                Complete access to all system features, user management, analytics, and configuration settings.
              </Typography>
              
              {systemInfo && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#1F2937' }}>
                    User Distribution
                  </Typography>
                  {[
                    { label: 'Regular Users', count: systemInfo.regular_users || 0, color: '#667eea' },
                    { label: 'Sales Team', count: systemInfo.sales_team || 0, color: '#10B981' },
                    { label: 'Support Team', count: systemInfo.support_team || 0, color: '#F59E0B' },
                    { label: 'Super Admins', count: systemInfo.super_admins || 0, color: '#EF4444' }
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        mr: 1.5,
                        boxShadow: `0 2px 4px ${item.color}40`
                      }} />
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: '#374151' }}>
                        {item.label}
                      </Typography>
                      <Chip 
                        label={item.count}
                        size="small"
                        sx={{ 
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                          fontWeight: 600,
                          height: '20px',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Card>
          </Slide>
        </Grid>

        <Grid item xs={12} md={6}>
          <Slide direction="left" in timeout={1000}>
            <Card sx={{ ...styles.glassCard, p: 3, height: '350px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10B98115 0%, #059F8015 100%)',
                  mr: 2
                }}>
                  <Timeline sx={{ color: '#10B981', fontSize: 30 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  Recent Activity
                </Typography>
              </Box>
              
              {systemInfo?.recent_registrations_7d !== undefined ? (
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                    New user registrations overview
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                        Last 24 hours
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: '#667eea', 
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
                      }}>
                        {systemInfo.recent_registrations_24h}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((systemInfo.recent_registrations_24h / 10) * 100, 100)}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                        Last 7 days
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: '#10B981', 
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                      }}>
                        {systemInfo.recent_registrations_7d}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((systemInfo.recent_registrations_7d / 50) * 100, 100)}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #10B981 0%, #059F80 100%)',
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 3,
                  background: 'linear-gradient(135deg, #F3F4F615 0%, #E5E7EB15 100%)',
                  borderRadius: '15px',
                  border: '1px dashed #D1D5DB'
                }}>
                  <Analytics sx={{ fontSize: 36, color: '#9CA3AF', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Activity analytics will appear here
                  </Typography>
                </Box>
              )}
            </Card>
          </Slide>
        </Grid>
      </Grid>
    </>
  );

  const renderSupportDashboard = (effectiveUser: any) => (
    <>
      {/* Role Header */}
      <Fade in timeout={600}>
        <Card sx={{ ...styles.gradientCard, mb: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ ...styles.roleAvatar, mr: 3 }}>
              <Support sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                mb: 0.5 
              }}>
                Support Command Center
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem'
              }}>
                Customer assistance and issue resolution hub
              </Typography>
            </Box>
            <Chip 
              label="SUPPORT TEAM" 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} 
            />
          </Box>
        </Card>
      </Fade>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Open Tickets",
            value: "12",
            change: "-3 today",
            icon: <Support />,
            color: "#F59E0B",
            delay: 100
          },
          {
            title: "Users Helped",
            value: "85",
            change: "+12 today",
            icon: <Person />,
            color: "#10B981",
            delay: 200
          },
          {
            title: "Avg Response",
            value: "2.5h",
            change: "-30min",
            icon: <Speed />,
            color: "#3B82F6",
            delay: 300
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Zoom in timeout={stat.delay}>
              <Card sx={{ ...styles.glassCard, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: stat.color,
                      mb: 0.5,
                      textShadow: `0 2px 4px ${stat.color}20`
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '15px',
                    background: `${stat.color}15`,
                    color: stat.color,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `${stat.color}25`,
                      transform: 'rotate(10deg) scale(1.1)',
                    }
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Slide direction="up" in timeout={800}>
            <Card sx={{ ...styles.glassCard, p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #3B82F615 0%, #1D4ED815 100%)',
                  mr: 2
                }}>
                  <Support sx={{ color: '#3B82F6', fontSize: 30 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  Support Dashboard
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>
                Access comprehensive user support tools, ticket management system, and customer assistance features to provide exceptional service.
              </Typography>

              <Grid container spacing={3}>
                {[
                  { icon: <Support />, title: 'Ticket Management', desc: 'Handle and resolve customer tickets efficiently' },
                  { icon: <Person />, title: 'User Assistance', desc: 'Direct customer support and guidance' },
                  { icon: <Analytics />, title: 'Performance Metrics', desc: 'Track support team performance and KPIs' },
                  { icon: <Speed />, title: 'Quick Actions', desc: 'Access frequently used support tools' }
                ].map((feature, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{
                      p: 3,
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.15)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3B82F6',
                          mr: 2
                        }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Slide>
        </Grid>
      </Grid>
    </>
  );

  const renderSalesDashboard = (effectiveUser: any) => (
    <>
      {/* Role Header */}
      <Fade in timeout={600}>
        <Card sx={{ ...styles.gradientCard, mb: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ ...styles.roleAvatar, mr: 3 }}>
              <SellOutlined sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                mb: 0.5 
              }}>
                Sales Performance Hub
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem'
              }}>
                Lead management and revenue tracking center
              </Typography>
            </Box>
            <Chip 
              label="SALES TEAM" 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} 
            />
          </Box>
        </Card>
      </Fade>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Monthly Sales",
            value: "₹85,000",
            change: "+25%",
            icon: <SellOutlined />,
            color: "#10B981",
            delay: 100
          },
          {
            title: "New Leads",
            value: "24",
            change: "+8 today",
            icon: <Person />,
            color: "#667eea",
            delay: 200
          },
          {
            title: "Conversion Rate",
            value: "15.2%",
            change: "+2.1%",
            icon: <TrendingUp />,
            color: "#F59E0B",
            delay: 300
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Zoom in timeout={stat.delay}>
              <Card sx={{ ...styles.glassCard, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: stat.color,
                      mb: 0.5,
                      textShadow: `0 2px 4px ${stat.color}20`
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '15px',
                    background: `${stat.color}15`,
                    color: stat.color,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `${stat.color}25`,
                      transform: 'rotate(10deg) scale(1.1)',
                    }
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Slide direction="up" in timeout={800}>
            <Card sx={{ ...styles.glassCard, p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10B98115 0%, #059F8015 100%)',
                  mr: 2
                }}>
                  <TrendingUp sx={{ color: '#10B981', fontSize: 30 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  Sales Dashboard
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, lineHeight: 1.6 }}>
                Track sales performance, manage customer leads, monitor conversion rates, and optimize revenue generation strategies.
              </Typography>

              <Grid container spacing={3}>
                {[
                  { icon: <SellOutlined />, title: 'Revenue Tracking', desc: 'Monitor sales performance and revenue metrics' },
                  { icon: <Person />, title: 'Lead Management', desc: 'Organize and nurture potential customers' },
                  { icon: <Analytics />, title: 'Performance Analytics', desc: 'Analyze sales trends and conversion rates' },
                  { icon: <Star />, title: 'Customer Success', desc: 'Track customer satisfaction and retention' }
                ].map((feature, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{
                      p: 3,
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 159, 128, 0.05) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 159, 128, 0.1) 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          mr: 2
                        }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Slide>
        </Grid>
      </Grid>
    </>
  );

  const renderUserDashboard = (effectiveUser: any) => {
    const features = getUserTierFeatures(effectiveUser?.subscription_tier || 'BASIC');
    
    const getTierGradient = (tier: string) => {
      switch (tier) {
        case 'ELITE':
          return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
        case 'PRO':
          return 'linear-gradient(135deg, #10B981 0%, #059F80 100%)';
        default:
          return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
    };

    return (
    <>
      {/* Tier Header */}
      <Fade in timeout={600}>
        <Card sx={{ 
          background: getTierGradient(effectiveUser?.subscription_tier || 'BASIC'),
          mb: 4, 
          p: 3,
          border: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ 
              ...styles.roleAvatar, 
              mr: 3,
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <AccountBalance sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                mb: 0.5 
              }}>
                {effectiveUser?.first_name || 'User'}'s Trading Account
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem'
              }}>
                {features.maxStrategies === -1 ? 'Unlimited strategies & signals' : 
                 `${features.maxStrategies} strategies, ${features.maxSignals} signals`}
                {features.aiStudioAccess ? ' • AI Studio Access' : ''}
                {features.advancedAnalytics ? ' • Advanced Analytics' : ''}
                {features.customIndicators ? ' • Custom Indicators' : ''}
              </Typography>
            </Box>
            <Chip 
              label={features.tierLabel}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} 
            />
          </Box>
        </Card>
      </Fade>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Portfolio Value',
            value: features.portfolioValue,
            change: '+13.64%',
            icon: <AccountBalance />,
            color: "#667eea",
            delay: 100
          },
          {
            title: "Today's P&L",
            value: loading ? <Skeleton width={80} /> : formatCurrency(portfolioStats.todayPnl),
            change: loading ? <Skeleton width={60} /> : `${portfolioStats.todayPnl >= 0 ? '+' : ''}${portfolioStats.todayPnlPercent.toFixed(2)}%`,
            icon: portfolioStats.todayPnl >= 0 ? <TrendingUp /> : <TrendingDown />,
            color: portfolioStats.todayPnl >= 0 ? "#10B981" : "#EF4444",
            delay: 200
          },
          {
            title: 'Active Strategies',
            value: features.maxStrategies === -1 ? '15' : `${Math.min(3, features.maxStrategies)}`,
            change: features.maxStrategies === -1 ? 'Unlimited' : `${features.maxStrategies} max`,
            icon: <ShowChart />,
            color: "#F59E0B",
            delay: 300
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Zoom in timeout={stat.delay}>
              <Card sx={{ ...styles.glassCard, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: stat.color,
                      mb: 0.5,
                      textShadow: `0 2px 4px ${stat.color}20`
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box sx={{
                    p: 2,
                    borderRadius: '15px',
                    background: `${stat.color}15`,
                    color: stat.color,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `${stat.color}25`,
                      transform: 'rotate(10deg) scale(1.1)',
                    }
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Trading Data */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Slide direction="right" in timeout={800}>
            <Card sx={{ ...styles.glassCard, height: '100%' }}>
              <Box sx={{ p: 4, pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      mr: 2
                    }}>
                      <Timeline sx={{ color: '#667eea', fontSize: 30 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                      Recent Trading Signals
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/trading', { state: { activeTab: 'signals' } })}
                    sx={{ 
                      ...styles.animatedButton,
                      py: 1,
                      px: 3
                    }}

                  >
                    View All
                  </Button>
                </Box>
              </Box>
              <Box sx={{ 
                '& .MuiPaper-root': {
                  background: 'transparent',
                  boxShadow: 'none'
                }
              }}>
                <DataTable
                  columns={signalColumns}
                  rows={recentSignals}
                  maxHeight={400}
                  onRowClick={(row) => console.log('Signal clicked:', row)}
                />
              </Box>
            </Card>
          </Slide>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Slide direction="left" in timeout={1000}>
            <Card sx={{ ...styles.glassCard, height: '100%' }}>
              <Box sx={{ p: 4, pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, #10B98115 0%, #059F8015 100%)',
                      mr: 2
                    }}>
                      <ShowChart sx={{ color: '#10B981', fontSize: 30 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F2937' }}>
                      Top Holdings
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/portfolio', { state: { activeTab: 'holdings' } })}
                    sx={{ 
                      color: '#667eea',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Portfolio
                  </Button>
                </Box>
              </Box>
              <Box sx={{ 
                '& .MuiPaper-root': {
                  background: 'transparent',
                  boxShadow: 'none'
                }
              }}>
                <DataTable
                  columns={holdingColumns}
                  rows={topHoldings}
                  maxHeight={400}
                  onRowClick={(row) => console.log('Holding clicked:', row)}
                />
              </Box>
            </Card>
          </Slide>
        </Grid>

        {/* Market Overview */}
        <Grid item xs={12}>
          <Fade in timeout={1200}>
            <Card sx={{ ...styles.glassCard, p: 4, minHeight: 450, height: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, #F59E0B15 0%, #D9770615 100%)',
                    mr: 2
                  }}>
                    <Analytics sx={{ color: '#F59E0B', fontSize: 30 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
                    Market Overview
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['1D', '1W', '1M'].map((period, idx) => (
                    <Button 
                      key={period}
                      size="small" 
                      variant={marketPeriod === period ? "contained" : "outlined"}
                      onClick={() => setMarketPeriod(period)}
                      sx={{ 
                        ...(marketPeriod === period ? styles.animatedButton : {
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': {
                            borderColor: '#5a67d8',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                          }
                        }),
                        minWidth: 50,
                        py: 1,
                        transition: 'all 0.3s ease',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {period}
                    </Button>
                  ))}
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 320,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  borderRadius: '15px',
                  border: '2px dashed rgba(102, 126, 234, 0.2)',
                  color: 'text.secondary',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.03) 0%, transparent 70%)',
                    animation: 'rotate 20s linear infinite',
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', zIndex: 1, p: 3 }}>
                  <ShowChart sx={{ fontSize: 64, color: '#667eea', mb: 2, opacity: 0.7 }} />
                  <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 600, mb: 1 }}>
                    Interactive Market Charts - {marketPeriod}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(102, 126, 234, 0.8)', mb: 2, lineHeight: 1.6 }}>
                    Real-time market data and advanced analytics for {marketPeriod === '1D' ? 'daily' : marketPeriod === '1W' ? 'weekly' : 'monthly'} view
                  </Typography>
                  
                  {/* Market Stats Preview */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 3,
                    mt: 3,
                    flexWrap: 'wrap'
                  }}>
                    {[
                      { label: 'NIFTY 50', value: '19,450.85', change: '+1.2%', color: '#10B981' },
                      { label: 'SENSEX', value: '65,220.35', change: '+0.8%', color: '#10B981' },
                      { label: 'BANK NIFTY', value: '44,180.90', change: '-0.3%', color: '#EF4444' },
                    ].map((index, idx) => (
                      <Box key={idx} sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.6)',
                        minWidth: 120,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: '#6B7280', 
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5
                        }}>
                          {index.label}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: '#1F2937', 
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          mb: 0.5
                        }}>
                          {index.value}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: index.color,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          {index.change}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </>
  );
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={styles.gradientBackground}>
        <Container maxWidth="xl" sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <Card sx={{ ...styles.glassCard, p: 6, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3
                  }
                }} 
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea', mb: 1 }}>
              Loading Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Preparing your personalized trading experience...
            </Typography>
          </Card>
        </Container>
      </Box>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <Box sx={styles.gradientBackground}>
        <Container maxWidth="xl" sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <ErrorState onRetry={() => {
            setError(null);
            fetchDashboardData();
          }} />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={styles.gradientBackground}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {activeTab === 0 && (
          <>
            {/* Modern Header */}
            <Fade in timeout={400}>
              <Card sx={{ ...styles.glassCard, mb: 3, p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" component="h1" sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: 'none'
                    }}>
                      Welcome back, {getEffectiveUser()?.first_name || 'Trader'}!
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.4 }}>
                      Here's what's happening with your trading portfolio today
                    </Typography>
                  </Box>
                  
                  {/* Role-specific action buttons */}
                  {(() => {
                    const effectiveUser = getEffectiveUser();
                    const userRole = effectiveUser?.role || 'USER';
                    
                    return (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Role-specific action buttons */}
                        {userRole === 'SUPER_ADMIN' && (
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={styles.animatedButton}
                            onClick={() => navigate('/users?action=add')}
                          >
                            Add User
                          </Button>
                        )}
                        
                        {userRole === 'SUPPORT' && (
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={styles.animatedButton}
                            onClick={() => alert('Support ticket system will be implemented')}
                          >
                            New Ticket
                          </Button>
                        )}
                        
                        {userRole === 'SALES' && (
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={styles.animatedButton}
                            onClick={() => alert('CRM system for managing leads will be implemented')}
                          >
                            Add Lead
                          </Button>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              </Card>
            </Fade>

            {getRoleDashboardContent(getEffectiveUser())}
          </>
        )}

        {/* Add User functionality moved to User Management page */}
      </Container>

      {/* Add keyframe animation for rotating elements */}
      <style>
        {`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default Dashboard;

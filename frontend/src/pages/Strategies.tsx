import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Menu,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Settings,
  BarChart,
  Timeline,
  Assessment,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Stop,
  Pause,
  AutoMode,
  PanTool,
  TrendingFlat,
  CheckCircle,
  Info,
  HelpOutline,
  Lightbulb,
  Warning,
  NotificationsActive,
  Circle,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { selectTestingState } from '../store/slices/testingSlice';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice';
import { RootState } from '../store';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface TierFeatures {
  maxStrategies: number;
  backtest: boolean;
  customIndicators: boolean;
  advancedAnalytics: boolean;
  paperTrading: boolean;
  liveTrading: boolean;
  color: string;
  label: string;
}

const Strategies: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [strategiesState, setStrategiesState] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStrategyForEdit, setSelectedStrategyForEdit] = useState<any>(null);
  const [selectedStrategyForDetails, setSelectedStrategyForDetails] = useState<any>(null);
  
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const location = useLocation();
  
  // Notification state
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const notificationLoading = useSelector((state: RootState) => state.notifications.loading);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'BASIC';

  const [newStrategy, setNewStrategy] = useState({
    name: '',
    type: 'TECHNICAL',
    timeframe: '1D',
    riskLevel: 'MEDIUM',
    description: '',
    // Trading parameters
    symbols: '',
    buyConditions: {
      indicator: 'RSI',
      operator: 'BELOW',
      value: '30',
      additionalCondition: ''
    },
    sellConditions: {
      indicator: 'RSI',
      operator: 'ABOVE',
      value: '70',
      additionalCondition: ''
    },
    stopLoss: '5',
    takeProfit: '10',
    positionSize: '10',
    maxPositions: '3',
    entryLogic: 'AND',
    exitLogic: 'OR'
  });

  // Auto-open dialog when navigating from Dashboard
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setCreateDialogOpen(true);
      // Clean up URL by removing the query parameter
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  // Tier-based strategy features
  const getTierFeatures = (tier: string): TierFeatures => {
    switch (tier) {
      case 'BASIC':
        return {
          maxStrategies: 3,
          backtest: false,
          customIndicators: false,
          advancedAnalytics: false,
          paperTrading: true,
          liveTrading: false,
          color: 'info',
          label: 'Basic Plan'
        };
      case 'PRO':
        return {
          maxStrategies: 10,
          backtest: true,
          customIndicators: false,
          advancedAnalytics: true,
          paperTrading: true,
          liveTrading: true,
          color: 'success',
          label: 'Pro Plan'
        };
      case 'ELITE':
        return {
          maxStrategies: -1, // Unlimited
          backtest: true,
          customIndicators: true,
          advancedAnalytics: true,
          paperTrading: true,
          liveTrading: true,
          color: 'warning',
          label: 'Elite Plan'
        };
      default:
        return getTierFeatures('BASIC');
    }
  };

  const tierFeatures = getTierFeatures(subscriptionTier);

  // TODO: Load strategy data from API based on tier
  const allStrategies = [
    {
      id: 1,
      name: 'RSI Momentum',
      type: 'TECHNICAL',
      status: 'ACTIVE',
      performance: 12.5,
      trades: 45,
      winRate: 68.9,
      timeframe: '1H',
      riskLevel: 'MEDIUM',
      createdAt: '2024-01-15',
      tier: 'BASIC',
      autoTrade: true,
      lastTrade: '2 hours ago',
      nextSignal: 'Buy RELIANCE at 2485'
    },
    {
      id: 2,
      name: 'MACD Cross',
      type: 'TECHNICAL',
      status: 'PAUSED',
      performance: 8.2,
      trades: 32,
      winRate: 62.5,
      timeframe: '4H',
      riskLevel: 'LOW',
      createdAt: '2024-01-10',
      tier: 'BASIC',
      autoTrade: false,
      lastTrade: '1 day ago',
      nextSignal: 'Waiting for signal'
    },
    {
      id: 3,
      name: 'Breakout Strategy',
      type: 'TECHNICAL',
      status: 'ACTIVE',
      performance: 18.7,
      trades: 28,
      winRate: 75.0,
      timeframe: '1D',
      riskLevel: 'HIGH',
      createdAt: '2024-01-08',
      tier: 'PRO',
      autoTrade: true,
      lastTrade: '30 minutes ago',
      nextSignal: 'Sell TCS at 3250'
    },
    {
      id: 4,
      name: 'AI Sentiment',
      type: 'AI_POWERED',
      status: 'ACTIVE',
      performance: 22.1,
      trades: 67,
      winRate: 71.6,
      timeframe: '1D',
      riskLevel: 'MEDIUM',
      createdAt: '2024-01-05',
      tier: 'ELITE',
      autoTrade: true,
      lastTrade: '15 minutes ago',
      nextSignal: 'Buy INFY at 1680'
    },
    {
      id: 5,
      name: 'Options Wheel',
      type: 'OPTIONS',
      status: 'BACKTESTING',
      performance: 15.3,
      trades: 24,
      winRate: 83.3,
      timeframe: '1W',
      riskLevel: 'LOW',
      createdAt: '2024-01-03',
      tier: 'ELITE',
      autoTrade: false,
      lastTrade: 'N/A',
      nextSignal: 'Backtesting in progress'
    },
  ];

  const getFilteredStrategies = () => {
    let filteredStrategies;
    if (subscriptionTier === 'BASIC') {
      filteredStrategies = allStrategies.filter(s => s.tier === 'BASIC').slice(0, tierFeatures.maxStrategies);
    } else if (subscriptionTier === 'PRO') {
      filteredStrategies = allStrategies.filter(s => ['BASIC', 'PRO'].includes(s.tier)).slice(0, tierFeatures.maxStrategies);
    } else {
      filteredStrategies = allStrategies; // ELITE gets all
    }
    
    // Initialize strategiesState if empty
    if (strategiesState.length === 0) {
      setStrategiesState(filteredStrategies);
      return filteredStrategies;
    }
    
    return strategiesState;
  };

  const strategies = getFilteredStrategies();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'warning';
      case 'BACKTESTING': return 'info';
      case 'STOPPED': return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, strategyId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedStrategyId(strategyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStrategyId(null);
  };

  const toggleAutoTrade = (strategyId: number) => {
    console.log('Toggling auto trade for strategy:', strategyId);
    
    // Update the strategy state
    setStrategiesState(prevStrategies => {
      const updatedStrategies = prevStrategies.map(strategy => 
        strategy.id === strategyId 
          ? { 
              ...strategy, 
              autoTrade: !strategy.autoTrade,
              nextSignal: !strategy.autoTrade 
                ? `Auto signal for ${strategy.name}` 
                : 'Manual mode - no auto signals'
            }
          : strategy
      );
      
      // Show feedback message
      const strategy = prevStrategies.find(s => s.id === strategyId);
      const newMode = strategy?.autoTrade ? 'MANUAL' : 'AUTO';
      setFeedbackMessage(`${strategy?.name} switched to ${newMode} mode`);
      setTimeout(() => setFeedbackMessage(''), 3000);
      
      return updatedStrategies;
    });
    
    handleMenuClose();
    // In real app, this would make API call to toggle auto trading
  };

  const executeManualTrade = (strategyId: number) => {
    setSelectedStrategyId(strategyId);
    setTradeDialogOpen(true);
    handleMenuClose();
  };

  const deployStrategy = (strategyId: number) => {
    console.log('Deploying strategy:', strategyId);
    
    // Update the strategy state to show it's deployed
    setStrategiesState(prevStrategies => 
      prevStrategies.map(strategy => 
        strategy.id === strategyId 
          ? { 
              ...strategy, 
              status: 'ACTIVE',
              nextSignal: 'Deployed to live trading - monitoring signals'
            }
          : strategy
      )
    );
    
    const strategy = strategiesState.find(s => s.id === strategyId);
    setFeedbackMessage(`${strategy?.name} deployed to live trading successfully!`);
    setTimeout(() => setFeedbackMessage(''), 3000);
    
    handleMenuClose();
    // In real app, this would deploy the strategy to live trading
  };

  const pauseStrategy = (strategyId: number) => {
    console.log('Pausing strategy:', strategyId);
    
    // Update the strategy state
    setStrategiesState(prevStrategies => 
      prevStrategies.map(strategy => 
        strategy.id === strategyId 
          ? { 
              ...strategy, 
              status: strategy.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
              nextSignal: strategy.status === 'ACTIVE' 
                ? 'Strategy paused - no signals' 
                : strategy.autoTrade 
                  ? `Auto signal for ${strategy.name}` 
                  : 'Manual mode - no auto signals'
            }
          : strategy
      )
    );
    
    handleMenuClose();
    // In real app, this would make API call to pause/resume strategy
  };

  const steps = ['Basic Info', 'Symbols & Scripts', 'Buy Conditions', 'Sell Conditions', 'Risk Management'];

  // Helper component for guidelines
  const GuidelineBox = ({ title, children, icon = <Info /> }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <Box
      sx={{
        p: 2,
        mb: 3,
        background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        
        border: '1px solid #e0e0e0',
        borderRadius: '12px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ color: '#374151' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1F2937' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#374151' }}>
            {children}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const resetDialog = () => {
    setCreateDialogOpen(false);
    setActiveStep(0);
    setNewStrategy({
      name: '',
      type: 'TECHNICAL',
      timeframe: '1D',
      riskLevel: 'MEDIUM',
      description: '',
      symbols: '',
      buyConditions: {
        indicator: 'RSI',
        operator: 'BELOW',
        value: '30',
        additionalCondition: ''
      },
      sellConditions: {
        indicator: 'RSI',
        operator: 'ABOVE',
        value: '70',
        additionalCondition: ''
      },
      stopLoss: '5',
      takeProfit: '10',
      positionSize: '10',
      maxPositions: '3',
      entryLogic: 'AND',
      exitLogic: 'OR'
    });
  };

  const handleCreateStrategy = () => {
    console.log('Creating strategy:', newStrategy);
    
    // Add the new strategy to the state (in real app, this would be API call)
    const newStrategyItem = {
      id: Math.max(...allStrategies.map(s => s.id)) + 1,
      name: newStrategy.name,
      type: newStrategy.type,
      status: 'ACTIVE',
      performance: 0,
      trades: 0,
      winRate: 0,
      timeframe: newStrategy.timeframe,
      riskLevel: newStrategy.riskLevel,
      createdAt: new Date().toISOString().split('T')[0],
      tier: subscriptionTier,
      autoTrade: false,
      lastTrade: 'N/A',
      nextSignal: 'Strategy created - ready to start'
    };

    setStrategiesState(prev => [...prev, newStrategyItem]);
    setFeedbackMessage(`Strategy "${newStrategy.name}" created successfully!`);
    setTimeout(() => setFeedbackMessage(''), 3000);
    
    resetDialog();
  };

  // Fetch notifications on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({}) as any);
    }
  }, [dispatch, user]);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Mark notification as read
  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markAsRead(notificationId) as any);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead() as any);
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'success.main';
      case 'ERROR': return 'error.main';
      case 'WARNING': return 'warning.main';
      case 'SIGNAL': return 'info.main';
      case 'ALERT': return 'error.main';
      default: return 'primary.main';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle />;
      case 'ERROR': return <Warning />;
      case 'WARNING': return <Warning />;
      case 'SIGNAL': return <TrendingUp />;
      case 'ALERT': return <NotificationsActive />;
      default: return <Info />;
    }
  };

  const strategyStats = [
    {
      title: 'Active Strategies',
      value: strategies.filter(s => s.status === 'ACTIVE').length.toString(),
      change: `${tierFeatures.maxStrategies === -1 ? 'Unlimited' : `${strategies.length}/${tierFeatures.maxStrategies}`}`,
      changeType: 'positive' as const,
      icon: <PlayArrow />,
      color: 'primary' as const,
      subtitle: 'Running strategies',
    },
    {
      title: 'Avg Performance',
      value: `${(strategies.reduce((sum, s) => sum + s.performance, 0) / strategies.length || 0).toFixed(1)}%`,
      change: 'This month',
      changeType: 'positive' as const,
      icon: <TrendingUp />,
      color: 'success' as const,
      subtitle: 'Returns across all strategies',
    },
    {
      title: 'Total Trades',
      value: strategies.reduce((sum, s) => sum + s.trades, 0).toString(),
      change: '+12 today',
      changeType: 'positive' as const,
      icon: <BarChart />,
      color: 'info' as const,
      subtitle: 'Executed trades',
    },
    {
      title: 'Win Rate',
      value: `${(strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length || 0).toFixed(1)}%`,
      change: 'Overall success rate',
      changeType: 'positive' as const,
      icon: <Assessment />,
      color: 'warning' as const,
      subtitle: 'Profitable trades',
    },
  ];

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
        borderRadius: '20px',
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 700, 
              mb: 1, 
              color: '#1F2937',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}>
              Trading Strategies 🎯
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              {isTestingMode && selectedUser
                ? `Testing strategies for ${selectedUser.role} role - ${subscriptionTier} tier`
                : `Manage your ${subscriptionTier} trading strategies and backtests`
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={tierFeatures.label} 
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.875rem',
                backgroundColor: '#f3f4f6',
                color: '#1F2937',
                border: '1px solid #d1d5db'
              }} 
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={tierFeatures.maxStrategies !== -1 && strategies.length >= tierFeatures.maxStrategies}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: '#9CA3AF',
                  color: 'white'
                }
              }}
            >
              Create Strategy
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Feedback Message */}
      {feedbackMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            color: '#1F2937'
          }} 
          onClose={() => setFeedbackMessage('')}
        >
          {feedbackMessage}
        </Alert>
      )}

      {/* Tier Limitations Alert */}
      {subscriptionTier === 'BASIC' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Basic Plan:</strong> Maximum {tierFeatures.maxStrategies} strategies, paper trading only.
            <strong> Upgrade to Pro or Elite for backtesting and live trading!</strong>
          </Typography>
        </Alert>
      )}

      {/* Tabs with theme styling */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={activeTab === 0 ? 'contained' : 'outlined'}
            onClick={() => setActiveTab(0)}
            startIcon={<Settings />}
            sx={{
              ...(activeTab === 0 ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '15px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-1px)',
                },
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                borderRadius: '15px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            Strategies
          </Button>
          <Button
            variant={activeTab === 1 ? 'contained' : 'outlined'}
            onClick={() => setActiveTab(1)}
            startIcon={<NotificationsActive />}
            sx={{
              ...(activeTab === 1 ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '15px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-1px)',
                },
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                borderRadius: '15px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Notifications
              {unreadCount > 0 && (
                <Badge 
                  badgeContent={unreadCount} 
                  color="error" 
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.625rem', 
                      height: 16, 
                      minWidth: 16,
                      backgroundColor: '#ef4444',
                      color: 'white'
                    } 
                  }}
                >
                  <></>  
                </Badge>
              )}
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
      {/* Strategy Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {strategyStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Strategies Table */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: '20px',
        background: 'white', 
        border: '1px solid #e0e0e0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
            Your Strategies
            <Badge badgeContent={strategies.length} color="primary" sx={{ ml: 2 }}>
              <Settings />
            </Badge>
          </Typography>
        </Box>

        {strategies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No strategies created yet 🚀
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Trading strategies are like your personal trading assistants. They follow the rules you set up and can automatically buy/sell stocks for you. Don't worry - we'll guide you through creating your first one!
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setCreateDialogOpen(true)}
                startIcon={<Add />}
                size="large"
                sx={{ 
                  borderRadius: '16px', 
                  px: 4, 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                Create Your First Strategy
              </Button>
              
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                Takes 5 minutes • Beginner-friendly • No coding required
              </Typography>
            </Box>

            <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                💡 Quick Start Tips for Beginners:
              </Typography>
              <Box sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Start Simple:</strong> Use RSI indicator for your first strategy
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Pick familiar stocks:</strong> Choose companies you know (RELIANCE, TCS, INFY)
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Set stop loss:</strong> Always protect yourself with 3-5% stop loss
                </Typography>
                <Typography variant="body2">
                  • <strong>Test first:</strong> Start with paper trading before using real money
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Strategy Name</strong></TableCell>
                  <TableCell>
                    <strong>Type</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Analysis method
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Current state
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <strong>Auto Trade</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Mode setting
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <strong>Performance</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Total returns
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <strong>Next Signal</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Upcoming action
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <strong>Risk Level</strong>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Risk rating
                    </Typography>
                  </TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {strategies.map((strategy) => (
                <TableRow key={strategy.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {strategy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {strategy.timeframe} • Created {strategy.createdAt}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={strategy.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={strategy.status} 
                      color={getStatusColor(strategy.status) as any} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        icon={strategy.autoTrade ? <AutoMode /> : <PanTool />}
                        label={strategy.autoTrade ? 'AUTO' : 'MANUAL'} 
                        color={strategy.autoTrade ? 'success' : 'default'}
                        size="small"
                        onClick={() => toggleAutoTrade(strategy.id)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            transition: 'transform 0.2s ease'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                      {strategy.autoTrade && strategy.status === 'ACTIVE' && (
                        <CheckCircle color="success" sx={{ fontSize: 16 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: strategy.performance >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600 
                        }}
                      >
                        {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                      </Typography>
                      {strategy.performance >= 0 ? 
                        <TrendingUp color="success" sx={{ ml: 0.5, fontSize: 16 }} /> : 
                        <TrendingDown color="error" sx={{ ml: 0.5, fontSize: 16 }} />
                      }
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {strategy.nextSignal}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Last: {strategy.lastTrade}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={strategy.riskLevel} 
                      color={getRiskColor(strategy.riskLevel) as any} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!strategy.autoTrade && strategy.status === 'ACTIVE' && (
                        <IconButton 
                          size="small"
                          onClick={() => executeManualTrade(strategy.id)}
                          sx={{ color: 'primary.main' }}
                          title="Execute Manual Trade"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      <IconButton onClick={(e) => handleMenuClick(e, strategy.id)}>
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === 1 && (
        <Paper sx={{ 
          p: 3, 
          borderRadius: '20px',
          background: 'white', 
          border: '1px solid #e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                disabled={notificationLoading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  },
                  '&:disabled': {
                    background: '#9CA3AF',
                    color: 'white'
                  }
                }}
              >
                Mark All Read
              </Button>
            )}
          </Box>
          
          {notificationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingSpinner size={40} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsActive sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll receive notifications about strategy signals, trades, and alerts here.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id}
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '12px', 
                    mb: 1,
                    background: notification.is_read 
                      ? '#f9fafb' 
                      : 'white',
                    cursor: 'pointer',
                    '&:hover': {
                      background: '#f3f4f6',
                    }
                  }}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        bgcolor: getNotificationColor(notification.type),
                        width: 32,
                        height: 32
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 400 : 600, color: '#1F2937' }}>
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                        <Chip 
                          label={notification.type} 
                          size="small" 
                          sx={{ ml: 'auto', fontSize: '0.625rem' }} 
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography 
                          variant="body2" 
                          sx={{ mt: 0.5, mb: 1, color: '#374151' }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Strategy Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          const strategy = strategies.find(s => s.id === selectedStrategyId);
          if (strategy) {
            setSelectedStrategyForDetails(strategy);
            setDetailsDialogOpen(true);
          }
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const strategy = strategies.find(s => s.id === selectedStrategyId);
          if (strategy) {
            setSelectedStrategyForEdit(strategy);
            setEditDialogOpen(true);
          }
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} /> Edit Strategy
        </MenuItem>
        {selectedStrategyId && (
          <>
            <MenuItem onClick={() => selectedStrategyId && toggleAutoTrade(selectedStrategyId)}>
              <AutoMode sx={{ mr: 1 }} /> 
              {strategies.find(s => s.id === selectedStrategyId)?.autoTrade ? 'Disable Auto Trade' : 'Enable Auto Trade'}
            </MenuItem>
            {!strategies.find(s => s.id === selectedStrategyId)?.autoTrade && (
              <MenuItem onClick={() => selectedStrategyId && executeManualTrade(selectedStrategyId)}>
                <PlayArrow sx={{ mr: 1 }} /> Execute Manual Trade
              </MenuItem>
            )}
            {tierFeatures.liveTrading && (
              <MenuItem onClick={() => selectedStrategyId && deployStrategy(selectedStrategyId)}>
                <TrendingFlat sx={{ mr: 1 }} /> Deploy to Live Trading
              </MenuItem>
            )}
          </>
        )}
        {tierFeatures.backtest && (
          <MenuItem onClick={() => {
            console.log('Running backtest for strategy:', selectedStrategyId);
            
            // Update strategy to show backtesting status
            setStrategiesState(prevStrategies => 
              prevStrategies.map(strategy => 
                strategy.id === selectedStrategyId 
                  ? { 
                      ...strategy, 
                      status: 'BACKTESTING',
                      nextSignal: 'Running historical backtest...'
                    }
                  : strategy
              )
            );
            
            const strategy = strategiesState.find(s => s.id === selectedStrategyId);
            setFeedbackMessage(`Started backtesting for ${strategy?.name}`);
            setTimeout(() => setFeedbackMessage(''), 3000);
            
            // Simulate backtest completion after 5 seconds
            setTimeout(() => {
              setStrategiesState(prevStrategies => 
                prevStrategies.map(strategy => 
                  strategy.id === selectedStrategyId 
                    ? { 
                        ...strategy, 
                        status: 'ACTIVE',
                        nextSignal: 'Backtest completed - Ready for trading',
                        performance: Math.random() * 20 - 5 // Random performance between -5% and 15%
                      }
                    : strategy
                )
              );
              setFeedbackMessage(`Backtest completed for ${strategy?.name}`);
              setTimeout(() => setFeedbackMessage(''), 3000);
            }, 5000);
            
            handleMenuClose();
          }}>
            <Timeline sx={{ mr: 1 }} /> Run Backtest
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedStrategyId && pauseStrategy(selectedStrategyId)}>
          {selectedStrategyId && strategies.find(s => s.id === selectedStrategyId)?.status === 'ACTIVE' ? (
            <>
              <Pause sx={{ mr: 1 }} /> Pause Strategy
            </>
          ) : (
            <>
              <PlayArrow sx={{ mr: 1 }} /> Resume Strategy
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Stopping strategy:', selectedStrategyId);
          
          // Update strategy status to stopped
          setStrategiesState(prevStrategies => 
            prevStrategies.map(strategy => 
              strategy.id === selectedStrategyId 
                ? { 
                    ...strategy, 
                    status: 'STOPPED',
                    autoTrade: false,
                    nextSignal: 'Strategy stopped - no signals'
                  }
                : strategy
            )
          );
          
          const strategy = strategiesState.find(s => s.id === selectedStrategyId);
          setFeedbackMessage(`${strategy?.name} has been stopped`);
          setTimeout(() => setFeedbackMessage(''), 3000);
          
          handleMenuClose();
        }}>
          <Stop sx={{ mr: 1 }} /> Stop Strategy
        </MenuItem>
        <MenuItem onClick={() => {
          const strategy = strategiesState.find(s => s.id === selectedStrategyId);
          if (window.confirm(`Are you sure you want to delete "${strategy?.name}"? This action cannot be undone.`)) {
            console.log('Deleting strategy:', selectedStrategyId);
            
            // Remove strategy from state
            setStrategiesState(prevStrategies => 
              prevStrategies.filter(strategy => strategy.id !== selectedStrategyId)
            );
            
            setFeedbackMessage(`Strategy "${strategy?.name}" has been deleted`);
            setTimeout(() => setFeedbackMessage(''), 3000);
          }
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Enhanced Create Strategy Dialog */}
      <Dialog open={createDialogOpen} onClose={resetDialog} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Add sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Create New Trading Strategy
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
              },
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            },
            '& .MuiFormControl-root': {
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
                '& .MuiSvgIcon-root': {
                  color: '#374151',
                },
              },
            },
          }}
        >
          <Box sx={{ pt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Basic Info */}
            {activeStep === 0 && (
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>Basic Strategy Information</Typography>
                  
                  <GuidelineBox title="Getting Started - What is a Trading Strategy?" icon={<Lightbulb />}>
                    A trading strategy is like a recipe for making money in the stock market. It tells you exactly when to buy stocks, when to sell them, and how much to invest. Think of it as your personal trading assistant that follows rules you set up.
                  </GuidelineBox>

                  <GuidelineBox title="Step 1 Guide: Basic Information">
                    • <strong>Strategy Name:</strong> Give your strategy a memorable name (e.g., "My First RSI Strategy")<br/>
                    • <strong>Strategy Type:</strong> Choose how your strategy will analyze stocks<br/>
                    • <strong>Timeframe:</strong> How often should we check the stocks? (1 hour = very active, 1 day = once daily)<br/>
                    • <strong>Risk Level:</strong> How much are you comfortable potentially losing?
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Strategy Name"
                        value={newStrategy.name}
                        onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Strategy Type</InputLabel>
                        <Select
                          value={newStrategy.type}
                          label="Strategy Type"
                          onChange={(e) => setNewStrategy({ ...newStrategy, type: e.target.value })}
                        >
                          <MenuItem value="TECHNICAL">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Technical Analysis</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uses charts and patterns (Recommended for beginners)
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="FUNDAMENTAL">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Fundamental Analysis</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Based on company financials and news
                              </Typography>
                            </Box>
                          </MenuItem>
                          {tierFeatures.customIndicators && <MenuItem value="AI_POWERED">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>AI-Powered</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uses artificial intelligence (Advanced)
                              </Typography>
                            </Box>
                          </MenuItem>}
                          {tierFeatures.customIndicators && <MenuItem value="OPTIONS">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Options Strategy</Typography>
                              <Typography variant="caption" color="text.secondary">
                                For options trading (Expert level)
                              </Typography>
                            </Box>
                          </MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Timeframe</InputLabel>
                        <Select
                          value={newStrategy.timeframe}
                          label="Timeframe"
                          onChange={(e) => setNewStrategy({ ...newStrategy, timeframe: e.target.value })}
                        >
                          <MenuItem value="1M">1 Minute</MenuItem>
                          <MenuItem value="5M">5 Minutes</MenuItem>
                          <MenuItem value="15M">15 Minutes</MenuItem>
                          <MenuItem value="1H">1 Hour</MenuItem>
                          <MenuItem value="4H">4 Hours</MenuItem>
                          <MenuItem value="1D">1 Day</MenuItem>
                          <MenuItem value="1W">1 Week</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Risk Level</InputLabel>
                        <Select
                          value={newStrategy.riskLevel}
                          label="Risk Level"
                          onChange={(e) => setNewStrategy({ ...newStrategy, riskLevel: e.target.value })}
                        >
                          <MenuItem value="LOW">Low Risk</MenuItem>
                          <MenuItem value="MEDIUM">Medium Risk</MenuItem>
                          <MenuItem value="HIGH">High Risk</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Description"
                        value={newStrategy.description}
                        onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Symbols & Scripts */}
            {activeStep === 1 && (
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>Symbols & Scripts Configuration</Typography>

                  <GuidelineBox title="What are Trading Symbols?" icon={<HelpOutline />}>
                    Trading symbols are short codes for companies on the stock exchange. For example:<br/>
                    • RELIANCE = Reliance Industries<br/>
                    • TCS = Tata Consultancy Services<br/>
                    • INFY = Infosys<br/>
                    Choose companies you know and trust!
                  </GuidelineBox>

                  <GuidelineBox title="Position Size & Risk Management Guide">
                    • <strong>Position Size:</strong> How many shares to buy each time (Start with 10-20 shares for beginners)<br/>
                    • <strong>Max Positions:</strong> Maximum trades running at once (Recommend 2-3 for beginners)<br/>
                    • <strong>Example:</strong> 10 shares × 3 positions × ₹2,500 per share = ₹75,000 maximum investment
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Trading Symbols"
                        value={newStrategy.symbols}
                        onChange={(e) => setNewStrategy({ ...newStrategy, symbols: e.target.value })}
                        fullWidth
                        placeholder="e.g., RELIANCE, TCS, INFY, HDFC"
                        helperText="Enter comma-separated stock symbols you want to trade"
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Position Size"
                        value={newStrategy.positionSize}
                        onChange={(e) => setNewStrategy({ ...newStrategy, positionSize: e.target.value })}
                        fullWidth
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">shares</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Max Positions"
                        value={newStrategy.maxPositions}
                        onChange={(e) => setNewStrategy({ ...newStrategy, maxPositions: e.target.value })}
                        fullWidth
                        type="number"
                        helperText="Maximum concurrent positions"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Buy Conditions */}
            {activeStep === 2 && (
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>Buy Entry Conditions</Typography>

                  <GuidelineBox title="Understanding Buy Conditions - When to Buy Stocks?" icon={<Lightbulb />}>
                    This is where you tell your strategy exactly when to buy stocks. Think of it like this:<br/>
                    "Buy RELIANCE stock when RSI goes below 30" - This means buy when the stock is oversold (potentially cheap).
                  </GuidelineBox>

                  <GuidelineBox title="Popular Indicators Explained (Beginner Friendly)">
                    • <strong>RSI (Recommended for beginners):</strong> Shows if stock is "oversold" (cheap) or "overbought" (expensive)<br/>
                      - Buy when RSI below 30 = Stock might be too cheap<br/>
                      - Sell when RSI above 70 = Stock might be too expensive<br/><br/>
                    • <strong>MACD:</strong> Shows momentum - when line crosses up, stock might go up<br/>
                    • <strong>Price:</strong> Simple price comparison (e.g., buy when price drops below ₹2,400)<br/>
                    • <strong>Moving Average:</strong> Average price over time - shows trend direction
                  </GuidelineBox>

                  <GuidelineBox title="Example Buy Condition Setup">
                    <strong>Beginner Setup:</strong><br/>
                    • Indicator: RSI<br/>
                    • Condition: Below<br/>
                    • Value: 30<br/>
                    <strong>Meaning:</strong> "Buy when the stock is oversold (RSI below 30)"
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Indicator</InputLabel>
                        <Select
                          value={newStrategy.buyConditions.indicator}
                          label="Indicator"
                          onChange={(e) => setNewStrategy({ 
                            ...newStrategy, 
                            buyConditions: { ...newStrategy.buyConditions, indicator: e.target.value }
                          })}
                        >
                          <MenuItem value="RSI">RSI</MenuItem>
                          <MenuItem value="MACD">MACD</MenuItem>
                          <MenuItem value="SMA">Simple Moving Average</MenuItem>
                          <MenuItem value="EMA">Exponential Moving Average</MenuItem>
                          <MenuItem value="BOLLINGER">Bollinger Bands</MenuItem>
                          <MenuItem value="STOCHASTIC">Stochastic</MenuItem>
                          <MenuItem value="PRICE">Price</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Condition</InputLabel>
                        <Select
                          value={newStrategy.buyConditions.operator}
                          label="Condition"
                          onChange={(e) => setNewStrategy({ 
                            ...newStrategy, 
                            buyConditions: { ...newStrategy.buyConditions, operator: e.target.value }
                          })}
                        >
                          <MenuItem value="ABOVE">Above</MenuItem>
                          <MenuItem value="BELOW">Below</MenuItem>
                          <MenuItem value="CROSSES_ABOVE">Crosses Above</MenuItem>
                          <MenuItem value="CROSSES_BELOW">Crosses Below</MenuItem>
                          <MenuItem value="EQUALS">Equals</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Value/Trigger"
                        value={newStrategy.buyConditions.value}
                        onChange={(e) => setNewStrategy({ 
                          ...newStrategy, 
                          buyConditions: { ...newStrategy.buyConditions, value: e.target.value }
                        })}
                        fullWidth
                        type="number"
                        helperText="Trigger point value"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Additional Buy Condition (Optional)"
                        value={newStrategy.buyConditions.additionalCondition}
                        onChange={(e) => setNewStrategy({ 
                          ...newStrategy, 
                          buyConditions: { ...newStrategy.buyConditions, additionalCondition: e.target.value }
                        })}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="e.g., Volume > 1M, Price > SMA(20)"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Sell Conditions */}
            {activeStep === 3 && (
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>Sell Exit Conditions</Typography>

                  <GuidelineBox title="Understanding Sell Conditions - When to Exit & Take Profit?" icon={<TrendingUp />}>
                    Selling at the right time is crucial! This tells your strategy when to sell stocks and lock in profits.<br/>
                    Example: "Sell RELIANCE when RSI goes above 70" - This means sell when stock is overbought (potentially expensive).
                  </GuidelineBox>

                  <GuidelineBox title="Beginner Sell Strategy Tips">
                    • <strong>Opposite of Buy:</strong> If you buy when RSI is below 30, sell when RSI is above 70<br/>
                    • <strong>Profit Target:</strong> Set a specific profit percentage (e.g., sell when 10% profit reached)<br/>
                    • <strong>Don't be Greedy:</strong> It's better to take smaller, consistent profits than wait for huge gains<br/>
                    • <strong>Time-based Exit:</strong> Sometimes sell after holding for a certain number of days
                  </GuidelineBox>

                  <GuidelineBox title="Example Sell Condition Setup">
                    <strong>Beginner Setup:</strong><br/>
                    • Indicator: RSI<br/>
                    • Condition: Above<br/>
                    • Value: 70<br/>
                    <strong>Meaning:</strong> "Sell when the stock is overbought (RSI above 70)"
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Indicator</InputLabel>
                        <Select
                          value={newStrategy.sellConditions.indicator}
                          label="Indicator"
                          onChange={(e) => setNewStrategy({ 
                            ...newStrategy, 
                            sellConditions: { ...newStrategy.sellConditions, indicator: e.target.value }
                          })}
                        >
                          <MenuItem value="RSI">RSI</MenuItem>
                          <MenuItem value="MACD">MACD</MenuItem>
                          <MenuItem value="SMA">Simple Moving Average</MenuItem>
                          <MenuItem value="EMA">Exponential Moving Average</MenuItem>
                          <MenuItem value="BOLLINGER">Bollinger Bands</MenuItem>
                          <MenuItem value="STOCHASTIC">Stochastic</MenuItem>
                          <MenuItem value="PRICE">Price</MenuItem>
                          <MenuItem value="PROFIT_TARGET">Profit Target</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Condition</InputLabel>
                        <Select
                          value={newStrategy.sellConditions.operator}
                          label="Condition"
                          onChange={(e) => setNewStrategy({ 
                            ...newStrategy, 
                            sellConditions: { ...newStrategy.sellConditions, operator: e.target.value }
                          })}
                        >
                          <MenuItem value="ABOVE">Above</MenuItem>
                          <MenuItem value="BELOW">Below</MenuItem>
                          <MenuItem value="CROSSES_ABOVE">Crosses Above</MenuItem>
                          <MenuItem value="CROSSES_BELOW">Crosses Below</MenuItem>
                          <MenuItem value="EQUALS">Equals</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Value/Trigger"
                        value={newStrategy.sellConditions.value}
                        onChange={(e) => setNewStrategy({ 
                          ...newStrategy, 
                          sellConditions: { ...newStrategy.sellConditions, value: e.target.value }
                        })}
                        fullWidth
                        type="number"
                        helperText="Trigger point value"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Additional Sell Condition (Optional)"
                        value={newStrategy.sellConditions.additionalCondition}
                        onChange={(e) => setNewStrategy({ 
                          ...newStrategy, 
                          sellConditions: { ...newStrategy.sellConditions, additionalCondition: e.target.value }
                        })}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="e.g., Hold for minimum 2 days, Volume drops below average"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Risk Management */}
            {activeStep === 4 && (
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>Risk Management Settings</Typography>

                  <GuidelineBox title="Why Risk Management is CRITICAL?" icon={<Warning />}>
                    <strong>This is the most important step!</strong> Risk management protects your money from big losses.<br/>
                    Even professional traders lose money on some trades - the key is to lose small and win big.
                  </GuidelineBox>

                  <GuidelineBox title="Stop Loss & Take Profit Explained (Very Important!)">
                    • <strong>Stop Loss:</strong> Maximum loss you're willing to take (Recommended: 3-5% for beginners)<br/>
                      - Example: 5% stop loss means if stock drops 5%, automatically sell to prevent bigger loss<br/><br/>
                    • <strong>Take Profit:</strong> Profit target where you automatically sell (Recommended: 8-12%)<br/>
                      - Example: 10% take profit means automatically sell when you make 10% profit<br/><br/>
                    • <strong>Risk-Reward Rule:</strong> Your take profit should be at least 2x your stop loss!
                  </GuidelineBox>

                  <GuidelineBox title="Beginner-Friendly Settings">
                    <strong>Conservative Approach (Recommended for beginners):</strong><br/>
                    • Stop Loss: 3-5% (Small losses)<br/>
                    • Take Profit: 8-12% (Decent profits)<br/>
                    • Entry Logic: AND (All conditions must be met = Safer)<br/>
                    • Exit Logic: OR (Any exit condition can trigger = Take profits quicker)
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Stop Loss"
                        value={newStrategy.stopLoss}
                        onChange={(e) => setNewStrategy({ ...newStrategy, stopLoss: e.target.value })}
                        fullWidth
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        helperText="Maximum loss percentage"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Take Profit"
                        value={newStrategy.takeProfit}
                        onChange={(e) => setNewStrategy({ ...newStrategy, takeProfit: e.target.value })}
                        fullWidth
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        helperText="Target profit percentage"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Entry Logic</InputLabel>
                        <Select
                          value={newStrategy.entryLogic}
                          label="Entry Logic"
                          onChange={(e) => setNewStrategy({ ...newStrategy, entryLogic: e.target.value })}
                        >
                          <MenuItem value="AND">All conditions must be met (AND)</MenuItem>
                          <MenuItem value="OR">Any condition can trigger (OR)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Exit Logic</InputLabel>
                        <Select
                          value={newStrategy.exitLogic}
                          label="Exit Logic"
                          onChange={(e) => setNewStrategy({ ...newStrategy, exitLogic: e.target.value })}
                        >
                          <MenuItem value="AND">All conditions must be met (AND)</MenuItem>
                          <MenuItem value="OR">Any condition can trigger (OR)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', 
                        
                        border: '1px solid #e0e0e0',
                        borderRadius: '16px'
                      }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#1F2937' }}>Strategy Summary:</Typography>
                        <Typography variant="body2" sx={{ color: '#374151' }}>• Name: {newStrategy.name || 'Not specified'}</Typography>
                        <Typography variant="body2" sx={{ color: '#374151' }}>• Symbols: {newStrategy.symbols || 'Not specified'}</Typography>
                        <Typography variant="body2" sx={{ color: '#374151' }}>• Buy: {newStrategy.buyConditions.indicator} {newStrategy.buyConditions.operator} {newStrategy.buyConditions.value}</Typography>
                        <Typography variant="body2" sx={{ color: '#374151' }}>• Sell: {newStrategy.sellConditions.indicator} {newStrategy.sellConditions.operator} {newStrategy.sellConditions.value}</Typography>
                        <Typography variant="body2" sx={{ color: '#374151' }}>• Risk: {newStrategy.stopLoss}% SL, {newStrategy.takeProfit}% TP</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={resetDialog}
            sx={{
              color: '#6B7280',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            disabled={activeStep === 0} 
            onClick={handleBack}
            sx={{
              color: '#6B7280',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
              '&:disabled': {
                color: '#9CA3AF',
              }
            }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleCreateStrategy}
              disabled={!newStrategy.name || !newStrategy.symbols}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: '#9CA3AF',
                  color: 'white',
                  transform: 'none'
                }
              }}
            >
              Create Strategy
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleNext}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Manual Trading Dialog */}
      <Dialog 
        open={tradeDialogOpen} 
        onClose={() => setTradeDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            
            border: '1px solid #e0e0e0',
            borderRadius: '16px'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PlayArrow sx={{ color: '#1F2937' }} />
            <Typography variant="h6" sx={{ color: '#1F2937' }}>
              Execute Manual Trade
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
              },
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            },
            '& .MuiFormControl-root': {
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
                '& .MuiSvgIcon-root': {
                  color: '#374151',
                },
              },
            },
          }}
        >
          {selectedStrategyId && (
            <Box sx={{ pt: 1 }}>
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <HelpOutline sx={{ color: '#374151' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1F2937' }}>
                      Manual Trading Guide
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      Manual trading means you're making the trade decision yourself, overriding your strategy's automatic signals. Only do this if you see a clear opportunity or need to exit a position urgently.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px'
                }}
              >
                <Typography variant="body2" sx={{ color: '#1F2937' }}>
                  <strong>Strategy:</strong> {strategies.find(s => s.id === selectedStrategyId)?.name}
                  <br />
                  <strong>Next Signal:</strong> {strategies.find(s => s.id === selectedStrategyId)?.nextSignal}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Symbol"
                    defaultValue="RELIANCE"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Action</InputLabel>
                    <Select 
                      defaultValue="BUY" 
                      label="Action"
                    >
                      <MenuItem value="BUY">Buy</MenuItem>
                      <MenuItem value="SELL">Sell</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Quantity"
                    type="number"
                    defaultValue="10"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Price"
                    type="number"
                    defaultValue="2485.50"
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Order Type</InputLabel>
                <Select defaultValue="MARKET" label="Order Type">
                  <MenuItem value="MARKET">Market Order</MenuItem>
                  <MenuItem value="LIMIT">Limit Order</MenuItem>
                  <MenuItem value="STOP_LOSS">Stop Loss</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px'
                }}
              >
                <Typography variant="body2" sx={{ color: '#1F2937' }}>
                  <strong>Risk Warning:</strong> Manual trading overrides strategy signals. 
                  Ensure you understand the market conditions before proceeding.
                </Typography>
              </Box>

              <Box sx={{ 
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', 
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                p: 2
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#1F2937' }}>Trade Summary:</Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>• Action: Buy 10 shares of RELIANCE</Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>• Price: ₹2,485.50 per share</Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>• Total Value: ₹24,855.00</Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>• Strategy: {strategies.find(s => s.id === selectedStrategyId)?.name}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setTradeDialogOpen(false)}
            sx={{
              color: '#6B7280',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('Executing manual trade for strategy:', selectedStrategyId);
              setTradeDialogOpen(false);
              // In real app, this would execute the trade via API
            }}
            startIcon={<PlayArrow />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                transform: 'translateY(-1px)',
              }
            }}
          >
            Execute Trade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Strategy Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedStrategyForDetails(null);
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Visibility sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Strategy Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStrategyForDetails && (() => {
            const strategy = selectedStrategyForDetails;
            if (!strategy) return null;
            
            return (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: 'white', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '16px'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Settings /> Strategy Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Name</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.name}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Type</Typography>
                            <Chip label={strategy.type} size="small" variant="outlined" />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                            <Chip 
                              label={strategy.status} 
                              color={getStatusColor(strategy.status) as any} 
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                            <Chip 
                              label={strategy.riskLevel} 
                              color={getRiskColor(strategy.riskLevel) as any} 
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Timeframe</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.timeframe}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Created</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.createdAt}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: 'white', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '16px'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BarChart /> Performance Metrics
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Total Return</Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: strategy.performance >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                              {strategy.performance >= 0 ? 
                                <TrendingUp sx={{ fontSize: 20 }} /> : 
                                <TrendingDown sx={{ fontSize: 20 }} />
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Total Trades</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.trades}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.winRate}%</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Auto Trading</Typography>
                            <Chip 
                              icon={strategy.autoTrade ? <AutoMode /> : <PanTool />}
                              label={strategy.autoTrade ? 'ENABLED' : 'DISABLED'} 
                              color={strategy.autoTrade ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Last Trade</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>{strategy.lastTrade}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card 
                      variant="outlined"
                      sx={{
                        background: 'white', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '16px'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp /> Current Signal Status
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          background: '#f8f9ff', 
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                            {strategy.nextSignal}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDetailsDialogOpen(false)}
            sx={{
              color: '#6B7280',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Strategy Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedStrategyForEdit(null);
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Edit sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Edit Strategy: {selectedStrategyForEdit?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
              },
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            },
            '& .MuiFormControl-root': {
              '& .MuiInputLabel-root': {
                color: '#374151',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: '2px',
                },
                color: '#1F2937',
                '& .MuiSvgIcon-root': {
                  color: '#374151',
                },
              },
            },
          }}
        >
          {selectedStrategyForEdit && (
            <Box sx={{ pt: 2 }}>
              <Card 
                variant="outlined"
                sx={{
                  background: 'white', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '16px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>
                    Edit Strategy Settings
                  </Typography>
                  
                  <GuidelineBox title="Strategy Editing" icon={<Info />}>
                    You can modify your strategy settings here. Changes will take effect immediately and may affect any active trades.
                  </GuidelineBox>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Strategy Name"
                        defaultValue={selectedStrategyForEdit.name}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Strategy Type</InputLabel>
                        <Select
                          defaultValue={selectedStrategyForEdit.type}
                          label="Strategy Type"
                        >
                          <MenuItem value="TECHNICAL">Technical Analysis</MenuItem>
                          <MenuItem value="FUNDAMENTAL">Fundamental Analysis</MenuItem>
                          {tierFeatures.customIndicators && <MenuItem value="AI_POWERED">AI-Powered</MenuItem>}
                          {tierFeatures.customIndicators && <MenuItem value="OPTIONS">Options Strategy</MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Timeframe</InputLabel>
                        <Select
                          defaultValue={selectedStrategyForEdit.timeframe}
                          label="Timeframe"
                        >
                          <MenuItem value="1M">1 Minute</MenuItem>
                          <MenuItem value="5M">5 Minutes</MenuItem>
                          <MenuItem value="15M">15 Minutes</MenuItem>
                          <MenuItem value="1H">1 Hour</MenuItem>
                          <MenuItem value="4H">4 Hours</MenuItem>
                          <MenuItem value="1D">1 Day</MenuItem>
                          <MenuItem value="1W">1 Week</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Risk Level</InputLabel>
                        <Select
                          defaultValue={selectedStrategyForEdit.riskLevel}
                          label="Risk Level"
                        >
                          <MenuItem value="LOW">Low Risk</MenuItem>
                          <MenuItem value="MEDIUM">Medium Risk</MenuItem>
                          <MenuItem value="HIGH">High Risk</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          defaultValue={selectedStrategyForEdit.status}
                          label="Status"
                        >
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="PAUSED">Paused</MenuItem>
                          <MenuItem value="STOPPED">Stopped</MenuItem>
                          <MenuItem value="BACKTESTING">Backtesting</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Auto Trading</InputLabel>
                        <Select
                          defaultValue={selectedStrategyForEdit.autoTrade ? 'true' : 'false'}
                          label="Auto Trading"
                        >
                          <MenuItem value="true">Enabled</MenuItem>
                          <MenuItem value="false">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedStrategyForEdit(null);
            }}
            sx={{
              color: '#6B7280',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              console.log('Saving strategy changes:', selectedStrategyForEdit);
              
              // Update the strategy in state (in real app, this would be API call)
              setStrategiesState(prevStrategies => 
                prevStrategies.map(strategy => 
                  strategy.id === selectedStrategyForEdit?.id 
                    ? { ...strategy, /* updated fields would go here */ }
                    : strategy
                )
              );
              
              setFeedbackMessage(`Strategy "${selectedStrategyForEdit?.name}" updated successfully!`);
              setTimeout(() => setFeedbackMessage(''), 3000);
              
              setEditDialogOpen(false);
              setSelectedStrategyForEdit(null);
            }}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                transform: 'translateY(-1px)',
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default Strategies;
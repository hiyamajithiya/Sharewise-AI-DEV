import React, { useState, useEffect, useCallback } from 'react';
import { useLiveMarketData } from '../hooks/useLiveMarketData';
import { useLocation } from 'react-router-dom';
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
  Card,
  CardContent,
  Divider,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  ShowChart,
  AccountBalance,
  Schedule,
  CheckCircle,
  Warning,
  WifiOff,
  Wifi,
  Refresh,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import { marketDataService, MarketQuote, OptionChainData, MarketDataAPI } from '../services/marketDataService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Trading: React.FC = () => {
  const location = useLocation();
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [orderAmount, setOrderAmount] = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [activeTab, setActiveTab] = useState(0);
  const [quickTradeMode, setQuickTradeMode] = useState(false);
  const [instrumentType, setInstrumentType] = useState('EQUITY');
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [foDialogOpen, setFoDialogOpen] = useState(false);
  const [selectedFoInstrument, setSelectedFoInstrument] = useState<any>(null);
  const [algoStrategy, setAlgoStrategy] = useState('');
  
  // Real-time data states
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [marketQuotes, setMarketQuotes] = useState<{ [symbol: string]: MarketQuote }>({});
  const [optionChainData, setOptionChainData] = useState<{ [underlying: string]: OptionChainData }>({});
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  
  // Get effective user (testing or actual)
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'BASIC';
  
  // Tier-based trading features (moved before useEffect)
  const getTierFeatures = (tier: string): {
    maxOrderValue: number;
    allowedOrderTypes: string[];
    signalsPerDay: number;
    advancedCharts: boolean;
    realTimeData: boolean;
    color: string;
  } => {
    switch (tier) {
      case 'BASIC':
        return {
          maxOrderValue: 10000,
          allowedOrderTypes: ['MARKET', 'LIMIT'],
          signalsPerDay: 5,
          advancedCharts: false,
          realTimeData: false,
          color: 'info'
        };
      case 'PRO':
        return {
          maxOrderValue: 50000,
          allowedOrderTypes: ['MARKET', 'LIMIT', 'STOP_LOSS', 'BRACKET'],
          signalsPerDay: 20,
          advancedCharts: true,
          realTimeData: true,
          color: 'success'
        };
      case 'ELITE':
        return {
          maxOrderValue: 200000,
          allowedOrderTypes: ['MARKET', 'LIMIT', 'STOP_LOSS', 'BRACKET', 'ALGO'],
          signalsPerDay: -1, // Unlimited
          advancedCharts: true,
          realTimeData: true,
          color: 'warning'
        };
      default:
        return getTierFeatures('BASIC');
    }
  };

  const tierFeatures = getTierFeatures(subscriptionTier);

  // Real-time data handlers
  const handleQuoteUpdate = useCallback((data: MarketQuote) => {
    setMarketQuotes(prev => ({
      ...prev,
      [data.symbol]: data
    }));
  }, []);

  const handleOptionChainUpdate = useCallback((data: OptionChainData) => {
    setOptionChainData(prev => ({
      ...prev,
      [data.underlying_symbol]: data
    }));
  }, []);

  const handleConnectionStatusChange = useCallback((status: string) => {
    setConnectionStatus(status);
  }, []);

  // Check URL parameters for Quick Trade mode
  const isQuickTradeUrl = new URLSearchParams(location.search).get('mode') === 'quick';
  
  useEffect(() => {
    if (isQuickTradeUrl) {
      setQuickTradeMode(true);
    }
  }, [isQuickTradeUrl]);

  // Initialize real-time connections
  useEffect(() => {
    if (!tierFeatures.realTimeData) return;

    // Subscribe to connection status
    const statusUnsubscribe = marketDataService.subscribeToConnectionStatus(handleConnectionStatusChange);

    // Subscribe to key symbols for real-time updates
    const symbolsToWatch = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'ICICIBANK'];
    const unsubscribeFunctions: (() => void)[] = [];

    symbolsToWatch.forEach(symbol => {
      const unsubscribe = marketDataService.subscribeToQuote(symbol, handleQuoteUpdate);
      unsubscribeFunctions.push(unsubscribe);
    });

    // Subscribe to option chains for NIFTY and BANKNIFTY
    const niftyOptionUnsubscribe = marketDataService.subscribeToOptionChain('NIFTY', handleOptionChainUpdate);
    const bankniftyOptionUnsubscribe = marketDataService.subscribeToOptionChain('BANKNIFTY', handleOptionChainUpdate);

    return () => {
      statusUnsubscribe();
      unsubscribeFunctions.forEach(unsub => unsub());
      niftyOptionUnsubscribe();
      bankniftyOptionUnsubscribe();
    };
  }, [tierFeatures.realTimeData, handleQuoteUpdate, handleOptionChainUpdate, handleConnectionStatusChange]);

  // Load initial quotes
  useEffect(() => {
    const loadInitialQuotes = async () => {
      setIsLoadingQuotes(true);
      try {
        const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'];
        const quotes = await MarketDataAPI.getBulkQuotes(symbols);
        setMarketQuotes(quotes);
      } catch (error) {
        console.error('Error loading initial quotes:', error);
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    loadInitialQuotes();
  }, []);

  // Get real-time price for a symbol
  const getRealTimePrice = (symbol: string) => {
    const quote = marketQuotes[symbol];
    return quote ? quote.last_price : null;
  };

  // Get real-time change for a symbol
  const getRealTimeChange = (symbol: string) => {
    const quote = marketQuotes[symbol];
    return quote ? {
      change: quote.change,
      changePercent: quote.change_percent
    } : null;
  };

  // Format change display
  const formatChangeDisplay = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <Wifi color="success" />, color: 'success', text: 'Live Data' };
      case 'connecting':
        return { icon: <CircularProgress size={20} />, color: 'warning', text: 'Connecting...' };
      case 'disconnected':
        return { icon: <WifiOff color="error" />, color: 'error', text: 'Disconnected' };
      case 'error':
        return { icon: <WifiOff color="error" />, color: 'error', text: 'Connection Error' };
      default:
        return { icon: <WifiOff />, color: 'default', text: 'No Connection' };
    }
  };

  // TODO: Load trading signals from API based on tier
  const mockSignals = [
    {
      id: 1,
      symbol: 'RELIANCE',
      instrument_type: 'EQUITY',
      type: 'BUY',
      price: getRealTimePrice('RELIANCE') || 2485.50,
      target: 2650.00,
      stopLoss: 2350.00,
      confidence: 87,
      status: 'ACTIVE',
      time: '09:30 AM',
      change: getRealTimeChange('RELIANCE') ? formatChangeDisplay(getRealTimeChange('RELIANCE')!.change, getRealTimeChange('RELIANCE')!.changePercent) : '+2.4%',
      tier: 'BASIC'
    },
    {
      id: 2,
      symbol: 'NIFTY24DEC19000CE',
      instrument_type: 'OPTIONS',
      underlying_symbol: 'NIFTY',
      strike_price: 19000,
      option_type: 'CALL',
      expiry_date: '2024-12-26',
      type: 'BUY',
      price: 125.50,
      target: 180.00,
      stopLoss: 90.00,
      confidence: 89,
      status: 'ACTIVE',
      time: '09:45 AM',
      change: '+5.2%',
      tier: 'PRO'
    },
    {
      id: 3,
      symbol: 'BANKNIFTY24DEC48000FUT',
      instrument_type: 'FUTURES',
      underlying_symbol: 'BANKNIFTY',
      expiry_date: '2024-12-26',
      type: 'SELL',
      price: 48250.75,
      target: 47800.00,
      stopLoss: 48600.00,
      confidence: 85,
      status: 'ACTIVE',
      time: '10:30 AM',
      change: '-1.2%',
      tier: 'PRO'
    },
    {
      id: 4,
      symbol: 'NIFTY24DEC18500PE',
      instrument_type: 'OPTIONS',
      underlying_symbol: 'NIFTY',
      strike_price: 18500,
      option_type: 'PUT',
      expiry_date: '2024-12-26',
      type: 'SELL',
      price: 95.25,
      target: 60.00,
      stopLoss: 140.00,
      confidence: 92,
      status: 'ACTIVE',
      time: '11:00 AM',
      change: '+8.5%',
      tier: 'ELITE'
    },
  ];

  // Filter signals based on user tier
  const availableSignals = mockSignals.filter(signal => {
    if (subscriptionTier === 'BASIC') return signal.tier === 'BASIC';
    if (subscriptionTier === 'PRO') return ['BASIC', 'PRO'].includes(signal.tier);
    return true; // ELITE gets all signals
  });

  // Mock active orders
  const activeOrders = [
    {
      id: 1,
      symbol: 'RELIANCE',
      type: 'BUY',
      quantity: 10,
      price: 2485.50,
      status: 'EXECUTED',
      time: '09:45 AM',
      pnl: '+₹1,250'
    },
    {
      id: 2,
      symbol: 'TCS',
      type: 'SELL',
      quantity: 5,
      price: 3245.75,
      status: 'PENDING',
      time: '10:30 AM',
      pnl: '₹0'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'TRIGGERED': return 'primary';
      case 'PENDING': return 'warning';
      case 'EXECUTED': return 'info';
      default: return 'default';
    }
  };

  // TODO: Load F&O chain data from API
  // Get option chain data (real-time if available, fallback to mock)
  const getOptionChainForUnderlying = (underlying: string) => {
    const realTimeData = optionChainData[underlying];
    if (realTimeData && realTimeData.strikes) {
      // Convert real-time data to display format
      return Object.entries(realTimeData.strikes).map(([strike, data]: [string, any]) => ({
        strike: parseInt(strike),
        callPrice: data.call?.ltp || data.call?.price || 0,
        putPrice: data.put?.ltp || data.put?.price || 0,
        callOI: data.call?.oi || data.call?.open_interest || 0,
        putOI: data.put?.oi || data.put?.open_interest || 0
      }));
    }
    
    // Fallback to mock data
    const mockOptionChain = {
    'NIFTY': [
      { strike: 18500, callPrice: 850.25, putPrice: 45.75, callOI: 2500000, putOI: 1800000 },
      { strike: 19000, callPrice: 425.50, putPrice: 95.25, callOI: 3200000, putOI: 2100000 },
      { strike: 19500, callPrice: 185.75, putPrice: 245.50, callOI: 2800000, putOI: 2950000 }
    ],
    'BANKNIFTY': [
      { strike: 47000, callPrice: 1250.50, putPrice: 85.25, callOI: 850000, putOI: 650000 },
      { strike: 48000, callPrice: 675.75, putPrice: 185.50, callOI: 1200000, putOI: 950000 },
      { strike: 49000, callPrice: 325.25, putPrice: 425.75, callOI: 980000, putOI: 1150000 }
    ]
    };
    return mockOptionChain[underlying as keyof typeof mockOptionChain] || [];
  };

  const mockFuturesChain = {
    'NIFTY': [
      { symbol: 'NIFTY24DEC', price: 19125.50, expiry: '2024-12-26', oi: 15500000 },
      { symbol: 'NIFTY25JAN', price: 19155.75, expiry: '2025-01-30', oi: 8750000 },
      { symbol: 'NIFTY25FEB', price: 19185.25, expiry: '2025-02-27', oi: 4200000 }
    ],
    'BANKNIFTY': [
      { symbol: 'BANKNIFTY24DEC', price: 48125.25, expiry: '2024-12-26', oi: 5500000 },
      { symbol: 'BANKNIFTY25JAN', price: 48195.50, expiry: '2025-01-30', oi: 3200000 },
      { symbol: 'BANKNIFTY25FEB', price: 48265.75, expiry: '2025-02-27', oi: 1800000 }
    ]
  };

  const handlePlaceOrder = (signal: any) => {
    console.log('Placing order:', { signal, amount: orderAmount, type: orderType });
    // In real app, this would make API call
    const instrumentDisplay = signal.instrument_type === 'OPTIONS' 
      ? `${signal.underlying_symbol} ${signal.strike_price} ${signal.option_type}`
      : signal.instrument_type === 'FUTURES'
      ? `${signal.underlying_symbol} FUT`
      : signal.symbol;
    alert(`Order placed for ${instrumentDisplay} - ${signal.type} at ₹${signal.price}`);
    setSelectedSignal(null);
    setOrderAmount('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFoInstrumentSelect = (instrument: any) => {
    setSelectedFoInstrument(instrument);
    setFoDialogOpen(true);
  };

  const renderInstrumentSymbol = (signal: any) => {
    if (signal.instrument_type === 'OPTIONS') {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {signal.underlying_symbol} {signal.strike_price} {signal.option_type}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Exp: {new Date(signal.expiry_date).toLocaleDateString()}
          </Typography>
        </Box>
      );
    } else if (signal.instrument_type === 'FUTURES') {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {signal.underlying_symbol} FUT
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Exp: {new Date(signal.expiry_date).toLocaleDateString()}
          </Typography>
        </Box>
      );
    } else {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {signal.symbol}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            EQUITY
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1F2937' }}>
              {isQuickTradeUrl ? 'Quick Trade Dashboard ⚡' : 'Trading Dashboard 📈'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              {isTestingMode && selectedUser
                ? `Testing ${isQuickTradeUrl ? 'quick trade' : 'trading'} interface for ${selectedUser.role} role - ${subscriptionTier} tier`
                : isQuickTradeUrl 
                  ? `Execute trades instantly with your ${subscriptionTier} quick trading interface`
                  : `Your ${subscriptionTier} trading interface with advanced tools`
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isQuickTradeUrl && (
              <Button
                variant={quickTradeMode ? "contained" : "outlined"}
                onClick={() => setQuickTradeMode(!quickTradeMode)}
                sx={{ 
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  ...(quickTradeMode && {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                    }
                  })
                }}
              >
                ⚡ Quick Trade
              </Button>
            )}
            <Chip 
              label={`${subscriptionTier} Plan`} 
              color={tierFeatures.color as any} 
              sx={{ fontWeight: 600, fontSize: '0.875rem' }} 
            />
          </Box>
        </Box>
        <Divider />
      </Box>

      {/* Tier Limitations Alert */}
      {subscriptionTier === 'BASIC' && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '16px',
            color: '#1F2937',
            '& .MuiAlert-icon': {
              color: '#2196f3'
            }
          }}
        >
          <Typography variant="body2" sx={{ color: '#1F2937' }}>
            <strong>Basic Plan:</strong> You have access to {tierFeatures.signalsPerDay} signals per day, 
            max order value ₹{tierFeatures.maxOrderValue.toLocaleString()}, and basic order types.
            <strong> Upgrade to Pro or Elite for more features!</strong>
          </Typography>
        </Alert>
      )}

      {/* Quick Trade Interface */}
      {quickTradeMode && (
        <Paper sx={{ 
          p: 4, 
          mb: 4,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '2px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{
              p: 2,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              mr: 2
            }}>
              <PlayArrow sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937' }}>
              Quick Trade Execution
            </Typography>
          </Box>

          {/* Signal Selection - Horizontal Layout */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
              Active Signals for Quick Trading
            </Typography>
            <Grid container spacing={2}>
              {mockSignals.slice(0, 3).map((signal: any, index: number) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Card sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedSignal?.id === signal.id ? '2px solid #667eea' : '1px solid #e2e8f0',
                    background: selectedSignal?.id === signal.id ? 'rgba(102, 126, 234, 0.1)' : 'white',
                    minHeight: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                  onClick={() => setSelectedSignal(signal)}
                  >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1F2937' }}>
                          {signal.symbol}
                        </Typography>
                        <Chip 
                          label={signal.type} 
                          size="small"
                          color={signal.type === 'BUY' ? 'success' : 'error'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                        Entry: ₹{signal.price}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                        Target: ₹{signal.target}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={`${signal.confidence}% Confidence`}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10B981',
                            fontWeight: 600 
                          }}
                        />
                        <Typography variant="caption" sx={{ color: signal.type === 'BUY' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                          {signal.type === 'BUY' ? '↗' : '↘'} {signal.type}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

          {/* Extended Signals Table - Full Width */}
          <Box sx={{ mb: 4 }}>
            <Card sx={{ p: 3, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                  All Trading Signals
                </Typography>
                <Badge badgeContent={mockSignals.filter(s => s.status === 'ACTIVE').length} color="primary">
                  <ShowChart sx={{ color: '#667eea' }} />
                </Badge>
              </Box>
              
              <TableContainer sx={{ maxHeight: 450, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Symbol</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Target</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Stop Loss</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Confidence</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockSignals.map((signal: any) => (
                      <TableRow 
                        key={signal.id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedSignal?.id === signal.id ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                          '&:hover': { 
                            backgroundColor: selectedSignal?.id === signal.id ? 'rgba(102, 126, 234, 0.15)' : 'rgba(0, 0, 0, 0.04)' 
                          }
                        }}
                        onClick={() => setSelectedSignal(signal)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {signal.symbol}
                            </Typography>
                            {signal.instrument_type && (
                              <Chip 
                                label={signal.instrument_type} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1, height: '18px', fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={signal.type} 
                            size="small"
                            color={signal.type === 'BUY' ? 'success' : 'error'}
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            ₹{typeof signal.price === 'number' ? signal.price.toFixed(2) : signal.price}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
                            {signal.change || '+2.4%'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                            ₹{typeof signal.target === 'number' ? signal.target.toFixed(2) : signal.target}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                            ₹{typeof signal.stopLoss === 'number' ? signal.stopLoss.toFixed(2) : signal.stopLoss}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, mr: 1 }}>
                              {signal.confidence}%
                            </Typography>
                            <Box 
                              sx={{ 
                                width: 40, 
                                height: 4, 
                                backgroundColor: '#E5E7EB', 
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${signal.confidence}%`, 
                                  height: '100%', 
                                  backgroundColor: signal.confidence >= 80 ? '#10B981' : signal.confidence >= 60 ? '#F59E0B' : '#EF4444',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={signal.status} 
                            size="small"
                            color={signal.status === 'ACTIVE' ? 'success' : 'default'}
                            variant={signal.status === 'ACTIVE' ? 'filled' : 'outlined'}
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSignal(signal);
                            }}
                            sx={{ 
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.65rem',
                              borderColor: selectedSignal?.id === signal.id ? '#667eea' : '#d1d5db',
                              color: selectedSignal?.id === signal.id ? '#667eea' : '#6b7280',
                              '&:hover': { 
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)'
                              }
                            }}
                          >
                            {selectedSignal?.id === signal.id ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Summary Row */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mt: 2, 
                pt: 2, 
                borderTop: '1px solid #e2e8f0' 
              }}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  Total: {mockSignals.length} signals | Active: {mockSignals.filter(s => s.status === 'ACTIVE').length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600 }}>
                  Avg. Confidence: {Math.round(mockSignals.reduce((acc, s) => acc + s.confidence, 0) / mockSignals.length)}%
                </Typography>
              </Box>
            </Card>
          </Box>

          {/* Quick Trade Execution Panel - Below Table */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
                  Execute Trade
                </Typography>
                
                {selectedSignal ? (
                  <Box>
                    <Box sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: '8px', 
                      background: 'rgba(102, 126, 234, 0.05)',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                        Selected: {selectedSignal.symbol}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {selectedSignal.type} at ₹{selectedSignal.price}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#6B7280' }}>Order Type</InputLabel>
                          <Select
                            value={orderType}
                            label="Order Type"
                            onChange={(e) => setOrderType(e.target.value)}
                            sx={{
                              color: '#1F2937',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#d1d5db'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea'
                              }
                            }}
                          >
                            {tierFeatures.allowedOrderTypes.map(type => (
                              <MenuItem key={type} value={type} sx={{ color: '#1F2937' }}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Investment Amount"
                          value={orderAmount}
                          onChange={(e) => setOrderAmount(e.target.value)}
                          type="number"
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              color: '#1F2937',
                              '& fieldset': {
                                borderColor: '#d1d5db'
                              },
                              '&:hover fieldset': {
                                borderColor: '#667eea'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea'
                              }
                            }
                          }}
                          InputLabelProps={{ style: { color: '#6B7280' } }}
                          FormHelperTextProps={{ style: { color: '#6B7280' } }}
                          helperText={`Max: ₹${tierFeatures.maxOrderValue.toLocaleString()}`}
                          InputProps={{
                            startAdornment: <Typography sx={{ color: '#6B7280' }}>₹</Typography>,
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Algorithm Strategy Selection - Only for ALGO order type */}
                    {orderType === 'ALGO' && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#6B7280' }}>Algorithm Strategy</InputLabel>
                          <Select
                            value={algoStrategy}
                            label="Algorithm Strategy"
                            onChange={(e) => setAlgoStrategy(e.target.value)}
                            sx={{
                              color: '#1F2937',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#d1d5db'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea'
                              }
                            }}
                          >
                            <MenuItem value="TWAP" sx={{ color: '#1F2937' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>TWAP (Time Weighted Average Price)</Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Executes orders over time to minimize market impact</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="VWAP" sx={{ color: '#1F2937' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>VWAP (Volume Weighted Average Price)</Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Matches volume patterns for optimal execution</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="ICEBERG" sx={{ color: '#1F2937' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Iceberg Strategy</Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Hides large orders by showing small portions</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="IMPLEMENTATION_SHORTFALL" sx={{ color: '#1F2937' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Implementation Shortfall</Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Balances market impact vs timing risk</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="MOMENTUM" sx={{ color: '#1F2937' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Momentum Strategy</Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Follows price momentum for execution timing</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>

                        {/* Algorithm Parameters */}
                        {algoStrategy && (
                          <Box sx={{ mt: 2, p: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                              Algorithm Parameters
                            </Typography>
                            <Grid container spacing={2}>
                              {algoStrategy === 'TWAP' && (
                                <>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Duration (minutes)"
                                      type="number"
                                      defaultValue="30"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Slice Size (%)"
                                      type="number"
                                      defaultValue="10"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                </>
                              )}
                              {algoStrategy === 'VWAP' && (
                                <>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Participation Rate (%)"
                                      type="number"
                                      defaultValue="20"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Max Volume (%)"
                                      type="number"
                                      defaultValue="50"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                </>
                              )}
                              {algoStrategy === 'ICEBERG' && (
                                <>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Visible Quantity"
                                      type="number"
                                      defaultValue="100"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={6}>
                                    <TextField
                                      fullWidth
                                      label="Variance (%)"
                                      type="number"
                                      defaultValue="20"
                                      size="small"
                                      InputLabelProps={{ style: { color: '#6B7280' } }}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          color: '#1F2937',
                                          '& fieldset': { borderColor: '#d1d5db' },
                                          '&:hover fieldset': { borderColor: '#667eea' },
                                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                                        }
                                      }}
                                    />
                                  </Grid>
                                </>
                              )}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={() => {
                        // Handle trade execution
                        if (orderType === 'ALGO') {
                          alert(`Launching ${algoStrategy || 'Algorithm'} strategy for ${selectedSignal.symbol} ${selectedSignal.type} with ₹${orderAmount}`);
                        } else {
                          alert(`Executing ${selectedSignal.type} order for ${selectedSignal.symbol} with ₹${orderAmount}`);
                        }
                      }}
                      disabled={!orderAmount || parseInt(orderAmount) > tierFeatures.maxOrderValue || (orderType === 'ALGO' && !algoStrategy)}
                      sx={{
                        mt: 3,
                        py: 1.5,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        background: orderType === 'ALGO' 
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: orderType === 'ALGO' 
                            ? 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)'
                            : 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: orderType === 'ALGO' 
                            ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                            : '0 4px 12px rgba(102, 126, 234, 0.4)',
                        },
                        '&:disabled': {
                          background: '#9CA3AF',
                          color: 'white'
                        }
                      }}
                    >
                      {orderType === 'ALGO' 
                        ? `🤖 Launch ${algoStrategy || 'Algorithm'} Strategy`
                        : `Execute ${selectedSignal.type} Order`
                      }
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Select a signal to execute trade
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Trading Summary & Stats */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
                  Trading Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, background: '#f8fafc', borderRadius: '8px' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                        {mockSignals.filter(s => s.status === 'ACTIVE').length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Active Signals
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, background: '#f8fafc', borderRadius: '8px' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                        {Math.round(mockSignals.reduce((acc, s) => acc + s.confidence, 0) / mockSignals.length)}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Avg. Confidence
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, background: '#f8fafc', borderRadius: '8px' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                        ₹{tierFeatures.maxOrderValue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Max Order Value
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, background: '#f8fafc', borderRadius: '8px' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                        {subscriptionTier}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Plan Tier
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {selectedSignal && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    background: 'rgba(102, 126, 234, 0.05)', 
                    border: '1px solid rgba(102, 126, 234, 0.2)', 
                    borderRadius: '8px' 
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                      Selected Signal Details
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Target: ₹{selectedSignal.target}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Stop Loss: ₹{selectedSignal.stopLoss}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Confidence: {selectedSignal.confidence}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Status: {selectedSignal.status}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Show message when Quick Trade is not active */}
      {!quickTradeMode && (
        <Paper sx={{ 
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '2px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          <PlayArrow sx={{ fontSize: 64, color: '#667eea', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 2 }}>
            Quick Trade Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 4 }}>
            Enable Quick Trade mode to access instant signal execution and advanced trading features.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setQuickTradeMode(true)}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            ⚡ Enable Quick Trade
          </Button>
        </Paper>
      )}

      {/* F&O Trading Dialog */}
      <Dialog 
        open={foDialogOpen} 
        onClose={() => setFoDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            color: 'white'
          }
        }}
        BackdropProps={{
          sx: {
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#1F2937' }}>
          {selectedFoInstrument?.type === 'FUTURES' 
            ? `Trade ${selectedFoInstrument?.symbol}` 
            : `Trade ${selectedFoInstrument?.underlying} ${selectedFoInstrument?.strike} ${selectedFoInstrument?.type}`
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantity (Lots)"
                  type="number"
                  defaultValue="1"
                  size="small"
                  InputLabelProps={{ style: { color: '#6B7280' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#1F2937',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255,255,255,0.8)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  defaultValue={selectedFoInstrument?.price}
                  size="small"
                  InputLabelProps={{ style: { color: '#6B7280' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#1F2937',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255,255,255,0.8)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#6B7280' }}>Order Type</InputLabel>
                  <Select 
                    defaultValue="MARKET" 
                    label="Order Type"
                    sx={{
                      color: '#1F2937',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.8)'
                      }
                    }}
                  >
                    <MenuItem value="MARKET" sx={{ color: 'black' }}>Market</MenuItem>
                    <MenuItem value="LIMIT" sx={{ color: 'black' }}>Limit</MenuItem>
                    <MenuItem value="SL" sx={{ color: 'black' }}>Stop Loss</MenuItem>
                    <MenuItem value="BRACKET" sx={{ color: 'black' }}>Bracket</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#6B7280' }}>Product Type</InputLabel>
                  <Select 
                    defaultValue="INTRADAY" 
                    label="Product Type"
                    sx={{
                      color: '#1F2937',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.8)'
                      }
                    }}
                  >
                    <MenuItem value="INTRADAY" sx={{ color: 'black' }}>Intraday (MIS)</MenuItem>
                    <MenuItem value="DELIVERY" sx={{ color: 'black' }}>Normal (NRML)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Margin Information */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: '8px' 
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#1F2937' }}>
                    Margin Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>Required Margin:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>₹25,000</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>Available Balance:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>₹1,60,000</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFoDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => {
              alert(`F&O Order placed successfully!`);
              setFoDialogOpen(false);
            }}
          >
            Buy
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              alert(`F&O Order placed successfully!`);
              setFoDialogOpen(false);
            }}
          >
            Sell
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default Trading;
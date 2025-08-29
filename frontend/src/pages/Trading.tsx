import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [orderAmount, setOrderAmount] = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [activeTab, setActiveTab] = useState(0);
  const [instrumentType, setInstrumentType] = useState('EQUITY');
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [foDialogOpen, setFoDialogOpen] = useState(false);
  const [selectedFoInstrument, setSelectedFoInstrument] = useState<any>(null);
  
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

  // Mock trading signals based on tier with F&O instruments (enhanced with real-time data)
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

  // Mock F&O chain data
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
              Trading Dashboard 📈
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              {isTestingMode && selectedUser
                ? `Testing trading interface for ${selectedUser.role} role - ${subscriptionTier} tier`
                : `Your ${subscriptionTier} trading interface with advanced tools`
              }
            </Typography>
          </Box>
          <Chip 
            label={`${subscriptionTier} Plan`} 
            color={tierFeatures.color as any} 
            sx={{ fontWeight: 600, fontSize: '0.875rem' }} 
          />
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

      {/* Trading Tabs */}
      <Paper sx={{ 
        mb: 3,
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="trading tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#6B7280',
              '&.Mui-selected': {
                color: '#667eea'
              },
              '&:hover': {
                color: '#374151'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea'
            }
          }}
        >
          <Tab label="All Signals" />
          <Tab label="Options Chain" />
          <Tab label="Futures" />
          <Tab label="F&O Positions" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* Trading Signals */}
        <Grid item xs={12} lg={8}>
          <TabPanel value={activeTab} index={0}>
            <Paper sx={{ 
              p: 3,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Live Trading Signals
                  <Badge badgeContent={availableSignals.length} color="primary" sx={{ ml: 2 }}>
                    <ShowChart />
                  </Badge>
                </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {/* Connection Status Indicator */}
                <Chip
                  icon={getConnectionStatusDisplay().icon}
                  label={getConnectionStatusDisplay().text}
                  color={getConnectionStatusDisplay().color as any}
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  startIcon={isLoadingQuotes ? <CircularProgress size={16} /> : <Refresh />}
                  size="small"
                  onClick={async () => {
                    setIsLoadingQuotes(true);
                    try {
                      const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'];
                      const quotes = await MarketDataAPI.getBulkQuotes(symbols);
                      setMarketQuotes(prev => ({ ...prev, ...quotes }));
                    } catch (error) {
                      console.error('Error refreshing quotes:', error);
                    } finally {
                      setIsLoadingQuotes(false);
                    }
                  }}
                  disabled={isLoadingQuotes}
                >
                  Refresh Data
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    if (connectionStatus !== 'connected') {
                      marketDataService.reconnect();
                    }
                  }}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connected' ? 'Connected' : 'Reconnect'}
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Symbol</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Price</strong></TableCell>
                    <TableCell><strong>Target</strong></TableCell>
                    <TableCell><strong>Stop Loss</strong></TableCell>
                    <TableCell><strong>Confidence</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableSignals.map((signal) => (
                    <TableRow key={signal.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1 }}>
                            {renderInstrumentSymbol(signal)}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {signal.change}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={signal.type} 
                          color={signal.type === 'BUY' ? 'success' : 'error'} 
                          size="small"
                          icon={signal.type === 'BUY' ? <TrendingUp /> : <TrendingDown />}
                        />
                      </TableCell>
                      <TableCell>₹{signal.price.toLocaleString()}</TableCell>
                      <TableCell>₹{signal.target.toLocaleString()}</TableCell>
                      <TableCell>₹{signal.stopLoss.toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {signal.confidence}%
                          </Typography>
                          {signal.confidence > 85 && <CheckCircle color="success" sx={{ ml: 1, fontSize: 16 }} />}
                          {signal.confidence < 80 && <Warning color="warning" sx={{ ml: 1, fontSize: 16 }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={signal.status} 
                          color={getStatusColor(signal.status) as any} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setSelectedSignal(signal)}
                          disabled={signal.status !== 'ACTIVE'}
                        >
                          {signal.status === 'ACTIVE' ? 'Trade' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

              {availableSignals.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <ShowChart sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6">No signals available for your tier</Typography>
                  <Typography variant="body2">Upgrade your plan to access more trading signals</Typography>
                </Box>
              )}
            </Paper>
          </TabPanel>

          {/* Options Chain Tab */}
          <TabPanel value={activeTab} index={1}>
            <Paper sx={{ 
              p: 3,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                  Options Chain
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Underlying</InputLabel>
                    <Select
                      value={selectedUnderlying}
                      label="Underlying"
                      onChange={(e) => setSelectedUnderlying(e.target.value)}
                      sx={{
                        color: '#1F2937',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d0d0d0'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      <MenuItem value="NIFTY">NIFTY</MenuItem>
                      <MenuItem value="BANKNIFTY">BANKNIFTY</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Expiry Date"
                    type="date"
                    value={selectedExpiry}
                    onChange={(e) => setSelectedExpiry(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true, style: { color: '#6B7280' } }}
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
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Call OI</strong></TableCell>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Call Price</strong></TableCell>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Strike</strong></TableCell>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Put Price</strong></TableCell>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Put OI</strong></TableCell>
                      <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getOptionChainForUnderlying(selectedUnderlying).map((option, index) => (
                      <TableRow 
                        key={index} 
                        hover
                        sx={{
                          '& .MuiTableCell-root': {
                            color: '#374151',
                            borderBottom: '1px solid #e2e8f0'
                          },
                          '&:hover': {
                            backgroundColor: '#f8fafc'
                          }
                        }}
                      >
                        <TableCell align="center" sx={{ color: '#374151' }}>{(option.callOI / 100000).toFixed(1)}L</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleFoInstrumentSelect({
                              type: 'CALL',
                              strike: option.strike,
                              price: option.callPrice,
                              underlying: selectedUnderlying
                            })}
                            sx={{ color: 'success.main' }}
                          >
                            ₹{option.callPrice}
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1F2937' }}>
                            {option.strike}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleFoInstrumentSelect({
                              type: 'PUT',
                              strike: option.strike,
                              price: option.putPrice,
                              underlying: selectedUnderlying
                            })}
                            sx={{ color: 'error.main' }}
                          >
                            ₹{option.putPrice}
                          </Button>
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>{(option.putOI / 100000).toFixed(1)}L</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button size="small" variant="outlined" color="success">
                              Buy Call
                            </Button>
                            <Button size="small" variant="outlined" color="error">
                              Buy Put
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* Futures Tab */}
          <TabPanel value={activeTab} index={2}>
            <Paper sx={{ 
              p: 3,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Futures Chain
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Symbol</strong></TableCell>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Price</strong></TableCell>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Expiry</strong></TableCell>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Open Interest</strong></TableCell>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(mockFuturesChain).flatMap(([underlying, contracts]) =>
                      contracts.map((contract, index) => (
                        <TableRow 
                          key={`${underlying}-${index}`} 
                          hover
                          sx={{
                            '& .MuiTableCell-root': {
                              color: '#374151',
                              borderBottom: '1px solid #e2e8f0'
                            },
                            '&:hover': {
                              backgroundColor: '#f8fafc'
                            }
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {contract.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell>₹{contract.price.toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(contract.expiry).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{(contract.oi / 100000).toFixed(1)}L</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleFoInstrumentSelect({
                                  type: 'FUTURES',
                                  symbol: contract.symbol,
                                  price: contract.price,
                                  underlying: underlying
                                })}
                              >
                                Buy
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handleFoInstrumentSelect({
                                  type: 'FUTURES',
                                  symbol: contract.symbol,
                                  price: contract.price,
                                  underlying: underlying
                                })}
                              >
                                Sell
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* F&O Positions Tab */}
          <TabPanel value={activeTab} index={3}>
            <Paper sx={{ 
              p: 3,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                F&O Positions
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Symbol</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Qty</strong></TableCell>
                      <TableCell><strong>Avg Price</strong></TableCell>
                      <TableCell><strong>LTP</strong></TableCell>
                      <TableCell><strong>P&L</strong></TableCell>
                      <TableCell><strong>Days to Expiry</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>NIFTY24DEC19000CE</TableCell>
                      <TableCell>
                        <Chip label="CALL" color="success" size="small" />
                      </TableCell>
                      <TableCell>+50</TableCell>
                      <TableCell>₹125.50</TableCell>
                      <TableCell>₹140.75</TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                          +₹762.50 (12.15%)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>15</TableCell>
                    </TableRow>
                    <TableRow sx={{
                      '& .MuiTableCell-root': {
                        color: '#374151',
                        borderBottom: '1px solid #e2e8f0'
                      }
                    }}>
                      <TableCell sx={{ color: '#1F2937' }}>BANKNIFTY24DEC48000PE</TableCell>
                      <TableCell>
                        <Chip label="PUT" color="error" size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#1F2937' }}>-25</TableCell>
                      <TableCell sx={{ color: '#1F2937' }}>₹180.25</TableCell>
                      <TableCell sx={{ color: '#1F2937' }}>₹165.50</TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                          +₹368.75 (8.17%)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>15</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ 
                mt: 3, 
                p: 2, 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px' 
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Total P&L</Typography>
                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                      +₹1,131.25
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Margin Used</Typography>
                    <Typography variant="h6" sx={{ color: '#1F2937' }}>₹40,000</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Available Margin</Typography>
                    <Typography variant="h6" sx={{ color: '#1F2937' }}>₹1,60,000</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </TabPanel>
        </Grid>

        {/* Trading Panel & Active Orders */}
        <Grid item xs={12} lg={4}>
          {/* Order Placement Panel */}
          {selectedSignal && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Place Order - {selectedSignal.symbol}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Signal: {selectedSignal.type} at ₹{selectedSignal.price}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Target: ₹{selectedSignal.target} | Stop Loss: ₹{selectedSignal.stopLoss}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Order Amount (₹)"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  type="number"
                  size="small"
                  fullWidth
                  helperText={`Max: ₹${tierFeatures.maxOrderValue.toLocaleString()}`}
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                  FormHelperTextProps={{ style: { color: 'rgba(255,255,255,0.6)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
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

                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Order Type</InputLabel>
                  <Select
                    value={orderType}
                    label="Order Type"
                    onChange={(e) => setOrderType(e.target.value)}
                    sx={{
                      color: 'white',
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
                    {tierFeatures.allowedOrderTypes.map((type: string) => (
                      <MenuItem key={type} value={type} sx={{ color: 'black' }}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => handlePlaceOrder(selectedSignal)}
                    disabled={!orderAmount || parseInt(orderAmount) > tierFeatures.maxOrderValue}
                    fullWidth
                  >
                    Place Order
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedSignal(null)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Active Orders */}
          <Paper sx={{ 
            p: 3,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Active Orders
              <Badge badgeContent={activeOrders.length} color="primary" sx={{ ml: 1 }}>
                <AccountBalance />
              </Badge>
            </Typography>

            {activeOrders.map((order) => (
              <Card key={order.id} sx={{ 
                mb: 2, 
                background: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '12px' 
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                      {order.symbol}
                    </Typography>
                    <Chip 
                      label={order.status} 
                      color={getStatusColor(order.status) as any} 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {order.type} {order.quantity} @ ₹{order.price.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {order.time}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: order.pnl.includes('+') ? 'success.main' : 'text.secondary' 
                      }}
                    >
                      {order.pnl}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {activeOrders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3, color: 'rgba(255,255,255,0.7)' }}>
                <Schedule sx={{ fontSize: 36, mb: 1, color: 'rgba(255,255,255,0.7)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>No active orders</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Market Overview */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Market Overview & Charts
              </Typography>
              {tierFeatures.realTimeData && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Last Updated: {marketQuotes['NIFTY']?.timestamp ? new Date(marketQuotes['NIFTY'].timestamp).toLocaleTimeString() : 'Never'}
                  </Typography>
                  <Chip
                    icon={getConnectionStatusDisplay().icon}
                    label={getConnectionStatusDisplay().text}
                    color={getConnectionStatusDisplay().color as any}
                    size="small"
                  />
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button variant={tierFeatures.advancedCharts ? "contained" : "outlined"} size="small">
                {tierFeatures.advancedCharts ? "Advanced Charts" : "Basic Charts"}
              </Button>
              <Button 
                variant={tierFeatures.realTimeData && connectionStatus === 'connected' ? "contained" : "outlined"} 
                size="small" 
                color={connectionStatus === 'connected' ? 'success' : 'primary'}
                disabled={!tierFeatures.realTimeData}
              >
                {tierFeatures.realTimeData 
                  ? (connectionStatus === 'connected' ? "Real-time Data" : "Connecting...") 
                  : "15min Delay"
                }
              </Button>
              {tierFeatures.realTimeData && Object.keys(marketQuotes).length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: 'rgba(255,255,255,0.8)' }}>
                    Live Quotes:
                  </Typography>
                  {Object.entries(marketQuotes).slice(0, 3).map(([symbol, quote]) => (
                    <Chip
                      key={symbol}
                      label={`${symbol}: ₹${quote.last_price} (${formatChangeDisplay(quote.change, quote.change_percent)})`}
                      size="small"
                      color={quote.change >= 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                height: 300,
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <ShowChart sx={{ fontSize: 48, mb: 2, color: 'rgba(255,255,255,0.7)' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {tierFeatures.advancedCharts ? "Advanced" : "Basic"} Trading Charts
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Interactive market charts and technical indicators will be integrated here
                </Typography>
                {!tierFeatures.advancedCharts && (
                  <Typography variant="body2" sx={{ color: '#ffb74d', mt: 1 }}>
                    Upgrade to Pro/Elite for advanced charting tools
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
        <DialogTitle sx={{ color: 'white' }}>
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
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
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
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
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
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Order Type</InputLabel>
                  <Select 
                    defaultValue="MARKET" 
                    label="Order Type"
                    sx={{
                      color: 'white',
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
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Product Type</InputLabel>
                  <Select 
                    defaultValue="INTRADAY" 
                    label="Product Type"
                    sx={{
                      color: 'white',
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
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
                    Margin Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Required Margin:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>₹25,000</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Available Balance:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>₹1,60,000</Typography>
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
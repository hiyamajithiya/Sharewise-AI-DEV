import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Security,
  Add,
  CheckCircle,
  Settings,
  Link,
  Refresh,
  HelpOutline,
  Lightbulb,
  Info,
  Delete,
  OpenInNew,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';
import api from '../services/api';

interface BrokerAccount {
  id: string;
  broker_type: string;
  account_name: string;
  broker_user_id: string;
  status: 'CONNECTING' | 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'EXPIRED';
  account_balance: string;
  available_balance: string;
  last_connected_at: string;
  is_primary: boolean;
  auto_sync: boolean;
}

const BrokerIntegration: React.FC = () => {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    requestToken: '',
    accountName: 'My Zerodha Account',
  });
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAccountForSettings, setSelectedAccountForSettings] = useState<BrokerAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [loginUrl, setLoginUrl] = useState('');

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;

  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);

  // Load broker accounts on mount
  useEffect(() => {
    loadBrokerAccounts();
  }, []);

// Handle OAuth callback with request_token in URL
useEffect(() => {
  console.log('=== OAuth Callback useEffect TRIGGERED ===');
  console.log('Current URL:', window.location.href);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);
  
  // Only run on broker-integration page
  if (!window.location.pathname.includes('broker-integration')) {
    console.log('Not on broker-integration page, skipping...');
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const requestToken = urlParams.get('request_token');
  const status = urlParams.get('status');
  const error = urlParams.get('error');
  
  console.log('Extracted params:', { requestToken, status, error });
  
  if (error) {
    console.log('❌ ERROR detected in URL');
    showSnackbar('Authentication failed or cancelled', 'error');
    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.removeItem("zerodha_api_key");
    sessionStorage.removeItem("zerodha_api_secret");
    sessionStorage.removeItem("zerodha_account_name");
    return;
  }
  
  if (requestToken && status === 'success') {
    console.log('✅ SUCCESS! Token received:', requestToken);
    
    // Restore credentials from sessionStorage
    const savedApiKey = sessionStorage.getItem("zerodha_api_key") || "";
    const savedApiSecret = sessionStorage.getItem("zerodha_api_secret") || "";
    const savedAccountName = sessionStorage.getItem("zerodha_account_name") || "My Zerodha Account";
    console.log("Restored:", { apiKey: savedApiKey ? "present" : "missing" });
    console.log('Setting credentials and opening dialog...');
    
    // Set the request token
    setCredentials({
      apiKey: savedApiKey,
      apiSecret: savedApiSecret,
      requestToken: requestToken,
      accountName: savedAccountName
    });
    
    // Open dialog
    console.log('Opening dialog...');
    setConnectDialogOpen(true);
    
    // Move to step 3 (Complete Setup)
    console.log('Setting step to 3...');
    setActiveStep(3);
    
    // Show success message
    showSnackbar('Authorization successful! Please complete the setup.', 'success');
    
    // Clean URL after a delay
    setTimeout(() => {
      console.log('Cleaning URL...');
      window.history.replaceState({}, '', window.location.pathname);
    }, 2000);
  } else {
    console.log('ℹ️ No token found in URL or invalid status');
  }
}, []); // Empty dependency array - runs once on mount

  const loadBrokerAccounts = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/brokers/accounts/');
      const accounts = response.results || response;
      setBrokerAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error: any) {
      console.error('Failed to load broker accounts:', error);
      showSnackbar('Failed to load broker accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const availableBrokers = [
    { 
      name: 'Zerodha', 
      value: 'ZERODHA',
      logo: '🟢', 
      description: "India's largest retail stockbroker", 
      features: ['Kite API', 'Real-time data', 'Auto trading'], 
      status: 'Available' as const
    },
    { 
      name: 'Upstox', 
      value: 'UPSTOX',
      logo: '🟠', 
      description: 'Modern trading platform', 
      features: ['REST API', 'WebSocket feeds', 'Options trading'], 
      status: 'Coming Soon' as const
    },
    { 
      name: 'Alice Blue', 
      value: 'ALICE_BLUE',
      logo: '🔵', 
      description: 'Discount broker with API', 
      features: ['Trade API', 'Portfolio sync', 'Low brokerage'], 
      status: 'Coming Soon' as const
    },
    { 
      name: 'Angel One', 
      value: 'ANGEL_ONE',
      logo: '🔴', 
      description: 'SmartAPI for trading', 
      features: ['Smart API', 'Research', 'Mobile trading'], 
      status: 'Coming Soon' as const
    },
  ];

  const steps = ['Select Broker', 'Enter Credentials', 'Login & Authorize', 'Complete Setup'];

  const GuidelineBox = ({ title, children, icon = <Info /> }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <Box sx={{ mb: 2, p: 2, borderRadius: '12px', background: '#f8f9ff', border: '1px solid #e0e0e0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: '#667eea' }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Box sx={{ color: '#374151' }}>{children}</Box>
    </Box>
  );

  const resetDialog = () => {
    setConnectDialogOpen(false);
    setSelectedBroker('');
    setActiveStep(0);
    setCredentials({ apiKey: '', apiSecret: '', requestToken: '', accountName: 'My Zerodha Account' });
    setConnectionTesting(false);
    setConnectionError('');
    setLoginUrl('');
    sessionStorage.removeItem("zerodha_api_key");
    sessionStorage.removeItem("zerodha_api_secret");
    sessionStorage.removeItem("zerodha_account_name");
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleGetLoginUrl = async () => {
    if (!credentials.apiKey) {
      showSnackbar('Please enter API Key', 'error');
      return;
    }

    try {
      // Save credentials to sessionStorage
      sessionStorage.setItem("zerodha_api_key", credentials.apiKey);
      sessionStorage.setItem("zerodha_api_secret", credentials.apiSecret);
      sessionStorage.setItem("zerodha_account_name", credentials.accountName);
      setConnectionTesting(true);
      const response: any = await api.get(`/brokers/zerodha/login-url/?api_key=${credentials.apiKey}`);
      setLoginUrl(response.login_url);
      showSnackbar('Login URL generated! Click the button to open Zerodha login.', 'success');
      setConnectionTesting(false);
      handleNext();
    } catch (error: any) {
      console.error('Failed to get login URL:', error);
      showSnackbar(error.response?.data?.error || 'Failed to generate login URL', 'error');
      setConnectionTesting(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!credentials.apiKey || !credentials.apiSecret || !credentials.requestToken) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      setConnectionTesting(true);
      const response: any = await api.post('/brokers/zerodha/complete-setup/', {
        api_key: credentials.apiKey,
        api_secret: credentials.apiSecret,
        request_token: credentials.requestToken,
        account_name: credentials.accountName,
      });

      if (response.success) {
        showSnackbar('Zerodha account connected successfully!', 'success');
        await loadBrokerAccounts();
        resetDialog();
      } else {
        showSnackbar(response.error || 'Failed to complete setup', 'error');
      }
    } catch (error: any) {
      console.error('Failed to complete setup:', error);
      showSnackbar(error.response?.data?.error || 'Failed to complete setup', 'error');
    } finally {
      setConnectionTesting(false);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      setRefreshing(true);
      const response: any = await api.post(`/brokers/accounts/${accountId}/sync_data/`);
      
      if (response.success) {
        showSnackbar('Account synced successfully', 'success');
        await loadBrokerAccounts();
      } else {
        showSnackbar(response.error || 'Failed to sync account', 'error');
      }
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      showSnackbar(error.response?.data?.error || 'Failed to sync account', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${accountName}?`)) {
      return;
    }

    try {
      await api.delete(`/brokers/accounts/${accountId}/`);
      showSnackbar('Account disconnected successfully', 'success');
      await loadBrokerAccounts();
      setSettingsDialogOpen(false);
      setSelectedAccountForSettings(null);
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      showSnackbar(error.response?.data?.error || 'Failed to disconnect account', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'CONNECTING': return 'info';
      case 'INACTIVE': return 'warning';
      case 'ERROR': return 'error';
      case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const getBrokerLogo = (brokerType: string) => {
    const broker = availableBrokers.find(b => b.value === brokerType);
    return broker?.logo || '📊';
  };

  const brokerStats = [
    {
      title: 'Connected Accounts',
      value: (brokerAccounts || []).filter((acc) => acc.status === 'ACTIVE').length.toString(),
      change: `${(brokerAccounts || []).length} total`,
      changeType: 'positive' as const,
      icon: <AccountBalance />,
      color: 'primary' as const,
      subtitle: 'Active broker connections'
    },
    {
      title: 'Total Balance',
      value: `₹${(brokerAccounts || []).reduce((sum, acc) => sum + parseFloat(acc.account_balance || '0'), 0).toLocaleString()}`,
      change: 'Synced',
      changeType: 'positive' as const,
      icon: <TrendingUp />,
      color: 'success' as const,
      subtitle: 'Across all accounts'
    },
    {
      title: 'Auto Sync',
      value: (brokerAccounts || []).filter((acc) => acc.auto_sync).length.toString(),
      change: 'Enabled',
      changeType: 'positive' as const,
      icon: <Security />,
      color: 'info' as const,
      subtitle: 'Accounts with auto-sync'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, p: 3, borderRadius: '20px', background: 'white', border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1F2937' }}>
                Broker Integration
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                {isTestingMode && selectedUser ? `Testing broker integrations for ${selectedUser.role} role` : 'Connect your trading accounts and sync your portfolio data'}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => setConnectDialogOpen(true)} 
              startIcon={<Add />} 
              sx={{ borderRadius: '12px' }}
            >
              Add Broker Account
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {brokerStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {(brokerAccounts || []).length === 0 && (
              <Paper sx={{ p: 4, mb: 4, textAlign: 'center', borderRadius: '20px' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>
                  Welcome to Broker Integration!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#6B7280' }}>
                  Connect your broker accounts to enable automated trading and real-time portfolio sync.
                </Typography>
                <Box sx={{ mb: 3, p: 2, borderRadius: '16px', background: '#f8f9ff', border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Lightbulb sx={{ color: '#374151' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1F2937' }}>
                        Why Connect Your Broker?
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        • Automated Trading • Real-time Sync • Secure Connection • Portfolio Tracking
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  onClick={() => setConnectDialogOpen(true)} 
                  startIcon={<Add />} 
                  size="large" 
                  sx={{ borderRadius: '12px' }}
                >
                  Connect Your First Broker
                </Button>
              </Paper>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, borderRadius: '20px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      Connected Accounts
                    </Typography>
                    <IconButton onClick={loadBrokerAccounts} disabled={loading}>
                      <Refresh />
                    </IconButton>
                  </Box>
                  {(brokerAccounts || []).length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <AccountBalance sx={{ fontSize: 48, mb: 2, color: '#9CA3AF' }} />
                      <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>No broker accounts connected</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>Connect your first broker to get started</Typography>
                    </Box>
                  ) : (
                    <List>
                      {(brokerAccounts || []).map((account) => (
                        <ListItem key={account.id} sx={{ px: 0, mb: 2, border: '1px solid #e0e0e0', borderRadius: '12px', p: 2 }}>
                          <ListItemIcon>
                            <Typography variant="h4">{getBrokerLogo(account.broker_type)}</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                                  {account.account_name}
                                </Typography>
                                <Chip label={account.status} color={getStatusColor(account.status) as any} size="small" />
                                {account.is_primary && <Chip label="Primary" color="primary" size="small" />}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                  {account.broker_type} • User ID: {account.broker_user_id}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
                                  Balance: ₹{parseFloat(account.account_balance || '0').toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                  Last synced: {account.last_connected_at ? new Date(account.last_connected_at).toLocaleString() : 'Never'}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              onClick={() => handleSyncAccount(account.id)}
                              disabled={refreshing}
                              title="Sync Account"
                            >
                              <Refresh />
                            </IconButton>
                            <IconButton 
                              onClick={() => {
                                setSelectedAccountForSettings(account);
                                setSettingsDialogOpen(true);
                              }}
                              title="Settings"
                            >
                              <Settings />
                            </IconButton>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 3, borderRadius: '20px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                    Available Brokers
                  </Typography>
                  <Grid container spacing={2}>
                    {availableBrokers.map((broker, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card
                          variant="outlined"
                          sx={{ 
                            height: '100%', 
                            cursor: broker.status === 'Available' ? 'pointer' : 'default', 
                            opacity: broker.status === 'Coming Soon' ? 0.6 : 1, 
                            borderRadius: '16px',
                            '&:hover': broker.status === 'Available' ? {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            } : {}
                          }}
                          onClick={() => {
                            if (broker.status === 'Available') {
                              setSelectedBroker(broker.value);
                              setConnectDialogOpen(true);
                            }
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ mb: 1 }}>{broker.logo}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>{broker.name}</Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: '#374151' }}>{broker.description}</Typography>
                            <Box sx={{ mb: 2 }}>
                              {broker.features.map((feature, idx) => (
                                <Chip key={idx} label={feature} size="small" variant="outlined" sx={{ m: 0.25 }} />
                              ))}
                            </Box>
                            <Chip label={broker.status} color={broker.status === 'Available' ? 'success' : 'default'} size="small" />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {/* Connect Broker Dialog */}
        <Dialog open={connectDialogOpen} onClose={resetDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link sx={{ color: '#667eea' }} />
              <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                Connect Broker Account
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step 0: Select Broker */}
              {activeStep === 0 && (
                <Box>
                  <GuidelineBox title="Choose Your Broker" icon={<HelpOutline />}>
                    Select the broker where you have a trading account. Make sure you have API access enabled from your broker's dashboard before proceeding.
                  </GuidelineBox>
                  <FormControl fullWidth>
                    <InputLabel>Select Broker</InputLabel>
                    <Select 
                      value={selectedBroker} 
                      label="Select Broker" 
                      onChange={(e) => setSelectedBroker(e.target.value)}
                    >
                      {availableBrokers.filter(b => b.status === 'Available').map((broker) => (
                        <MenuItem key={broker.value} value={broker.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography>{broker.logo}</Typography>
                            <Box>
                              <Typography variant="body1">{broker.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{broker.description}</Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedBroker === 'ZERODHA' && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Zerodha Kite Connect Setup</Typography>
                      <Typography variant="body2" sx={{ color: '#374151', mb: 1 }}>
                        To connect your Zerodha account, you'll need:
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ color: '#374151' }}>
                        • API Key from Kite Connect Developer Console<br/>
                        • API Secret (keep this confidential)<br/>
                        • Active Zerodha trading account
                      </Typography>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Don't have API credentials? Visit{' '}
                        <a href="https://developers.kite.trade/" target="_blank" rel="noopener noreferrer">
                          Kite Connect Developer Portal
                        </a>
                      </Alert>
                    </Box>
                  )}
                </Box>
              )}

              {/* Step 1: Enter API Key & Get Login URL */}
              {activeStep === 1 && (
                <Box>
                  <GuidelineBox title="Enter API Credentials" icon={<Security />}>
                    Enter your Zerodha API Key and API Secret. These are available in your Kite Connect app dashboard.
                  </GuidelineBox>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="API Key"
                        value={credentials.apiKey}
                        onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                        fullWidth
                        required
                        helperText="Your Zerodha API Key from Kite Connect"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="API Secret"
                        value={credentials.apiSecret}
                        onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                        fullWidth
                        type="password"
                        required
                        helperText="Your Zerodha API Secret (keep this confidential)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Account Name"
                        value={credentials.accountName}
                        onChange={(e) => setCredentials({ ...credentials, accountName: e.target.value })}
                        fullWidth
                        helperText="A friendly name for this account"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={handleGetLoginUrl}
                        disabled={!credentials.apiKey || connectionTesting}
                        fullWidth
                        startIcon={connectionTesting ? <CircularProgress size={20} /> : <OpenInNew />}
                      >
                        {connectionTesting ? 'Generating...' : 'Generate Login URL'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Step 2: Login to Zerodha */}
              {activeStep === 2 && (
                <Box>
                  <GuidelineBox title="Authorize ShareWise AI" icon={<CheckCircle />}>
                    Click the button below to login to Zerodha and authorize ShareWise AI to access your account.
                  </GuidelineBox>
                  {loginUrl && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        After logging in, copy the <strong>request_token</strong> from the redirect URL and paste it below.
                      </Alert>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<OpenInNew />}
                        onClick={() => window.location.href = loginUrl}
                        sx={{ mb: 3 }}
                      >
                        Open Zerodha Login
                      </Button>
                      <TextField
                        label="Request Token"
                        value={credentials.requestToken}
                        onChange={(e) => setCredentials({ ...credentials, requestToken: e.target.value })}
                        fullWidth
                        placeholder="Paste the request_token from redirect URL"
                        helperText="After logging in, the URL will contain ?request_token=XXXXX - copy the token value"
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Step 3: Complete Setup */}
              {activeStep === 3 && (
                <Box>
                  <GuidelineBox title="Ready to Connect" icon={<CheckCircle />}>
                    Click "Complete Setup" to finalize the connection. Your credentials will be securely encrypted and stored.
                  </GuidelineBox>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Connection Summary:</Typography>
                    <Typography variant="body2">• Broker: Zerodha</Typography>
                    <Typography variant="body2">• Account Name: {credentials.accountName}</Typography>
                    <Typography variant="body2">• API Key: {credentials.apiKey.substring(0, 8)}...</Typography>
                    <Typography variant="body2">• Status: Ready ✅</Typography>
                  </Box>
                  {connectionError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {connectionError}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={resetDialog}>Cancel</Button>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                onClick={handleCompleteSetup}
                disabled={!credentials.requestToken || !credentials.apiKey || !credentials.apiSecret || connectionTesting}
                startIcon={connectionTesting ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {connectionTesting ? 'Connecting...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !selectedBroker) ||
                  (activeStep === 1 && !loginUrl) ||
                  (activeStep === 2 && !credentials.requestToken)
                }
              >
                Next
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Account Settings Dialog */}
        <Dialog 
          open={settingsDialogOpen} 
          onClose={() => { 
            setSettingsDialogOpen(false); 
            setSelectedAccountForSettings(null); 
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Settings sx={{ color: '#667eea' }} />
              <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>Account Settings</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedAccountForSettings && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ p: 2, mb: 3, background: '#f8f9ff', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ color: '#1F2937', mb: 2 }}>
                    {selectedAccountForSettings.account_name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Broker</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedAccountForSettings.broker_type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip label={selectedAccountForSettings.status} color={getStatusColor(selectedAccountForSettings.status) as any} size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Balance</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedAccountForSettings.account_balance || '0').toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Available</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedAccountForSettings.available_balance || '0').toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Last Sync</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedAccountForSettings.last_connected_at ? new Date(selectedAccountForSettings.last_connected_at).toLocaleString() : 'Never'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Refresh />} 
                    onClick={() => handleSyncAccount(selectedAccountForSettings.id)}
                    disabled={refreshing}
                  >
                    {refreshing ? 'Syncing...' : 'Sync Account Data'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteAccount(selectedAccountForSettings.id, selectedAccountForSettings.account_name)}
                  >
                    Disconnect Account
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => { 
              setSettingsDialogOpen(false); 
              setSelectedAccountForSettings(null); 
            }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default BrokerIntegration;

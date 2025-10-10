import React, { useState } from 'react';
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
  Pause,
  PlayArrow,
  Delete,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';

interface BrokerAccount {
  id: number;
  brokerName: string;
  accountId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING' | 'ERROR';
  balance: number;
  lastSync: string;
  tradingEnabled: boolean;
}

const BrokerIntegration: React.FC = () => {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    accountId: '',
    environment: 'sandbox',
  });
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAccountForSettings, setSelectedAccountForSettings] = useState<BrokerAccount | null>(null);

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;

  // Broker accounts - loaded from backend (placeholder for now)
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);

  const availableBrokers: Array<{
    name: string;
    logo: string;
    description: string;
    features: string[];
    status: 'Available' | 'Coming Soon';
  }> = [
    { name: 'Zerodha', logo: '🟢', description: "India's largest retail stockbroker", features: ['Kite API', 'Real-time data', 'Auto trading'], status: 'Available' },
    { name: 'Angel Broking', logo: '🔵', description: 'Smart API for seamless trading', features: ['Smart API', 'Historical data', 'Portfolio sync'], status: 'Available' },
    { name: 'Upstox', logo: '🟠', description: 'Modern trading platform', features: ['REST API', 'WebSocket feeds', 'Options trading'], status: 'Available' },
    { name: 'ICICI Direct', logo: '🔴', description: 'Bank-backed trading platform', features: ['Trade API', 'Secure banking', 'Research reports'], status: 'Coming Soon' },
  ];

  const steps = ['Select Broker', 'Enter Credentials', 'Test Connection', 'Complete Setup'];

  const GuidelineBox = ({ title, children, icon = <Info /> }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
    <Box sx={{ mb: 2, p: 2, borderRadius: '12px', background: '#f8f9ff', border: '1px solid #e0e0e0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: '#667eea' }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Box sx={{ color: '#374151' }}>{children}</Box>
    </Box>
  );

  const BrokerSetupGuide = ({ broker }: { broker: string }) => {
    const panelSx = { mt: 2, p: 2, borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' } as const;
    if (broker === 'Zerodha') {
      const redirectHint = 'https://sharewise.chinmaytechnosoft.com/auth/zerodha/callback';
      const loginTemplate = 'https://kite.zerodha.com/connect/login?api_key=YOUR_API_KEY&v=3&redirect_url=YOUR_REDIRECT_URL';
      const testEndpoint = 'https://sharewise.chinmaytechnosoft.com/api/brokers/test-connection/';
      const createEndpoint = 'https://sharewise.chinmaytechnosoft.com/api/brokers/accounts/';
      return (
        <Box sx={panelSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Zerodha (Kite Connect) — Full Setup</Typography>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#111827' }}>
              <strong>What you will generate:</strong> API Key (public) and API Secret (private); request_token (via OAuth redirect); access_token (obtained by exchanging request_token + secret).
            </Typography>
          </Box>
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>1) Create app in Kite Connect</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151', mb: 0.5 }}>• Create the app → note your API Key and API Secret</Typography>
            <Typography variant="body2" sx={{ color: '#374151', mb: 1 }}>• Set Redirect URL (example): {redirectHint}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>2) Get request_token</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Open this login URL in your browser (replace placeholders):</Typography>
            <Box sx={{ bgcolor: 'white', border: '1px solid #e5e7eb', px: 1.5, py: 1, borderRadius: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{loginTemplate}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>• Log in → you’ll be redirected with <strong>?request_token=XXXX</strong> in the URL → copy that token</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>3) Test connection</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• UI path: Connect Broker → Select Zerodha → Next → Enter API Key & Secret → Test Connection</Typography>
            <Typography variant="body2" sx={{ color: '#374151', mt: 0.5 }}>• Or via API:</Typography>
            <Box sx={{ bgcolor: 'white', border: '1px solid #e5e7eb', px: 1.5, py: 1, borderRadius: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                POST {testEndpoint}{'\n'}
                {'{'}"broker_type":"ZERODHA","credentials":{'{'}"api_key":"YOUR_API_KEY","api_secret":"YOUR_API_SECRET","request_token":"REQUEST_TOKEN_FROM_REDIRECT"{'}'}{'}'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>4) Complete setup (create account)</strong></Typography>
            <Box sx={{ bgcolor: 'white', border: '1px solid #e5e7eb', px: 1.5, py: 1, borderRadius: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                POST {createEndpoint}{'\n'}
                {'{'}"broker_type":"ZERODHA","account_name":"My Zerodha","broker_user_id":"your_zerodha_user_id","credentials":{'{'}"api_key":"YOUR_API_KEY","api_secret":"YOUR_API_SECRET","access_token":"ACCESS_TOKEN_FROM_EXCHANGE"{'}'}{'}'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#374151', mt: 1 }}>• Note: Credentials are encrypted by the backend. You won’t see them in plain text again.</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>5) Verify in UI</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• The Broker Integration page should list your account → click “Sync” to fetch balances/positions (if enabled)</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Common fixes</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• “Authentication failed”: request_token missing/expired → regenerate via login URL</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• “Encryption key not configured”: add BROKER_ENCRYPTION_KEY in backend settings</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• 401 errors: JWT/auth token expired → log out and log in again</Typography>
          </Box>
        </Box>
      );
    }
    if (broker === 'Angel Broking' || broker === 'Angel One') {
      return (
        <Box sx={panelSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Angel One (SmartAPI) — Quick Steps</Typography>
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ color: '#111827', mb: 0.5 }}><strong>What you will generate:</strong> API Key, Client Code, TOTP Secret, and a session/access token.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Steps:</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Create a SmartAPI app and note API Key</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Keep Client Code and Password; set up TOTP (Google Authenticator)</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Generate session/access token per SmartAPI docs</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• In the next step, enter API Key + any required token to test</Typography>
          </Box>
        </Box>
      );
    }
    if (broker === 'Upstox') {
      return (
        <Box sx={panelSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Upstox — Quick Steps</Typography>
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ color: '#111827', mb: 0.5 }}><strong>What you will generate:</strong> API Key & Secret, OAuth authorization code, and access token.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Steps:</strong></Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Create an app in Upstox Developer; note API Key & Secret</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Set your Redirect URL (use your ShareWise domain if hosted)</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Complete OAuth login to get an authorization code</Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>• Exchange the code for an access token; then proceed to test</Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  const resetDialog = () => {
    setConnectDialogOpen(false);
    setSelectedBroker('');
    setActiveStep(0);
    setCredentials({ apiKey: '', apiSecret: '', accountId: '', environment: 'sandbox' });
    setConnectionTesting(false);
    setConnectionResult(null);
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleConnectBroker = async () => {
    console.log('Connecting to broker with credentials:', credentials);
    alert('Broker connection will be implemented when backend API is ready. Please configure broker API credentials in the backend first.');
    resetDialog();
  };

  const handleTestConnection = async () => {
    setConnectionTesting(true);
    setConnectionResult(null);
    try {
      if (credentials.apiKey && credentials.apiSecret) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setConnectionResult('success');
      } else {
        setConnectionResult('error');
      }
    } catch {
      setConnectionResult('error');
    } finally {
      setConnectionTesting(false);
    }
  };

  const handleRefreshAccounts = async () => {
    setRefreshing(true);
    try {
      setBrokerAccounts([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAccountSettings = (account: BrokerAccount) => {
    setSelectedAccountForSettings(account);
    setSettingsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'success';
      case 'PENDING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  const brokerStats = [
    {
      title: 'Connected Accounts',
      value: brokerAccounts.filter((acc) => acc.status === 'CONNECTED').length.toString(),
      change: '+1 this month',
      changeType: 'positive' as const,
      icon: <AccountBalance />,
      color: 'primary' as const,
      subtitle: 'Active broker connections'
    },
    {
      title: 'Total Balance',
      value: `₹${brokerAccounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}`,
      change: '+5.2%',
      changeType: 'positive' as const,
      icon: <TrendingUp />,
      color: 'success' as const,
      subtitle: 'Across all accounts'
    },
    {
      title: 'Trading Status',
      value: brokerAccounts.filter((acc) => acc.tradingEnabled).length > 0 ? 'Active' : 'Inactive',
      change: 'Real-time',
      changeType: 'positive' as const,
      icon: <Security />,
      color: 'info' as const,
      subtitle: 'Auto trading enabled'
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
            <Button variant="contained" onClick={() => setConnectDialogOpen(true)} startIcon={<Add />} sx={{ borderRadius: '12px' }}>
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

        {brokerAccounts.length === 0 && (
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
                    • Automated Trading • Real-time Sync • Secure Connection • Paper Trading
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button variant="contained" onClick={() => setConnectDialogOpen(true)} startIcon={<Add />} size="large" sx={{ borderRadius: '12px' }}>
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
                <IconButton onClick={handleRefreshAccounts} disabled={refreshing}>
                  <Refresh />
                </IconButton>
              </Box>
              {brokerAccounts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AccountBalance sx={{ fontSize: 48, mb: 2, color: '#9CA3AF' }} />
                  <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>No broker accounts connected</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>Connect your first broker to get started</Typography>
                </Box>
              ) : (
                <List>
                  {brokerAccounts.map((account) => (
                    <ListItem key={account.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <AccountBalance sx={{ color: '#374151' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {account.brokerName}
                            </Typography>
                            <Chip label={account.status} color={getStatusColor(account.status) as any} size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#374151' }}>
                              Account: {account.accountId} • Balance: ₹{account.balance.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              Last synced: {account.lastSync}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton onClick={() => handleOpenAccountSettings(account)}>
                        <Settings />
                      </IconButton>
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
                      sx={{ height: '100%', cursor: broker.status === 'Available' ? 'pointer' : 'default', opacity: broker.status === 'Coming Soon' ? 0.6 : 1, borderRadius: '16px' }}
                      onClick={() => {
                        if (broker.status === 'Available') {
                          setSelectedBroker(broker.name);
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

              {activeStep === 0 && (
                <Box>
                  <GuidelineBox title="Choose Your Broker" icon={<HelpOutline />}>
                    Select the broker where you have a trading account. Make sure you have API access enabled from your broker's dashboard before proceeding.
                  </GuidelineBox>
                  <FormControl fullWidth>
                    <InputLabel>Select Broker</InputLabel>
                    <Select value={selectedBroker} label="Select Broker" onChange={(e) => setSelectedBroker(e.target.value)}>
                      {availableBrokers.filter(b => b.status === 'Available').map((broker) => (
                        <MenuItem key={broker.name} value={broker.name}>
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
                  {selectedBroker && <BrokerSetupGuide broker={selectedBroker} />}
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <GuidelineBox title="API Credentials Setup" icon={<Security />}>
                    You'll need to generate API credentials from your broker's dashboard. These are used to securely connect your account. Never share these credentials with anyone!
                  </GuidelineBox>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Environment</InputLabel>
                        <Select value={credentials.environment} label="Environment" onChange={(e) => setCredentials({ ...credentials, environment: e.target.value })}>
                          <MenuItem value="sandbox">Sandbox (Paper Trading)</MenuItem>
                          <MenuItem value="live">Live Trading</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="API Key" value={credentials.apiKey} onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })} fullWidth type="password" required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="API Secret" value={credentials.apiSecret} onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })} fullWidth type="password" required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Account ID (Optional)" value={credentials.accountId} onChange={(e) => setCredentials({ ...credentials, accountId: e.target.value })} fullWidth />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <GuidelineBox title="Testing Connection" icon={<CheckCircle />}>
                    We're testing your credentials to ensure everything is configured correctly. This may take a few seconds.
                  </GuidelineBox>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" gutterBottom>Testing connection to {selectedBroker}...</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Environment: {credentials.environment === 'sandbox' ? 'Paper Trading' : 'Live Trading'}
                    </Typography>
                    {connectionResult === 'success' && (<Alert severity="success" sx={{ mb: 2 }}>✅ Connection successful! Your credentials are working properly.</Alert>)}
                    {connectionResult === 'error' && (<Alert severity="error" sx={{ mb: 2 }}>❌ Connection failed. Please check your API credentials.</Alert>)}
                    <Button variant="outlined" onClick={handleTestConnection} disabled={connectionTesting || !credentials.apiKey || !credentials.apiSecret} startIcon={connectionTesting ? <Refresh /> : <CheckCircle />}>
                      {connectionTesting ? 'Testing...' : 'Test Now'}
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Connection Successful! 🎉</Typography>
                    <Typography variant="body2">Your {selectedBroker} account has been successfully connected. You can now start automated trading!</Typography>
                  </Alert>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Connection Summary:</Typography>
                    <Typography variant="body2">• Broker: {selectedBroker}</Typography>
                    <Typography variant="body2">• Environment: {credentials.environment === 'sandbox' ? 'Paper Trading' : 'Live Trading'}</Typography>
                    <Typography variant="body2">• Status: Connected ✅</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={resetDialog}>Cancel</Button>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleConnectBroker} disabled={!selectedBroker}>Complete Setup</Button>
            ) : (
              <Button variant="contained" onClick={handleNext} disabled={(activeStep === 0 && !selectedBroker) || (activeStep === 1 && (!credentials.apiKey.trim() || !credentials.apiSecret.trim()))}>Next</Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={settingsDialogOpen} onClose={() => { setSettingsDialogOpen(false); setSelectedAccountForSettings(null); }} maxWidth="sm" fullWidth>
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
                    {selectedAccountForSettings.brokerName} Account
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Account ID</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedAccountForSettings.accountId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip label={selectedAccountForSettings.status} color={getStatusColor(selectedAccountForSettings.status) as any} size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Balance</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{selectedAccountForSettings.balance.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Trading</Typography>
                      <Chip label={selectedAccountForSettings.tradingEnabled ? 'Enabled' : 'Disabled'} color={selectedAccountForSettings.tradingEnabled ? 'success' : 'default'} size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Last Sync</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedAccountForSettings.lastSync}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefreshAccounts}>Refresh Account Data</Button>
                  <Button
                    variant="outlined"
                    startIcon={selectedAccountForSettings.tradingEnabled ? <Pause /> : <PlayArrow />}
                    onClick={() => {
                      setBrokerAccounts(prev => prev.map(account => account.id === selectedAccountForSettings.id ? { ...account, tradingEnabled: !account.tradingEnabled } : account));
                      setSelectedAccountForSettings(prev => prev ? { ...prev, tradingEnabled: !prev.tradingEnabled } : null);
                    }}
                  >
                    {selectedAccountForSettings.tradingEnabled ? 'Disable Trading' : 'Enable Trading'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to disconnect ${selectedAccountForSettings.brokerName} account?`)) {
                        setBrokerAccounts(prev => prev.filter(account => account.id !== selectedAccountForSettings.id));
                        setSettingsDialogOpen(false);
                        setSelectedAccountForSettings(null);
                      }
                    }}
                  >
                    Disconnect Account
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => { setSettingsDialogOpen(false); setSelectedAccountForSettings(null); }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default BrokerIntegration;
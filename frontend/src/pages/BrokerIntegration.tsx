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
  ListItemSecondaryAction,
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
    environment: 'sandbox'
  });
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAccountForSettings, setSelectedAccountForSettings] = useState<BrokerAccount | null>(null);

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;

  // Sample broker accounts
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([
    {
      id: 1,
      brokerName: 'Zerodha',
      accountId: 'ZD1234',
      status: 'CONNECTED',
      balance: 125000,
      lastSync: '2025-01-08 14:30:00',
      tradingEnabled: true
    }
  ]);

  // Available brokers for integration
  const availableBrokers = [
    {
      name: 'Zerodha',
      logo: '🟢',
      description: 'India\'s largest retail stockbroker',
      features: ['Kite API', 'Real-time data', 'Auto trading'],
      status: 'Available'
    },
    {
      name: 'Angel Broking',
      logo: '🔵', 
      description: 'Smart API for seamless trading',
      features: ['Smart API', 'Historical data', 'Portfolio sync'],
      status: 'Available'
    },
    {
      name: 'Upstox',
      logo: '🟠',
      description: 'Modern trading platform',
      features: ['REST API', 'WebSocket feeds', 'Options trading'],
      status: 'Available'
    },
    {
      name: 'ICICI Direct',
      logo: '🔴',
      description: 'Bank-backed trading platform',
      features: ['Trade API', 'Secure banking', 'Research reports'],
      status: 'Coming Soon'
    }
  ];

  const steps = ['Select Broker', 'Enter Credentials', 'Test Connection', 'Complete Setup'];

  // Helper component for guidelines
  const GuidelineBox = ({ title, children, icon = <Info /> }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <Box sx={{
      mb: 3,
      p: 2,
      borderRadius: '16px',
      background: 'white',
      border: '1px solid #e0e0e0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ color: '#374151' }}>{icon}</Box>
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

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const resetDialog = () => {
    setConnectDialogOpen(false);
    setActiveStep(0);
    setSelectedBroker('');
    setCredentials({ apiKey: '', apiSecret: '', accountId: '', environment: 'sandbox' });
  };

  const handleConnectBroker = () => {
    console.log('Connecting to broker with credentials:', credentials);
    
    // Add new broker account to the list
    const newAccount: BrokerAccount = {
      id: Date.now(),
      brokerName: selectedBroker,
      accountId: credentials.accountId || `${selectedBroker.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9999)}`,
      status: 'CONNECTED',
      balance: Math.floor(Math.random() * 500000) + 50000, // Random balance between 50k-550k
      lastSync: new Date().toLocaleString(),
      tradingEnabled: credentials.environment === 'live'
    };
    
    setBrokerAccounts(prev => [...prev, newAccount]);
    resetDialog();
    // In real app, this would make API call to connect broker
  };
  
  const handleTestConnection = async () => {
    setConnectionTesting(true);
    setConnectionResult(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure based on credentials
      if (credentials.apiKey && credentials.apiSecret) {
        setConnectionResult('success');
      } else {
        setConnectionResult('error');
      }
    } catch (error) {
      setConnectionResult('error');
    } finally {
      setConnectionTesting(false);
    }
  };
  
  const handleRefreshAccounts = async () => {
    setRefreshing(true);
    
    try {
      // Simulate API call to refresh account data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last sync time for all accounts
      setBrokerAccounts(prev => prev.map(account => ({
        ...account,
        lastSync: new Date().toLocaleString(),
        balance: account.balance + Math.floor(Math.random() * 10000) - 5000 // Simulate balance change
      })));
      
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
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
      value: brokerAccounts.filter(acc => acc.status === 'CONNECTED').length.toString(),
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
      value: brokerAccounts.filter(acc => acc.tradingEnabled).length > 0 ? 'Active' : 'Inactive',
      change: 'Real-time',
      changeType: 'positive' as const,
      icon: <Security />,
      color: 'info' as const,
      subtitle: 'Auto trading enabled'
    }
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
        {/* Header with theme styling */}
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
                Broker Integration
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                {isTestingMode && selectedUser
                  ? `Testing broker integrations for ${selectedUser.role} role`
                  : 'Connect your trading accounts and sync your portfolio data'
                }
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setConnectDialogOpen(true)}
              startIcon={<Add />}
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
              }}
            >
              Add Broker Account
            </Button>
          </Box>
        </Box>

      {/* Broker Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {brokerStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

        {/* Getting Started Guide */}
        {brokerAccounts.length === 0 && (
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            textAlign: 'center',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1F2937' }}>
              Welcome to Broker Integration!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#6B7280' }}>
              Connect your broker accounts to enable automated trading and real-time portfolio sync.
            </Typography>
            <Box sx={{
              mb: 3,
              p: 2,
              borderRadius: '16px',
              background: '#f8f9ff',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Lightbulb sx={{ color: '#374151' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1F2937' }}>
                    Why Connect Your Broker?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151' }}>
                    • <strong>Automated Trading:</strong> Execute your strategies automatically without manual intervention<br/>
                    • <strong>Real-time Sync:</strong> Keep your portfolio data updated across all platforms<br/>
                    • <strong>Secure Connection:</strong> Bank-level encryption protects your trading credentials<br/>
                    • <strong>Paper Trading:</strong> Test strategies safely before going live
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={() => setConnectDialogOpen(true)}
              startIcon={<Add />}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              Connect Your First Broker
            </Button>
          </Paper>
        )}

      <Grid container spacing={3}>
        {/* Connected Accounts */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                Connected Accounts
              </Typography>
              <IconButton 
                onClick={handleRefreshAccounts} 
                disabled={refreshing}
                sx={{ 
                  color: '#374151',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    color: '#667eea'
                  },
                  '&:disabled': {
                    color: '#9CA3AF'
                  }
                }}
              >
                <Refresh className={refreshing ? 'animate-spin' : ''} />
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
                          <Chip 
                            label={account.status} 
                            color={getStatusColor(account.status) as any} 
                            size="small"
                          />
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
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleOpenAccountSettings(account)} 
                        sx={{ 
                          color: '#374151',
                          '&:hover': {
                            backgroundColor: '#f3f4f6',
                            color: '#667eea'
                          }
                        }}
                      >
                        <Settings />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Available Brokers */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
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
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      '&:hover': broker.status === 'Available' ? {
                        background: '#f8f9ff',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                        borderColor: '#667eea',
                      } : {}
                    }}
                    onClick={() => {
                      if (broker.status === 'Available') {
                        setSelectedBroker(broker.name);
                        setConnectDialogOpen(true);
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>{broker.logo}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>
                        {broker.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: '#374151' }}>
                        {broker.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {broker.features.map((feature, idx) => (
                          <Chip 
                            key={idx}
                            label={feature} 
                            size="small" 
                            variant="outlined" 
                            sx={{ 
                              m: 0.25,
                              color: '#374151',
                              borderColor: '#d1d5db',
                              backgroundColor: '#f8f9ff',
                            }}
                          />
                        ))}
                      </Box>
                      <Chip 
                        label={broker.status}
                        color={broker.status === 'Available' ? 'success' : 'default'}
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        </Grid>

          {/* Broker Connection Dialog */}
        <Dialog 
          open={connectDialogOpen} 
          onClose={resetDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              background: 'white',
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Connect Broker Account
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
                    {availableBrokers
                      .filter(broker => broker.status === 'Available')
                      .map((broker) => (
                        <MenuItem key={broker.name} value={broker.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography>{broker.logo}</Typography>
                            <Box>
                              <Typography variant="body1">{broker.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {broker.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Step 1: Enter Credentials */}
            {activeStep === 1 && (
              <Box>
                <GuidelineBox title="API Credentials Setup" icon={<Security />}>
                  You'll need to generate API credentials from your broker's dashboard. These are used to securely connect your account. Never share these credentials with anyone!
                </GuidelineBox>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Environment</InputLabel>
                      <Select
                        value={credentials.environment}
                        label="Environment"
                        onChange={(e) => setCredentials({...credentials, environment: e.target.value})}
                      >
                        <MenuItem value="sandbox">Sandbox (Paper Trading)</MenuItem>
                        <MenuItem value="live">Live Trading</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="API Key"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                      fullWidth
                      type="password"
                      helperText="Your API key from broker dashboard"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="API Secret"
                      value={credentials.apiSecret}
                      onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
                      fullWidth
                      type="password"
                      helperText="Your API secret key"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Account ID (Optional)"
                      value={credentials.accountId}
                      onChange={(e) => setCredentials({...credentials, accountId: e.target.value})}
                      fullWidth
                      helperText="Your broker account ID if required"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 2: Test Connection */}
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
                  
                  {connectionResult === 'success' && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      ✅ Connection successful! Your credentials are working properly.
                    </Alert>
                  )}
                  
                  {connectionResult === 'error' && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      ❌ Connection failed. Please check your API credentials.
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    onClick={handleTestConnection}
                    disabled={connectionTesting || !credentials.apiKey || !credentials.apiSecret}
                    startIcon={connectionTesting ? <Refresh className="animate-spin" /> : <CheckCircle />}
                    sx={{ 
                      mt: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a67d8',
                        backgroundColor: '#f8f9ff',
                        color: '#5a67d8'
                      },
                      '&:disabled': {
                        borderColor: '#9CA3AF',
                        color: '#9CA3AF'
                      }
                    }}
                  >
                    {connectionTesting ? 'Testing...' : 'Test Now'}
                  </Button>
                  
                  {connectionResult === 'success' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                        Ready to proceed to next step!
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Step 3: Complete Setup */}
            {activeStep === 3 && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Connection Successful! 🎉</Typography>
                  <Typography variant="body2">
                    Your {selectedBroker} account has been successfully connected. You can now start automated trading!
                  </Typography>
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
              onClick={handleConnectBroker}
              disabled={!selectedBroker}
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
                  color: 'white',
                  transform: 'none'
                }
              }}
            >
              Complete Setup
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={activeStep === 0 && !selectedBroker}
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
                  color: 'white',
                  transform: 'none'
                }
              }}
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
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Settings sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Account Settings
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAccountForSettings && (
            <Box sx={{ pt: 2 }}>
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  background: '#f8f9ff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px'
                }}
              >
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 2 }}>
                  {selectedAccountForSettings.brokerName} Account
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Account ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedAccountForSettings.accountId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedAccountForSettings.status} 
                      color={getStatusColor(selectedAccountForSettings.status) as any} 
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Balance</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ₹{selectedAccountForSettings.balance.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Trading</Typography>
                    <Chip 
                      label={selectedAccountForSettings.tradingEnabled ? 'Enabled' : 'Disabled'} 
                      color={selectedAccountForSettings.tradingEnabled ? 'success' : 'default'} 
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Last Sync</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedAccountForSettings.lastSync}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefreshAccounts}
                  disabled={refreshing}
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      backgroundColor: '#f8f9ff',
                      color: '#5a67d8'
                    }
                  }}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Account Data'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={selectedAccountForSettings.tradingEnabled ? <Pause /> : <PlayArrow />}
                  onClick={() => {
                    setBrokerAccounts(prev => prev.map(account => 
                      account.id === selectedAccountForSettings.id 
                        ? { ...account, tradingEnabled: !account.tradingEnabled }
                        : account
                    ));
                    setSelectedAccountForSettings(prev => prev ? {
                      ...prev,
                      tradingEnabled: !prev.tradingEnabled
                    } : null);
                  }}
                  sx={{
                    borderColor: selectedAccountForSettings.tradingEnabled ? '#f59e0b' : '#10b981',
                    color: selectedAccountForSettings.tradingEnabled ? '#f59e0b' : '#10b981',
                    '&:hover': {
                      borderColor: selectedAccountForSettings.tradingEnabled ? '#d97706' : '#059669',
                      backgroundColor: selectedAccountForSettings.tradingEnabled ? '#fef3c7' : '#d1fae5'
                    }
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
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626'
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
          <Button 
            onClick={() => {
              setSettingsDialogOpen(false);
              setSelectedAccountForSettings(null);
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default BrokerIntegration;
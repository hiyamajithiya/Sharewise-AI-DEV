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
  Divider,
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

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;

  // Sample broker accounts
  const [brokerAccounts] = useState<BrokerAccount[]>([
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
    <Alert severity="info" sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {icon}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2">
            {children}
          </Typography>
        </Box>
      </Box>
    </Alert>
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
    resetDialog();
    // In real app, this would make API call to connect broker
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Broker Integration 🔗
            </Typography>
            <Typography variant="body1" color="text.secondary">
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
            sx={{ borderRadius: '8px' }}
          >
            Add Broker Account
          </Button>
        </Box>
        <Divider />
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
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Welcome to Broker Integration! 🎯
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Connect your broker accounts to enable automated trading and real-time portfolio sync.
          </Typography>
          <GuidelineBox title="Why Connect Your Broker?" icon={<Lightbulb />}>
            • <strong>Automated Trading:</strong> Execute your strategies automatically without manual intervention<br/>
            • <strong>Real-time Sync:</strong> Keep your portfolio data updated across all platforms<br/>
            • <strong>Secure Connection:</strong> Bank-level encryption protects your trading credentials<br/>
            • <strong>Paper Trading:</strong> Test strategies safely before going live
          </GuidelineBox>
          <Button
            variant="contained"
            onClick={() => setConnectDialogOpen(true)}
            startIcon={<Add />}
            size="large"
            sx={{ borderRadius: '8px' }}
          >
            Connect Your First Broker
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Connected Accounts */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Connected Accounts
              </Typography>
              <IconButton onClick={() => console.log('Refreshing accounts...')}>
                <Refresh />
              </IconButton>
            </Box>

            {brokerAccounts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <AccountBalance sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>No broker accounts connected</Typography>
                <Typography variant="body2">Connect your first broker to get started</Typography>
              </Box>
            ) : (
              <List>
                {brokerAccounts.map((account) => (
                  <ListItem key={account.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <AccountBalance color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
                          <Typography variant="body2" color="text.secondary">
                            Account: {account.accountId} • Balance: ₹{account.balance.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last synced: {account.lastSync}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => console.log('Account settings')}>
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
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                      '&:hover': broker.status === 'Available' ? {
                        boxShadow: 2,
                        transform: 'translateY(-2px)'
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
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {broker.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {broker.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {broker.features.map((feature, idx) => (
                          <Chip 
                            key={idx}
                            label={feature} 
                            size="small" 
                            variant="outlined" 
                            sx={{ m: 0.25 }}
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
      <Dialog open={connectDialogOpen} onClose={resetDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link color="primary" />
            Connect Broker Account
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
                  <Typography variant="body2" color="text.secondary">
                    Environment: {credentials.environment === 'sandbox' ? 'Paper Trading' : 'Live Trading'}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => console.log('Testing connection...')}
                    sx={{ mt: 2 }}
                  >
                    Test Now
                  </Button>
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
        <DialogActions>
          <Button onClick={resetDialog}>Cancel</Button>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleConnectBroker}
              disabled={!selectedBroker}
            >
              Complete Setup
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={activeStep === 0 && !selectedBroker}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BrokerIntegration;
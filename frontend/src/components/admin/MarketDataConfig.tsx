import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp,
  Cable,
  Speed,
  Storage,
} from '@mui/icons-material';

interface APIConfig {
  id: string;
  provider: string;
  status: string;
  is_primary: boolean;
  daily_api_calls: number;
  monthly_api_calls: number;
  rate_limit_per_minute: number;
  last_health_check: string | null;
  error_message: string;
  created_at: string;
}

interface MarketDataStats {
  api_stats: {
    daily_calls: number;
    monthly_calls: number;
    provider_status: string;
    last_health_check: string | null;
  };
  connection_stats: {
    total_connections: number;
    active_connections: number;
    error_logs_today: number;
  };
  subscription_stats: Array<{
    subscription_type: string;
    count: number;
  }>;
  top_symbols: Array<{
    symbol: string;
    subscribers: number;
  }>;
}

const MarketDataConfig: React.FC = () => {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [stats, setStats] = useState<MarketDataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<APIConfig | null>(null);
  const [formData, setFormData] = useState({
    provider: 'NSE_OFFICIAL',
    api_key: '',
    api_secret: '',
    access_token: '',
    base_url: 'https://www.nseindia.com/api',
    websocket_url: '',
    rate_limit_per_minute: 100,
    is_primary: false
  });

  useEffect(() => {
    fetchConfigurations();
    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/market-data/api-config/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/market-data/admin/dashboard/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleAddConfig = () => {
    setSelectedConfig(null);
    setFormData({
      provider: 'NSE_OFFICIAL',
      api_key: '',
      api_secret: '',
      access_token: '',
      base_url: 'https://www.nseindia.com/api',
      websocket_url: '',
      rate_limit_per_minute: 100,
      is_primary: false
    });
    setDialogOpen(true);
  };

  const handleEditConfig = (config: APIConfig) => {
    setSelectedConfig(config);
    setFormData({
      provider: config.provider,
      api_key: '', // Don't populate for security
      api_secret: '',
      access_token: '',
      base_url: '',
      websocket_url: '',
      rate_limit_per_minute: config.rate_limit_per_minute,
      is_primary: config.is_primary
    });
    setDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      const url = selectedConfig
        ? `/api/market-data/api-config/${selectedConfig.id}/`
        : '/api/market-data/api-config/';
      
      const method = selectedConfig ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchConfigurations();
        alert(selectedConfig ? 'Configuration updated!' : 'Configuration created!');
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    }
  };

  const handleTestConnection = async (configId: string) => {
    try {
      const response = await fetch(`/api/market-data/api-config/${configId}/test_connection/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const result = await response.json();
      alert(result.message);
      fetchConfigurations();
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    }
  };

  const handleSetPrimary = async (configId: string) => {
    try {
      const response = await fetch(`/api/market-data/api-config/${configId}/set_primary/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        fetchConfigurations();
        alert('Configuration set as primary!');
      }
    } catch (error) {
      console.error('Error setting primary:', error);
      alert('Error setting as primary');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'ERROR': return 'error';
      case 'TESTING': return 'warning';
      default: return 'default';
    }
  };

  const getProviderDisplay = (provider: string) => {
    const providers: { [key: string]: string } = {
      'NSE_OFFICIAL': 'NSE Official',
      'ZERODHA_KITE': 'Zerodha Kite',
      'UPSTOX': 'Upstox',
      'ANGEL_BROKING': 'Angel Broking',
      'ALPHA_VANTAGE': 'Alpha Vantage',
      'FINNHUB': 'Finnhub'
    };
    return providers[provider] || provider;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Market Data Configuration 📊
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddConfig}
            sx={{ borderRadius: 2 }}
          >
            Add API Provider
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Configure NSE API keys and data providers for real-time market data streaming
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Dashboard Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Daily API Calls
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.api_stats.daily_calls.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Cable color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Connections
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.connection_stats.active_connections}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Errors Today
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.connection_stats.error_logs_today}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Storage color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Provider Status
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {stats.api_stats.provider_status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* API Configurations */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            API Configurations
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchConfigurations}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Provider</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Primary</strong></TableCell>
                <TableCell><strong>Daily Calls</strong></TableCell>
                <TableCell><strong>Rate Limit</strong></TableCell>
                <TableCell><strong>Last Check</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getProviderDisplay(config.provider)}
                      </Typography>
                      {config.error_message && (
                        <Typography variant="caption" color="error">
                          {config.error_message}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={config.status}
                      color={getStatusColor(config.status) as any}
                      size="small"
                      icon={config.status === 'ACTIVE' ? <CheckCircleIcon /> : <ErrorIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    {config.is_primary ? (
                      <Chip label="Primary" color="primary" size="small" />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSetPrimary(config.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{config.daily_api_calls.toLocaleString()}</TableCell>
                  <TableCell>{config.rate_limit_per_minute}/min</TableCell>
                  <TableCell>
                    {config.last_health_check
                      ? new Date(config.last_health_check).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Test Connection">
                        <IconButton
                          size="small"
                          onClick={() => handleTestConnection(config.id)}
                          color="primary"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Configuration">
                        <IconButton
                          size="small"
                          onClick={() => handleEditConfig(config)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {configs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <SettingsIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6">No API configurations found</Typography>
              <Typography variant="body2">Add your first API provider to get started</Typography>
            </Box>
          )}
        </TableContainer>
      </Paper>

      {/* Top Symbols */}
      {stats && stats.top_symbols.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Most Subscribed Symbols
          </Typography>
          <Grid container spacing={2}>
            {stats.top_symbols.slice(0, 10).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={item.symbol}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    #{index + 1} {item.symbol}
                  </Typography>
                  <Chip
                    label={`${item.subscribers} users`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedConfig ? 'Edit API Configuration' : 'Add API Configuration'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={formData.provider}
                    label="Provider"
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  >
                    <MenuItem value="NSE_OFFICIAL">NSE Official</MenuItem>
                    <MenuItem value="ZERODHA_KITE">Zerodha Kite</MenuItem>
                    <MenuItem value="UPSTOX">Upstox</MenuItem>
                    <MenuItem value="ANGEL_BROKING">Angel Broking</MenuItem>
                    <MenuItem value="ALPHA_VANTAGE">Alpha Vantage</MenuItem>
                    <MenuItem value="FINNHUB">Finnhub</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  required
                  helperText="Your API key will be encrypted and stored securely"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Secret (Optional)"
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Access Token (Optional)"
                  type="password"
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Base URL"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="WebSocket URL (Optional)"
                  value={formData.websocket_url}
                  onChange={(e) => setFormData({ ...formData, websocket_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rate Limit (per minute)"
                  type="number"
                  value={formData.rate_limit_per_minute}
                  onChange={(e) => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    />
                  }
                  label="Set as Primary Provider"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveConfig}
            disabled={!formData.api_key}
          >
            {selectedConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MarketDataConfig;
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save,
  Email,
  Visibility,
  VisibilityOff,
  Science,
  Info,
} from '@mui/icons-material';
import { emailConfigService, EmailConfiguration as EmailConfigType, EmailTestRequest } from '../../services/emailConfig';

const EmailConfiguration: React.FC = () => {
  const [config, setConfig] = useState<EmailConfigType>({
    provider: 'GMAIL',
    auth_method: 'PASSWORD',
    is_active: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    use_tls: true,
    use_ssl: false,
    email_address: '',
    email_password: '',
    oauth2_client_id: '',
    oauth2_client_secret: '',
    oauth2_refresh_token: '',
    api_key: '',
    from_name: 'ShareWise AI',
    test_email: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await emailConfigService.getEmailConfiguration();
      if (data && data.provider) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load email configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: EmailConfigType['provider']) => {
    const presets = emailConfigService.getProviderPresets(provider);
    
    // Set default auth method based on provider
    let defaultAuthMethod: EmailConfigType['auth_method'] = 'PASSWORD';
    if (['SENDGRID', 'MAILGUN', 'AWS_SES'].includes(provider)) {
      defaultAuthMethod = 'API_KEY';
    } else if (['GMAIL', 'OUTLOOK'].includes(provider)) {
      defaultAuthMethod = 'OAUTH2'; // Recommend OAuth2 for Gmail/Outlook
    }
    
    setConfig(prev => ({
      ...prev,
      provider,
      auth_method: defaultAuthMethod,
      ...presets,
      // Clear auth fields when provider changes
      email_password: '',
      oauth2_client_id: '',
      oauth2_client_secret: '',
      oauth2_refresh_token: '',
      api_key: '',
    }));
    setHasChanges(true);
  };

  const handleFieldChange = (field: keyof EmailConfigType, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await emailConfigService.updateEmailConfiguration(config);
      setHasChanges(false);
      setTestResult({ success: true, message: 'Email configuration saved successfully!' });
    } catch (error: any) {
      console.error('Failed to save email configuration:', error);
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || 'Failed to save configuration' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter a test email address' });
      return;
    }

    try {
      setTesting(true);
      const testData: EmailTestRequest = {
        test_email: testEmail,
        test_message: 'This is a test email to verify your ShareWise AI email configuration.',
      };
      
      const result = await emailConfigService.testEmailConfiguration(testData);
      setTestResult({
        success: result.success,
        message: result.message || result.error || 'Test completed',
      });
    } catch (error: any) {
      console.error('Failed to test email configuration:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading email configuration...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <Email sx={{ mr: 1 }} />
            Email Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure SMTP settings for sending verification emails and notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Science />}
            onClick={() => setTestDialog(true)}
            disabled={!config.is_active}
          >
            Test Email
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>

      {testResult && (
        <Alert
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mb: 3 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Email Status */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: config.is_active ? 'success.main' : 'error.main',
                      mr: 2,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Email System Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {config.is_active 
                        ? 'Email sending is enabled and configured' 
                        : 'Email sending is disabled - configure and enable to send emails'
                      }
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.is_active}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                    />
                  }
                  label={config.is_active ? 'Enabled' : 'Disabled'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Configuration */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Email Provider</InputLabel>
            <Select
              value={config.provider}
              label="Email Provider"
              onChange={(e) => handleProviderChange(e.target.value as EmailConfigType['provider'])}
            >
              <MenuItem value="GMAIL">Gmail</MenuItem>
              <MenuItem value="OUTLOOK">Outlook</MenuItem>
              <MenuItem value="SENDGRID">SendGrid</MenuItem>
              <MenuItem value="MAILGUN">Mailgun</MenuItem>
              <MenuItem value="AWS_SES">Amazon SES</MenuItem>
              <MenuItem value="CUSTOM">Custom SMTP</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Authentication Method</InputLabel>
            <Select
              value={config.auth_method}
              label="Authentication Method"
              onChange={(e) => handleFieldChange('auth_method', e.target.value)}
            >
              <MenuItem value="PASSWORD">Username/Password</MenuItem>
              <MenuItem value="OAUTH2" disabled={!['GMAIL', 'OUTLOOK'].includes(config.provider)}>
                OAuth2 (Recommended for Gmail/Outlook)
              </MenuItem>
              <MenuItem value="API_KEY" disabled={!['SENDGRID', 'MAILGUN', 'AWS_SES'].includes(config.provider)}>
                API Key
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="From Name"
            value={config.from_name}
            onChange={(e) => handleFieldChange('from_name', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Display name shown in emails (e.g., ShareWise AI)"
          />

          <TextField
            label="Email Address"
            type="email"
            value={config.email_address}
            onChange={(e) => handleFieldChange('email_address', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Email address to send from"
          />

          {/* Authentication Fields */}
          {config.auth_method === 'PASSWORD' && (
            <TextField
              label="Email Password"
              type={showPassword ? 'text' : 'password'}
              value={config.email_password || ''}
              onChange={(e) => handleFieldChange('email_password', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText={config.provider === 'GMAIL' ? 'Use App Password (not regular password)' : 'SMTP password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {config.auth_method === 'API_KEY' && (
            <TextField
              label="API Key"
              type={showPassword ? 'text' : 'password'}
              value={config.api_key || ''}
              onChange={(e) => handleFieldChange('api_key', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Your service provider API key"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {config.auth_method === 'OAUTH2' && (
            <>
              <TextField
                label="OAuth2 Client ID"
                value={config.oauth2_client_id || ''}
                onChange={(e) => handleFieldChange('oauth2_client_id', e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                helperText="OAuth2 application client ID"
              />
              <TextField
                label="OAuth2 Client Secret"
                type={showPassword ? 'text' : 'password'}
                value={config.oauth2_client_secret || ''}
                onChange={(e) => handleFieldChange('oauth2_client_secret', e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                helperText="OAuth2 application client secret"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="OAuth2 Refresh Token"
                type={showPassword ? 'text' : 'password'}
                value={config.oauth2_refresh_token || ''}
                onChange={(e) => handleFieldChange('oauth2_refresh_token', e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                helperText="OAuth2 refresh token (obtained during setup)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
        </Grid>

        {/* SMTP Configuration */}
        <Grid item xs={12} md={6}>
          <TextField
            label="SMTP Host"
            value={config.smtp_host}
            onChange={(e) => handleFieldChange('smtp_host', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            disabled={config.provider !== 'CUSTOM'}
          />

          <TextField
            label="SMTP Port"
            type="number"
            value={config.smtp_port}
            onChange={(e) => handleFieldChange('smtp_port', parseInt(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
            disabled={config.provider !== 'CUSTOM'}
          />

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.use_tls}
                  onChange={(e) => handleFieldChange('use_tls', e.target.checked)}
                  disabled={config.provider !== 'CUSTOM'}
                />
              }
              label="Use TLS"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.use_ssl}
                  onChange={(e) => handleFieldChange('use_ssl', e.target.checked)}
                  disabled={config.provider !== 'CUSTOM'}
                />
              }
              label="Use SSL"
            />
          </Box>
        </Grid>

        {/* Configuration Help */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'info.light', border: '1px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Info sx={{ color: 'info.main', mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Setup Instructions
                  </Typography>
                  {config.provider === 'GMAIL' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Gmail Setup ({config.auth_method}):</strong>
                      </Typography>
                      {config.auth_method === 'PASSWORD' && (
                        <Typography variant="body2" component="div">
                          1. Enable 2-Factor Authentication on your Google account<br />
                          2. Go to Google Account Settings → Security → 2-Step Verification<br />
                          3. Generate an App Password: Account Settings → Security → App passwords<br />
                          4. Use the 16-character App Password (not your regular password)<br />
                          5. Use your full Gmail address as the email address
                        </Typography>
                      )}
                      {config.auth_method === 'OAUTH2' && (
                        <Typography variant="body2" component="div">
                          1. Go to Google Cloud Console → APIs & Services → Credentials<br />
                          2. Create OAuth2 credentials for a web application<br />
                          3. Add authorized redirect URI for your application<br />
                          4. Use the generated Client ID and Client Secret<br />
                          5. Obtain refresh token through OAuth2 flow<br />
                          <strong>Note:</strong> OAuth2 is more secure than app passwords
                        </Typography>
                      )}
                    </Box>
                  )}
                  {config.provider === 'OUTLOOK' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Outlook Setup ({config.auth_method}):</strong>
                      </Typography>
                      {config.auth_method === 'PASSWORD' && (
                        <Typography variant="body2" component="div">
                          1. Enable 2-Factor Authentication if not already enabled<br />
                          2. Use your full Outlook email address<br />
                          3. Use your regular password or App Password if 2FA is enabled
                        </Typography>
                      )}
                      {config.auth_method === 'OAUTH2' && (
                        <Typography variant="body2" component="div">
                          1. Register app in Azure AD/Microsoft 365 admin center<br />
                          2. Configure API permissions for Mail.Send<br />
                          3. Generate client secret in app registration<br />
                          4. Use Microsoft Graph OAuth2 endpoints<br />
                          <strong>Note:</strong> OAuth2 is recommended for enterprise accounts
                        </Typography>
                      )}
                    </Box>
                  )}
                  {config.provider === 'SENDGRID' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>SendGrid Setup:</strong>
                      </Typography>
                      {config.auth_method === 'API_KEY' ? (
                        <Typography variant="body2" component="div">
                          1. Log in to SendGrid dashboard<br />
                          2. Go to Settings → API Keys<br />
                          3. Create a new API key with "Mail Send" permissions<br />
                          4. Copy the generated API key<br />
                          5. Use "apikey" as username (if required)
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          Use API Key authentication for SendGrid (most secure method).
                        </Typography>
                      )}
                    </Box>
                  )}
                  {config.provider === 'MAILGUN' && config.auth_method === 'API_KEY' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Mailgun Setup:</strong>
                      </Typography>
                      <Typography variant="body2" component="div">
                        1. Log in to Mailgun dashboard<br />
                        2. Go to Settings → API Keys<br />
                        3. Copy your Private API key<br />
                        4. Use "api" as username with the API key as password
                      </Typography>
                    </Box>
                  )}
                  {config.provider === 'AWS_SES' && config.auth_method === 'API_KEY' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>AWS SES Setup:</strong>
                      </Typography>
                      <Typography variant="body2" component="div">
                        1. Create IAM user with SES permissions<br />
                        2. Generate access key and secret key<br />
                        3. Use access key as username and secret key as password<br />
                        4. Ensure your email/domain is verified in SES
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Email Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Email Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will send a test email to verify your configuration is working correctly.
          </Alert>
          <TextField
            label="Test Email Address"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            fullWidth
            margin="normal"
            helperText="Enter an email address to receive the test email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTest}
            disabled={testing || !testEmail}
            startIcon={testing ? <CircularProgress size={16} /> : <Science />}
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmailConfiguration;
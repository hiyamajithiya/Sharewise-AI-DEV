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
            InputLabelProps={{
              shrink: !!config.from_name,
            }}
            helperText="Display name shown in emails (e.g., ShareWise AI)"
          />

          <TextField
            label="Email Address"
            type="email"
            value={config.email_address}
            onChange={(e) => handleFieldChange('email_address', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: !!config.email_address,
            }}
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
              InputLabelProps={{
                shrink: !!config.email_password,
              }}
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
              InputLabelProps={{
                shrink: !!config.api_key,
              }}
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
                InputLabelProps={{
                  shrink: !!config.oauth2_client_id,
                }}
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
                InputLabelProps={{
                  shrink: !!config.oauth2_client_secret,
                }}
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
                InputLabelProps={{
                  shrink: !!config.oauth2_refresh_token,
                }}
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
            InputLabelProps={{
              shrink: true,
            }}
            helperText={config.provider !== 'CUSTOM' ? 'Auto-configured based on selected provider' : 'Enter your SMTP server address'}
          />

          <TextField
            label="SMTP Port"
            type="number"
            value={config.smtp_port}
            onChange={(e) => handleFieldChange('smtp_port', parseInt(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
            disabled={config.provider !== 'CUSTOM'}
            InputLabelProps={{
              shrink: true,
            }}
            helperText={config.provider !== 'CUSTOM' ? 'Auto-configured based on selected provider' : 'Common ports: 587 (TLS), 465 (SSL), 25'}
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
          <Card sx={{ 
            bgcolor: config.provider === 'GMAIL' ? 'rgba(219, 68, 55, 0.1)' :
                     config.provider === 'OUTLOOK' ? 'rgba(0, 120, 212, 0.1)' :
                     config.provider === 'SENDGRID' ? 'rgba(0, 122, 255, 0.1)' :
                     config.provider === 'MAILGUN' ? 'rgba(255, 0, 0, 0.1)' :
                     config.provider === 'AWS_SES' ? 'rgba(255, 153, 0, 0.1)' :
                     'info.light',
            border: '1px solid', 
            borderColor: config.provider === 'GMAIL' ? 'rgba(219, 68, 55, 0.3)' :
                        config.provider === 'OUTLOOK' ? 'rgba(0, 120, 212, 0.3)' :
                        config.provider === 'SENDGRID' ? 'rgba(0, 122, 255, 0.3)' :
                        config.provider === 'MAILGUN' ? 'rgba(255, 0, 0, 0.3)' :
                        config.provider === 'AWS_SES' ? 'rgba(255, 153, 0, 0.3)' :
                        'info.main'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Info sx={{ 
                  color: config.provider === 'GMAIL' ? '#db4437' :
                        config.provider === 'OUTLOOK' ? '#0078d4' :
                        config.provider === 'SENDGRID' ? '#007aff' :
                        config.provider === 'MAILGUN' ? '#ff0000' :
                        config.provider === 'AWS_SES' ? '#ff9900' :
                        'info.main',
                  mr: 2, 
                  mt: 0.5 
                }} />
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Setup Instructions for {config.provider === 'CUSTOM' ? 'Custom SMTP' : config.provider.replace('_', ' ')}
                  </Typography>
                  {config.provider === 'GMAIL' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>⚠️ Important:</strong> Gmail requires special authentication setup for third-party apps.
                        </Typography>
                      </Alert>
                      
                      {config.auth_method === 'PASSWORD' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#db4437' }}>
                            📧 App Password Method (Recommended for Quick Setup):
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Enable 2-Factor Authentication</strong><br />
                              • Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener">Google Account Security</a><br />
                              • Click on "2-Step Verification" and follow the setup process<br />
                              • This is required before you can create App Passwords
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Generate App Password</strong><br />
                              • Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener">App Passwords Page</a><br />
                              • Select "Mail" and your device type<br />
                              • Click "Generate" to create a 16-character password<br />
                              • <strong>Copy this password immediately</strong> (you won't see it again)
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: Configure in ShareWise</strong><br />
                              • Email Address: Your full Gmail address (e.g., yourname@gmail.com)<br />
                              • Password: The 16-character App Password (spaces are optional)<br />
                              • SMTP Settings are pre-configured for Gmail
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {config.auth_method === 'OAUTH2' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#db4437' }}>
                            🔐 OAuth2 Method (Most Secure):
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Create Google Cloud Project</strong><br />
                              • Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a><br />
                              • Create a new project or select existing one<br />
                              • Enable Gmail API for the project
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Create OAuth2 Credentials</strong><br />
                              • Navigate to APIs & Services → Credentials<br />
                              • Click "Create Credentials" → "OAuth client ID"<br />
                              • Application type: "Web application"<br />
                              • Add authorized redirect URI: <code>http://localhost:3000/oauth/callback</code><br />
                              • Save Client ID and Client Secret
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: Obtain Refresh Token</strong><br />
                              • Use OAuth2 Playground or implement OAuth flow<br />
                              • Scope needed: <code>https://mail.google.com/</code><br />
                              • Exchange authorization code for refresh token<br />
                              • This token allows permanent access without re-authentication
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>Common Issues:</strong><br />
                          • "Less secure app access" is no longer available since May 2022<br />
                          • Regular passwords will NOT work - you must use App Password or OAuth2<br />
                          • Ensure your account has 2FA enabled before generating App Passwords
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  {config.provider === 'OUTLOOK' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>📧 Microsoft Outlook/Office 365 Email Configuration</strong>
                        </Typography>
                      </Alert>
                      
                      {config.auth_method === 'PASSWORD' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#0078d4' }}>
                            🔑 App Password Method:
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Enable Two-Step Verification</strong><br />
                              • Go to <a href="https://account.microsoft.com/security" target="_blank" rel="noopener">Microsoft Account Security</a><br />
                              • Enable "Two-step verification"<br />
                              • Follow the setup wizard to complete 2FA setup
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Create App Password</strong><br />
                              • Go to <a href="https://account.microsoft.com/security/apppasswords" target="_blank" rel="noopener">App Passwords Page</a><br />
                              • Click "Create a new app password"<br />
                              • Copy the generated password (you won't see it again)<br />
                              • Use this password instead of your regular account password
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: SMTP Configuration</strong><br />
                              • Email: Your full Outlook/Office 365 email<br />
                              • Password: The App Password you just generated<br />
                              • SMTP Host: <code>smtp-mail.outlook.com</code> (Outlook) or <code>smtp.office365.com</code> (Office 365)<br />
                              • Port: 587 (TLS) or 25
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {config.auth_method === 'OAUTH2' && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#0078d4' }}>
                            🔐 OAuth2/Modern Authentication (Enterprise):
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Register Application in Azure AD</strong><br />
                              • Go to <a href="https://portal.azure.com" target="_blank" rel="noopener">Azure Portal</a><br />
                              • Navigate to Azure Active Directory → App registrations<br />
                              • Click "New registration" and configure your app<br />
                              • Redirect URI: <code>http://localhost:3000/oauth/callback</code>
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Configure API Permissions</strong><br />
                              • Add Microsoft Graph API permissions<br />
                              • Required permissions: <code>Mail.Send</code>, <code>Mail.ReadWrite</code><br />
                              • Grant admin consent if required by your organization
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: Generate Client Secret</strong><br />
                              • Go to Certificates & secrets<br />
                              • Create new client secret<br />
                              • Copy the secret value immediately<br />
                              • Use Application (client) ID and secret in configuration
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>Important Notes:</strong><br />
                          • Basic authentication is being phased out for many Microsoft accounts<br />
                          • OAuth2/Modern Auth is required for most enterprise Office 365 accounts<br />
                          • Personal Outlook.com accounts may still use App Passwords
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  {config.provider === 'SENDGRID' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>📮 SendGrid Professional Email Service</strong>
                        </Typography>
                      </Alert>
                      
                      {config.auth_method === 'API_KEY' ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#007aff' }}>
                            🔐 API Key Configuration:
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Access SendGrid Dashboard</strong><br />
                              • Log in to <a href="https://app.sendgrid.com" target="_blank" rel="noopener">SendGrid Dashboard</a><br />
                              • Navigate to Settings → API Keys<br />
                              • Click "Create API Key"
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Configure API Key Permissions</strong><br />
                              • Choose "Restricted Access" for security<br />
                              • Enable permissions: Mail Send (Full Access)<br />
                              • Optionally enable: Template Engine, Tracking<br />
                              • Click "Create & View" to generate the key
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: Save and Configure</strong><br />
                              • <strong>Copy the API key immediately</strong> (shown only once)<br />
                              • In ShareWise, paste the API key in the API Key field<br />
                              • SMTP Host: <code>smtp.sendgrid.net</code><br />
                              • Port: 587 (TLS) or 465 (SSL)<br />
                              • Username: <code>apikey</code> (literal string)<br />
                              • Password: Your API key
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 4: Sender Authentication (Required)</strong><br />
                              • Go to Settings → Sender Authentication<br />
                              • Verify your sending domain or email address<br />
                              • Complete DNS verification for domain authentication<br />
                              • This improves deliverability and prevents spam marking
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          <Typography variant="body2">
                            Please select <strong>API Key</strong> authentication method for SendGrid.
                            SendGrid requires API key authentication for security.
                          </Typography>
                        </Alert>
                      )}
                      
                      <Alert severity="success" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>SendGrid Benefits:</strong><br />
                          • High deliverability rates with reputation monitoring<br />
                          • Real-time analytics and email tracking<br />
                          • Scales from free tier (100 emails/day) to enterprise
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  {config.provider === 'MAILGUN' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>🚀 Mailgun Developer-Friendly Email Service</strong>
                        </Typography>
                      </Alert>
                      
                      {config.auth_method === 'API_KEY' ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#ff0000' }}>
                            🔑 API Key Setup:
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Get Your API Keys</strong><br />
                              • Log in to <a href="https://app.mailgun.com" target="_blank" rel="noopener">Mailgun Dashboard</a><br />
                              • Navigate to Settings → API Keys<br />
                              • Copy your Private API key (starts with key-)<br />
                              • Note your sending domain (e.g., mg.yourdomain.com)
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Domain Configuration</strong><br />
                              • Go to Sending → Domains<br />
                              • Add and verify your domain<br />
                              • Add DNS records as instructed (SPF, DKIM, MX)<br />
                              • Wait for verification (usually 24-48 hours)
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: SMTP Configuration</strong><br />
                              • SMTP Host: <code>smtp.mailgun.org</code> (US) or <code>smtp.eu.mailgun.org</code> (EU)<br />
                              • Port: 587 (TLS) or 465 (SSL)<br />
                              • Username: <code>postmaster@YOUR_DOMAIN</code><br />
                              • Password: Your Private API key<br />
                              • Or use Username: <code>api</code> with API key as password
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 4: Regional Settings</strong><br />
                              • Choose your region: US or EU<br />
                              • EU region complies with GDPR requirements<br />
                              • Use region-specific endpoints for better performance
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          <Typography variant="body2">
                            Please select <strong>API Key</strong> authentication for Mailgun.
                          </Typography>
                        </Alert>
                      )}
                      
                      <Alert severity="success" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>Mailgun Features:</strong><br />
                          • Powerful email validation and verification<br />
                          • Detailed logs and analytics for 3 days (free) or 30 days (paid)<br />
                          • Excellent API documentation and SDKs
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  {config.provider === 'AWS_SES' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>☁️ Amazon SES (Simple Email Service)</strong>
                        </Typography>
                      </Alert>
                      
                      {config.auth_method === 'API_KEY' ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#ff9900' }}>
                            🔐 AWS Credentials Setup:
                          </Typography>
                          <Box sx={{ pl: 2, mb: 2 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 1: Create IAM User</strong><br />
                              • Go to <a href="https://console.aws.amazon.com/iam" target="_blank" rel="noopener">AWS IAM Console</a><br />
                              • Create new IAM user with programmatic access<br />
                              • Attach policy: <code>AmazonSESFullAccess</code> or create custom policy<br />
                              • Save Access Key ID and Secret Access Key
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 2: Verify Email/Domain in SES</strong><br />
                              • Go to <a href="https://console.aws.amazon.com/ses" target="_blank" rel="noopener">Amazon SES Console</a><br />
                              • Navigate to Verified identities<br />
                              • Add and verify your sending email or domain<br />
                              • Complete DNS verification for domains (DKIM, SPF)
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 3: Request Production Access</strong><br />
                              • New AWS accounts start in Sandbox mode<br />
                              • Submit request to move to Production<br />
                              • Explain your use case and expected volume<br />
                              • Wait for approval (usually 24 hours)
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>Step 4: SMTP Configuration</strong><br />
                              • SMTP Endpoint varies by region:<br />
                              • US East: <code>email-smtp.us-east-1.amazonaws.com</code><br />
                              • EU West: <code>email-smtp.eu-west-1.amazonaws.com</code><br />
                              • Port: 587 (TLS) or 465 (SSL)<br />
                              • Generate SMTP credentials from IAM (different from access keys)<br />
                              • Or use Access Key as username, Secret Key as password
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          <Typography variant="body2">
                            Please select <strong>API Key</strong> authentication for AWS SES.
                          </Typography>
                        </Alert>
                      )}
                      
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>AWS SES Notes:</strong><br />
                          • Sandbox mode limits: 200 emails/day, 1 email/second<br />
                          • Production mode: 50,000+ emails/day based on reputation<br />
                          • Very cost-effective: $0.10 per 1,000 emails<br />
                          • Integrates well with other AWS services
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  {config.provider === 'CUSTOM' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>⚙️ Custom SMTP Server Configuration</strong>
                        </Typography>
                      </Alert>
                      
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#666' }}>
                          🔧 Manual SMTP Configuration:
                        </Typography>
                        <Box sx={{ pl: 2, mb: 2 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Common SMTP Settings:</strong><br />
                            • SMTP Host: Your mail server address (e.g., mail.yourdomain.com)<br />
                            • SMTP Port: Common ports are:<br />
                            &nbsp;&nbsp;- 25: Default SMTP (often blocked by ISPs)<br />
                            &nbsp;&nbsp;- 587: TLS/STARTTLS (recommended)<br />
                            &nbsp;&nbsp;- 465: SSL (legacy, but still used)<br />
                            &nbsp;&nbsp;- 2525: Alternative SMTP port
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Security Settings:</strong><br />
                            • Use TLS: Enable for STARTTLS on port 587<br />
                            • Use SSL: Enable for SSL/TLS on port 465<br />
                            • Most modern servers use TLS on port 587
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Authentication:</strong><br />
                            • Username: Usually your full email address<br />
                            • Password: Your email account password<br />
                            • Some servers may use different username formats
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Popular Hosting Providers:</strong><br />
                            • <strong>cPanel/WHM:</strong> mail.yourdomain.com, Port 587, TLS<br />
                            • <strong>Plesk:</strong> smtp.yourdomain.com, Port 587, TLS<br />
                            • <strong>Zoho:</strong> smtp.zoho.com, Port 587, TLS<br />
                            • <strong>Yandex:</strong> smtp.yandex.com, Port 587, TLS<br />
                            • <strong>ProtonMail:</strong> Requires Bridge application
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          <strong>Troubleshooting Tips:</strong><br />
                          • Check with your hosting provider for exact SMTP settings<br />
                          • Ensure your IP is not blacklisted for sending emails<br />
                          • Some servers require SPF/DKIM records for authentication<br />
                          • Firewall may block certain ports - check with your IT team
                        </Typography>
                      </Alert>
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
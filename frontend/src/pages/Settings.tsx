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
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Palette,
  AccountBalance,
  Edit,
  Save,
  Lock,
  CheckCircle,
  Star,
  Email,
  Link,
  Add,
  Refresh,
  Close,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import { setThemeMode } from '../store/slices/themeSlice';
import { updateUserProfile } from '../store/slices/authSlice';
import { RootState } from '../store';
import EmailConfiguration from '../components/settings/EmailConfiguration';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'subscription' | 'billing' | 'email' | 'brokers'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [brokerManageDialog, setBrokerManageDialog] = useState(false);
  const [selectedBrokerForManage, setSelectedBrokerForManage] = useState<any>(null);
  const [syncingAccounts, setSyncingAccounts] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: true,
    whatsapp: true
  });
  
  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  
  const [formData, setFormData] = useState({
    firstName: effectiveUser?.first_name || 'John',
    lastName: effectiveUser?.last_name || 'Doe',
    email: effectiveUser?.email || 'john.doe@example.com',
    phone: effectiveUser?.phone_number || '+91-9876543210',
    timezone: effectiveUser?.timezone || 'Asia/Kolkata',
    language: effectiveUser?.language || 'English',
    currency: effectiveUser?.currency || 'INR',
  });
  
  // Update form data when user data changes in Redux
  useEffect(() => {
    if (effectiveUser) {
      setFormData({
        firstName: effectiveUser.first_name || 'John',
        lastName: effectiveUser.last_name || 'Doe',
        email: effectiveUser.email || 'john.doe@example.com',
        phone: effectiveUser.phone_number || '+91-9876543210',
        timezone: effectiveUser.timezone || 'Asia/Kolkata',
        language: effectiveUser.language || 'English',
        currency: effectiveUser.currency || 'INR',
      });
    }
  }, [effectiveUser]);
  
  // Theme configuration
  const getThemeColors = (mode: 'light' | 'dark' | 'auto') => {
    const actualMode = mode === 'auto' ? 'light' : mode; // For demo, auto defaults to light
    
    if (actualMode === 'dark') {
      return {
        background: '#1a202c',
        surface: '#2d3748',
        primary: '#4a5568',
        secondary: '#718096',
        text: {
          primary: '#ffffff',
          secondary: '#e2e8f0',
          disabled: '#a0aec0',
        },
        border: '#4a5568',
        hover: '#4a5568',
      };
    } else {
      return {
        background: '#f5f7fa',
        surface: 'white',
        primary: '#1F2937',
        secondary: '#6B7280',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          disabled: '#9CA3AF',
        },
        border: '#e0e0e0',
        hover: '#f9fafb',
      };
    }
  };

  const theme = getThemeColors(themeMode);
  const subscriptionTier = effectiveUser?.subscription_tier || 'BASIC';
  
  // Check if user is super admin for email configuration
  const isSuperAdmin = effectiveUser?.role === 'SUPER_ADMIN';

  // Tier-based settings access
  const getTierFeatures = (tier: string): {
    advancedSecurity: boolean;
    prioritySupport: boolean;
    customThemes: boolean;
    apiAccess: boolean;
    portfolioExport: boolean;
    advancedNotifications: boolean;
    color: string;
    label: string;
    price: string;
  } => {
    switch (tier) {
      case 'BASIC':
        return {
          advancedSecurity: false,
          prioritySupport: false,
          customThemes: false,
          apiAccess: false,
          portfolioExport: false,
          advancedNotifications: false,
          color: 'info',
          label: 'Basic Plan',
          price: '₹999/month'
        };
      case 'PRO':
        return {
          advancedSecurity: true,
          prioritySupport: true,
          customThemes: true,
          apiAccess: false,
          portfolioExport: true,
          advancedNotifications: true,
          color: 'success',
          label: 'Pro Plan',
          price: '₹2,499/month'
        };
      case 'ELITE':
        return {
          advancedSecurity: true,
          prioritySupport: true,
          customThemes: true,
          apiAccess: true,
          portfolioExport: true,
          advancedNotifications: true,
          color: 'warning',
          label: 'Elite Plan',
          price: '₹4,999/month'
        };
      default:
        return getTierFeatures('BASIC');
    }
  };

  const tierFeatures = getTierFeatures(subscriptionTier);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      console.log('Saving settings:', formData);
      
      // Prepare the data for API call
      const profileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        timezone: formData.timezone,
        language: formData.language,
        currency: formData.currency,
      };
      
      // Dispatch Redux action to update profile
      const resultAction = await dispatch(updateUserProfile(profileData) as any);
      
      if (updateUserProfile.fulfilled.match(resultAction)) {
        console.log('Profile updated successfully:', resultAction.payload);
        setIsEditing(false);
        
        // Show success message
        alert('Profile settings saved successfully!');
      } else {
        throw new Error(resultAction.payload || 'Failed to update profile');
      }
      
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
    console.log(`${type} notifications ${notifications[type] ? 'disabled' : 'enabled'}`);
  };

  const handleDownloadInvoice = (month: string) => {
    console.log(`Downloading invoice for ${month}`);
    alert(`Invoice for ${month} would be downloaded in a real application.`);
  };

  const handleUpdatePayment = () => {
    setPaymentDialog(true);
  };

  const handleChangePassword = () => {
    setPasswordDialog(true);
  };

  // Broker Integration Handlers
  const handleAddBrokerAccount = () => {
    // In a real app, this would navigate to broker integration page or open a proper connection flow
    window.open('/broker-integration', '_blank');
  };

  const handleManageBroker = (brokerData: any) => {
    // In a real app, this would navigate to broker management page
    console.log('Managing broker account:', brokerData);
    // For now, just show in-page management options
    setSelectedBrokerForManage(brokerData);
    setBrokerManageDialog(true);
  };

  const handleBrokerSecurity = () => {
    // Navigate to the security section of settings
    setActiveSection('security');
  };

  const handleSyncAllAccounts = async () => {
    setSyncingAccounts(true);
    try {
      // Simulate actual API call to sync broker accounts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update UI to show sync completed
      console.log('Broker accounts synced successfully');
      
      // In a real app, you would update the account data from the API response
      // setAccountData(syncedData);
      
    } catch (error) {
      console.error('Failed to sync accounts:', error);
    } finally {
      setSyncingAccounts(false);
    }
  };

  const handleConnectBroker = (brokerName: string) => {
    // In a real app, this would start the OAuth flow or redirect to broker's API connection page
    console.log(`Initiating connection to ${brokerName}`);
    
    // Example: redirect to broker's OAuth page
    const brokerUrls = {
      'Angel Broking': 'https://smartapi.angelbroking.com/oauth',
      'Upstox': 'https://api.upstox.com/v2/login/authorization',
      'ICICI Direct': '#' // Coming soon
    };
    
    const url = brokerUrls[brokerName as keyof typeof brokerUrls];
    if (url && url !== '#') {
      // In a real implementation, you'd handle the OAuth flow properly
      console.log(`Would redirect to: ${url}`);
      // window.open(url, '_blank');
    }
  };

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette /> },
    { id: 'brokers', label: 'Broker Integration', icon: <Link /> },
    { id: 'subscription', label: 'Subscription', icon: <Star /> },
    { id: 'billing', label: 'Billing', icon: <AccountBalance /> },
    ...(isSuperAdmin ? [{ id: 'email', label: 'Email Configuration', icon: <Email /> }] : []),
  ];

  const renderProfileSettings = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.text.primary, transition: 'color 0.3s ease' }}>
          Profile Information
        </Typography>
        <Button
          variant={isEditing ? 'contained' : 'outlined'}
          startIcon={isEditing ? <Save /> : <Edit />}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          sx={{
            color: isEditing ? 'white' : '#374151',
            borderColor: '#d1d5db',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: isEditing ? undefined : '#f9fafb',
            },
          }}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}>
          {effectiveUser?.first_name?.[0] || 'U'}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ color: '#1F2937' }}>
            {effectiveUser?.first_name || 'User'} {effectiveUser?.last_name || ''}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            {effectiveUser?.email || 'user@example.com'}
          </Typography>
          <Chip 
            label={tierFeatures.label} 
            color={tierFeatures.color as any} 
            size="small" 
            sx={{ mt: 1 }} 
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!isEditing}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiOutlinedInput-root': {
                color: '#1F2937',
                '& fieldset': { borderColor: '#d1d5db' },
                '&:hover fieldset': { borderColor: '#9ca3af' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!isEditing}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiOutlinedInput-root': {
                color: '#1F2937',
                '& fieldset': { borderColor: '#d1d5db' },
                '&:hover fieldset': { borderColor: '#9ca3af' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditing}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditing}
            fullWidth
          />
        </Grid>
      </Grid>
    </Paper>
  );

  const renderSecuritySettings = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: theme.text.primary, transition: 'color 0.3s ease' }}>
        Security Settings
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon sx={{ color: '#1F2937' }}>
            <Lock />
          </ListItemIcon>
          <ListItemText
            primary="Change Password"
            secondary="Last changed 30 days ago"
            sx={{
              '& .MuiListItemText-primary': { color: '#1F2937' },
              '& .MuiListItemText-secondary': { color: '#6B7280' },
            }}
          />
          <ListItemSecondaryAction>
            <Button variant="outlined" size="small" onClick={handleChangePassword}>
              Change
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon sx={{ color: '#1F2937' }}>
            <Security />
          </ListItemIcon>
          <ListItemText
            primary="Two-Factor Authentication"
            secondary={tierFeatures.advancedSecurity ? "Enhanced 2FA enabled" : "Basic SMS verification"}
            sx={{
              '& .MuiListItemText-primary': { color: '#1F2937' },
              '& .MuiListItemText-secondary': { color: '#6B7280' },
            }}
          />
          <ListItemSecondaryAction>
            <Switch 
              checked={true}
              disabled={!tierFeatures.advancedSecurity}
              onChange={(e) => console.log('2FA toggle:', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>

        {!tierFeatures.advancedSecurity && (
          <ListItem>
            <Alert severity="info" sx={{ width: '100%' }}>
              <Typography variant="body2">
                <strong>Upgrade to Pro or Elite</strong> for advanced security features including 
                hardware key support, advanced 2FA options, and security audit logs.
              </Typography>
            </Alert>
          </ListItem>
        )}
      </List>

      {tierFeatures.advancedSecurity && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Advanced Security Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <CheckCircle color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Security Audit Logs</strong><br />
                    Track all account access and changes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <CheckCircle color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    <strong>Hardware Key Support</strong><br />
                    Use FIDO2/WebAuthn security keys
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );

  const renderNotificationSettings = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
        Notification Preferences
      </Typography>

      <List>
        <ListItem>
          <ListItemText
            primary="Email Notifications"
            secondary="Trading signals, portfolio updates"
          />
          <ListItemSecondaryAction>
            <Switch 
              checked={notifications.email} 
              onChange={() => handleNotificationToggle('email')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemText
            primary="Push Notifications"
            secondary="Mobile app notifications"
          />
          <ListItemSecondaryAction>
            <Switch 
              checked={notifications.push}
              onChange={() => handleNotificationToggle('push')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
          <ListItemText
            primary="SMS Alerts"
            secondary={tierFeatures.advancedNotifications ? "Advanced trade alerts" : "Basic price alerts"}
          />
          <ListItemSecondaryAction>
            <Switch 
              checked={notifications.sms && tierFeatures.advancedNotifications}
              disabled={!tierFeatures.advancedNotifications}
              onChange={() => handleNotificationToggle('sms')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
          <ListItemText
            primary="WhatsApp Updates"
            secondary="Daily portfolio summary"
          />
          <ListItemSecondaryAction>
            <Switch 
              checked={notifications.whatsapp && tierFeatures.advancedNotifications}
              disabled={!tierFeatures.advancedNotifications}
              onChange={() => handleNotificationToggle('whatsapp')}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      {!tierFeatures.advancedNotifications && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Upgrade to Pro or Elite</strong> for advanced notification features including 
            custom alert conditions, WhatsApp updates, and priority delivery.
          </Typography>
        </Alert>
      )}
    </Paper>
  );

  const renderPreferences = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: theme.text.primary, transition: 'color 0.3s ease' }}>
        App Preferences
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.text.secondary }}>Theme</InputLabel>
            <Select
              value={themeMode}
              label="Theme"
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark' | 'auto';
                dispatch(setThemeMode(newTheme));
              }}
              disabled={!tierFeatures.customThemes}
              sx={{
                color: theme.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.text.secondary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                },
                '& .MuiSelect-icon': {
                  color: theme.text.secondary,
                },
                transition: 'all 0.3s ease',
              }}
            >
              <MenuItem value="light">🌞 Light</MenuItem>
              <MenuItem value="dark" disabled={!tierFeatures.customThemes}>🌙 Dark</MenuItem>
              <MenuItem value="auto" disabled={!tierFeatures.customThemes}>🔄 Auto</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={formData.language}
              label="Language"
              onChange={(e) => handleInputChange('language', e.target.value)}
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Hindi">हिंदी</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={formData.timezone}
              label="Timezone"
              onChange={(e) => handleInputChange('timezone', e.target.value)}
            >
              <MenuItem value="Asia/Kolkata">India Standard Time</MenuItem>
              <MenuItem value="Asia/Dubai">UAE Time</MenuItem>
              <MenuItem value="UTC">UTC</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={formData.currency}
              label="Currency"
              onChange={(e) => handleInputChange('currency', e.target.value)}
            >
              <MenuItem value="INR">₹ Indian Rupee</MenuItem>
              <MenuItem value="USD">$ US Dollar</MenuItem>
              <MenuItem value="EUR">€ Euro</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Theme Preview */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 600, 
          mb: 2,
          color: theme.text.primary,
          transition: 'color 0.3s ease'
        }}>
          Theme Preview
        </Typography>
        <Box sx={{ 
          p: 3,
          borderRadius: '12px',
          background: theme.surface,
          border: `2px solid ${theme.border}`,
          transition: 'all 0.3s ease',
        }}>
          <Typography variant="h6" sx={{ 
            color: theme.text.primary, 
            mb: 1,
            transition: 'color 0.3s ease'
          }}>
            Current Theme: {themeMode === 'light' ? '🌞 Light Mode' : themeMode === 'dark' ? '🌙 Dark Mode' : '🔄 Auto Mode'}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.text.secondary,
            mb: 2,
            transition: 'color 0.3s ease'
          }}>
            This preview shows how the interface looks with the selected theme. 
            {themeMode === 'light' && ' Light theme uses bright backgrounds and dark text.'}
            {themeMode === 'dark' && ' Dark theme uses dark backgrounds and light text.'}
            {themeMode === 'auto' && ' Auto theme adapts to your system preferences.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{
              width: 60,
              height: 30,
              borderRadius: 2,
              background: theme.text.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.3s ease'
            }}>
              <Typography variant="caption" sx={{ 
                color: theme.surface,
                fontWeight: 600,
                transition: 'color 0.3s ease'
              }}>
                Text
              </Typography>
            </Box>
            <Box sx={{
              width: 60,
              height: 30,
              borderRadius: 2,
              background: theme.background,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              <Typography variant="caption" sx={{ 
                color: theme.text.primary,
                fontWeight: 600,
                transition: 'color 0.3s ease'
              }}>
                BG
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {!tierFeatures.customThemes && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Upgrade to Pro or Elite</strong> for custom themes, advanced personalization, 
            and premium interface options.
          </Typography>
        </Alert>
      )}
    </Paper>
  );

  const renderSubscription = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
        Current Subscription
      </Typography>

      <Card sx={{ mb: 3, bgcolor: `${tierFeatures.color}.light`, border: '2px solid', borderColor: `${tierFeatures.color}.main` }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: `${tierFeatures.color}.main` }}>
              {tierFeatures.label}
            </Typography>
            <Chip 
              label="ACTIVE" 
              color="success" 
              sx={{ fontWeight: 600 }} 
            />
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {tierFeatures.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Next billing date: January 15, 2025
          </Typography>
        </CardContent>
      </Card>

      {subscriptionTier !== 'ELITE' && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Upgrade Your Plan
          </Typography>
          <Grid container spacing={2}>
            {subscriptionTier === 'BASIC' && (
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', border: '1px solid', borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
                      Pro Plan
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      ₹2,499<Typography component="span" variant="body1">/month</Typography>
                    </Typography>
                    <List dense>
                      <ListItem sx={{ pl: 0 }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">Advanced analytics</Typography>
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">Priority support</Typography>
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">Advanced security</Typography>
                      </ListItem>
                    </List>
                    <Button 
                      variant="contained" 
                      color="success" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => setUpgradeDialog(true)}
                    >
                      Upgrade to Pro
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600 }}>
                      Elite Plan
                    </Typography>
                    <Chip label="BEST VALUE" size="small" color="warning" sx={{ ml: 1 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    ₹4,999<Typography component="span" variant="body1">/month</Typography>
                  </Typography>
                  <List dense>
                    <ListItem sx={{ pl: 0 }}>
                      <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">Everything in Pro</Typography>
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">API access</Typography>
                    </ListItem>
                    <ListItem sx={{ pl: 0 }}>
                      <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">Unlimited everything</Typography>
                    </ListItem>
                  </List>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    fullWidth 
                    sx={{ mt: 2 }}
                    onClick={() => setUpgradeDialog(true)}
                  >
                    Upgrade to Elite
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );

  const renderBilling = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
        Billing & Payments
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Payment Method
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccountBalance sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body2">**** **** **** 1234</Typography>
              <Typography variant="caption" color="text.secondary">
                Expires 12/25
              </Typography>
            </Box>
          </Box>
          <Button variant="outlined" size="small" onClick={handleUpdatePayment}>
            Update Payment Method
          </Button>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Recent Invoices
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="January 2025"
            secondary={`${tierFeatures.label} - ${tierFeatures.price}`}
          />
          <ListItemSecondaryAction>
            <Button 
              variant="outlined" 
              size="small"
              disabled={!tierFeatures.portfolioExport}
              onClick={() => handleDownloadInvoice('January 2025')}
            >
              Download
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemText
            primary="December 2024"
            secondary={`${tierFeatures.label} - ${tierFeatures.price}`}
          />
          <ListItemSecondaryAction>
            <Button 
              variant="outlined" 
              size="small"
              disabled={!tierFeatures.portfolioExport}
              onClick={() => handleDownloadInvoice('January 2025')}
            >
              Download
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </Paper>
  );

  const renderEmailConfiguration = () => (
    <EmailConfiguration />
  );

  const renderBrokerIntegration = () => (
    <Paper sx={{ 
      p: 3,
      borderRadius: '16px',
      background: 'white',
      border: '1px solid #e0e0e0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
        Broker Account Management
      </Typography>

      {/* Connected Accounts Summary */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        background: '#f8fafc', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0' 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
            Connected Accounts
          </Typography>
          {syncingAccounts && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Refresh sx={{ fontSize: 16, animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              <Typography variant="caption" sx={{ color: '#667eea' }}>
                Syncing...
              </Typography>
            </Box>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#10B981' }}>
                1
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Active Connections
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                ₹1.25L
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Total Balance
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                Live
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Trading Status
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Connected Broker Accounts */}
      <List>
        <ListItem>
          <ListItemIcon>
            <AccountBalance sx={{ color: '#10B981' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                  Zerodha
                </Typography>
                <Chip label="CONNECTED" color="success" size="small" />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                  Account: ZD1234 • Balance: ₹1,25,000
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  Last synced: 2 minutes ago
                </Typography>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleManageBroker({ name: 'Zerodha', accountId: 'ZD1234', status: 'CONNECTED', balance: 125000 })}
              sx={{ 
                color: '#667eea',
                borderColor: '#667eea',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  borderColor: '#5a67d8'
                }
              }}
            >
              Manage
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      {/* Quick Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddBrokerAccount}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
            },
          }}
        >
          Add Broker Account
        </Button>
        <Button
          variant="outlined"
          startIcon={<Security />}
          onClick={handleBrokerSecurity}
          sx={{
            color: '#374151',
            borderColor: '#d1d5db',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb',
            },
          }}
        >
          Security Settings
        </Button>
        <Button
          variant="outlined"
          startIcon={syncingAccounts ? <Refresh sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : <Refresh />}
          onClick={handleSyncAllAccounts}
          disabled={syncingAccounts}
          sx={{
            color: '#374151',
            borderColor: '#d1d5db',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb',
            },
            '&:disabled': {
              color: '#9ca3af',
              borderColor: '#e5e7eb'
            }
          }}
        >
          {syncingAccounts ? 'Syncing...' : 'Sync All Accounts'}
        </Button>
      </Box>

      {/* Security Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Security:</strong> Your broker credentials are encrypted and stored securely. 
          ShareWise AI never stores your login passwords - only API tokens for authorized trading operations.
        </Typography>
      </Alert>

      {/* Available Brokers */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
          Available Brokers
        </Typography>
        <Grid container spacing={2}>
          {[
            { name: 'Zerodha', status: 'Connected', color: '#10B981' },
            { name: 'Angel Broking', status: 'Available', color: '#6B7280' },
            { name: 'Upstox', status: 'Available', color: '#6B7280' },
            { name: 'ICICI Direct', status: 'Coming Soon', color: '#9CA3AF' }
          ].map((broker, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                variant="outlined"
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: '12px',
                  cursor: broker.status === 'Available' ? 'pointer' : 'default',
                  opacity: broker.status === 'Coming Soon' ? 0.6 : 1,
                  '&:hover': broker.status === 'Available' ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderColor: '#667eea'
                  } : {}
                }}
                onClick={() => {
                  if (broker.status === 'Available') {
                    handleConnectBroker(broker.name);
                  } else if (broker.status === 'Coming Soon') {
                    // Just log for coming soon brokers, no alert
                    console.log(`${broker.name} integration is coming soon`);
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>
                  {broker.name}
                </Typography>
                <Chip 
                  label={broker.status}
                  size="small"
                  sx={{ 
                    backgroundColor: broker.status === 'Connected' ? '#dcfce7' : 
                                   broker.status === 'Available' ? '#dbeafe' : '#f3f4f6',
                    color: broker.color,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      case 'preferences': return renderPreferences();
      case 'brokers': return renderBrokerIntegration();
      case 'subscription': return renderSubscription();
      case 'billing': return renderBilling();
      case 'email': return renderEmailConfiguration();
      default: return renderProfileSettings();
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.background,
      transition: 'background-color 0.3s ease',
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4,
        p: 3,
        borderRadius: '16px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 700, 
              mb: 1, 
              color: theme.text.primary,
              textShadow: themeMode === 'dark' ? '2px 2px 4px rgba(255,255,255,0.1)' : '2px 2px 4px rgba(0,0,0,0.2)',
              transition: 'color 0.3s ease',
            }}>
              Settings
            </Typography>
            <Typography variant="body1" sx={{ color: theme.text.secondary, transition: 'color 0.3s ease' }}>
              {isTestingMode && selectedUser
                ? `Testing settings for ${selectedUser.role} role - ${subscriptionTier} tier`
                : `Manage your ${subscriptionTier} account settings and preferences`
              }
            </Typography>
          </Box>
          <Chip 
            label={tierFeatures.label} 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.875rem',
              backgroundColor: tierFeatures.color === 'warning' ? '#ffa726' : tierFeatures.color === 'success' ? '#66bb6a' : '#42a5f5',
              color: 'white'
            }} 
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Navigation */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ 
            p: 2,
            borderRadius: '16px',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: themeMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          }}>
            <List component="nav">
              {settingsSections.map((section) => (
                <ListItem
                  key={section.id}
                  component="button"
                  selected={activeSection === section.id}
                  onClick={() => {
                    console.log('Navigating to:', section.id);
                    setActiveSection(section.id as any);
                  }}
                  sx={{ 
                    borderRadius: 2, 
                    mb: 0.5,
                    cursor: 'pointer',
                    color: theme.text.primary,
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      backgroundColor: themeMode === 'dark' ? '#4a5568' : '#e3f2fd',
                      color: themeMode === 'dark' ? '#90cdf4' : '#1976d2',
                      '& .MuiListItemIcon-root': {
                        color: themeMode === 'dark' ? '#90cdf4' : '#1976d2',
                      },
                    },
                    '&:hover': {
                      backgroundColor: theme.hover,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: theme.text.secondary, transition: 'color 0.3s ease' }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.label}
                    sx={{
                      '& .MuiListItemText-primary': { 
                        color: theme.text.primary,
                        transition: 'color 0.3s ease'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          {renderContent()}
        </Grid>
      </Grid>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upgrade Your Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a demo. In a real application, this would redirect to the payment gateway.
          </Alert>
          <Typography variant="body1">
            Upgrading your subscription will unlock premium features immediately after payment confirmation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setUpgradeDialog(false);
            alert('Redirecting to payment gateway...');
          }}>
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setPasswordDialog(false);
            alert('Password changed successfully!');
          }}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Payment Method</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a demo. In a real application, this would integrate with payment processors.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Card Number"
              placeholder="**** **** **** 1234"
              margin="normal"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  placeholder="MM/YY"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  placeholder="123"
                  margin="normal"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Cardholder Name"
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setPaymentDialog(false);
            alert('Payment method updated successfully!');
          }}>
            Update Payment Method
          </Button>
        </DialogActions>
      </Dialog>


      {/* Manage Broker Dialog */}
      <Dialog open={brokerManageDialog} onClose={() => setBrokerManageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
              Manage Broker Account
            </Typography>
            <IconButton onClick={() => setBrokerManageDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBrokerForManage && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ 
                p: 2, 
                mb: 3, 
                background: '#f8fafc', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0' 
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1F2937' }}>
                  {selectedBrokerForManage.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Account ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedBrokerForManage.accountId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Status</Typography>
                    <Chip label={selectedBrokerForManage.status} color="success" size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>Balance</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ₹{selectedBrokerForManage.balance?.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    alert('Refreshing account data...');
                  }}
                  fullWidth
                >
                  Refresh Account Data
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    alert('Opening trading settings...');
                  }}
                  fullWidth
                >
                  Trading Settings
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to disconnect this account?')) {
                      setBrokerManageDialog(false);
                      alert('Account disconnected successfully!');
                    }
                  }}
                  fullWidth
                >
                  Disconnect Account
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrokerManageDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      </Container>
    </Box>
  );
};

export default Settings;
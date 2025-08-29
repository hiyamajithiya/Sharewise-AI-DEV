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
  Divider,
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
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import { setThemeMode } from '../store/slices/themeSlice';
import { RootState } from '../store';
import EmailConfiguration from '../components/settings/EmailConfiguration';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'subscription' | 'billing' | 'email'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: true,
    whatsapp: true
  });
  
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    timezone: 'Asia/Kolkata',
    language: 'English',
    currency: 'INR',
  });

  const user = useSelector((state: any) => state.auth.user);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
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

  const handleSave = () => {
    console.log('Saving settings:', formData);
    setIsEditing(false);
    alert('Profile settings saved successfully!');
    // In real app, this would make API call
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

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette /> },
    { id: 'subscription', label: 'Subscription', icon: <Star /> },
    { id: 'billing', label: 'Billing', icon: <AccountBalance /> },
    ...(isSuperAdmin ? [{ id: 'email', label: 'Email Configuration', icon: <Email /> }] : []),
  ];

  const renderProfileSettings = () => (
      <Paper sx={{ 
        p: 3,
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Profile Information
        </Typography>
        <Button
          variant={isEditing ? 'contained' : 'outlined'}
          startIcon={isEditing ? <Save /> : <Edit />}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          sx={{
            color: isEditing ? 'white' : 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: isEditing ? undefined : 'rgba(255, 255, 255, 0.1)',
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
          <Typography variant="h6" sx={{ color: 'white' }}>
            {effectiveUser?.first_name || 'User'} {effectiveUser?.last_name || ''}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: 'white' },
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
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
        Security Settings
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon sx={{ color: 'white' }}>
            <Lock />
          </ListItemIcon>
          <ListItemText
            primary="Change Password"
            secondary="Last changed 30 days ago"
            sx={{
              '& .MuiListItemText-primary': { color: 'white' },
              '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' },
            }}
          />
          <ListItemSecondaryAction>
            <Button variant="outlined" size="small" onClick={handleChangePassword}>
              Change
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon sx={{ color: 'white' }}>
            <Security />
          </ListItemIcon>
          <ListItemText
            primary="Two-Factor Authentication"
            secondary={tierFeatures.advancedSecurity ? "Enhanced 2FA enabled" : "Basic SMS verification"}
            sx={{
              '& .MuiListItemText-primary': { color: 'white' },
              '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' },
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
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
        background: 'white',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
        App Preferences
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Theme</InputLabel>
            <Select
              value={themeMode}
              label="Theme"
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark' | 'auto';
                dispatch(setThemeMode(newTheme));
              }}
              disabled={!tierFeatures.customThemes}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark" disabled={!tierFeatures.customThemes}>Dark</MenuItem>
              <MenuItem value="auto" disabled={!tierFeatures.customThemes}>Auto</MenuItem>
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
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

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      case 'preferences': return renderPreferences();
      case 'subscription': return renderSubscription();
      case 'billing': return renderBilling();
      case 'email': return renderEmailConfiguration();
      default: return renderProfileSettings();
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f5f7fa',
      position: 'relative'
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
              Settings ⚙️
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
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
        <Divider />
      </Box>

      <Grid container spacing={3}>
        {/* Settings Navigation */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ 
            p: 2,
            borderRadius: '16px',
            background: 'white',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
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
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      '& .MuiListItemIcon-root': {
                        color: '#1976d2',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: '#6b7280' }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.label} 
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
      </Container>
    </Box>
  );
};

export default Settings;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { PersonAdd, Close } from '@mui/icons-material';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface UserFormData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  subscription_tier: string;
  is_active: boolean;
  email_verified: boolean;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'USER',
    subscription_tier: 'BASIC',
    is_active: true,
    email_verified: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field: keyof UserFormData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSwitchChange = (field: keyof UserFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.post('/users/admin/create-user/', formData);
      
      setSuccess('User created successfully!');
      onUserAdded();
      
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data) {
        const errorMessages = Object.entries(err.response.data).map(([field, messages]) => 
          `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        ).join('\n');
        setError(errorMessages);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'USER',
      subscription_tier: 'BASIC',
      is_active: true,
      email_verified: true,
    });
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  const roleOptions = [
    { value: 'USER', label: 'User' },
    { value: 'SALES', label: 'Sales Team' },
    { value: 'SUPPORT', label: 'Support Team' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
  ];

  const subscriptionOptions = [
    { value: 'BASIC', label: 'Basic Plan' },
    { value: 'PRO', label: 'Pro Plan' },
    { value: 'ELITE', label: 'Elite Plan' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Add New User
          </Typography>
          <Button onClick={handleClose} size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={loading}
                helperText="Minimum 8 characters"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleSelectChange('role')}
                  disabled={loading}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subscription Tier</InputLabel>
                <Select
                  value={formData.subscription_tier}
                  onChange={handleSelectChange('subscription_tier')}
                  disabled={loading}
                >
                  {subscriptionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleSwitchChange('is_active')}
                    disabled={loading}
                  />
                }
                label="Active User"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.email_verified}
                    onChange={handleSwitchChange('email_verified')}
                    disabled={loading}
                  />
                }
                label="Email Verified"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUserModal;
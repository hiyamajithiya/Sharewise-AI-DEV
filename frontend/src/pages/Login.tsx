import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { MockAuthService } from '../services/mockAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the redirect path from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.usernameOrEmail) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData) as any);
      if (loginUser.fulfilled.match(result)) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <LoadingSpinner message="Signing in..." />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Logo/Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 4px 8px rgba(0, 82, 204, 0.2)',
              }}
            >
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                S
              </Typography>
            </Box>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#0052CC', mb: 0 }}>
                ShareWise AI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professional Trading Platform
              </Typography>
            </Box>
          </Box>
          
          <Typography component="h2" variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Welcome Back
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="usernameOrEmail"
              label="Username or Email"
              name="usernameOrEmail"
              autoComplete="username"
              autoFocus
              value={formData.usernameOrEmail}
              onChange={handleChange}
              error={!!errors.usernameOrEmail}
              helperText={errors.usernameOrEmail}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              Sign In
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Demo Credentials Info */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2, fontWeight: 600 }}>
            📋 Demo Credentials
          </Typography>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'info.main' }}>
              Use these credentials to explore different subscription tiers:
            </Typography>
            {MockAuthService.getDemoCredentials().map((cred, index) => (
              <Box key={index} sx={{ mb: 1.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cred.tier} Plan
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                      setFormData({
                        usernameOrEmail: cred.email,
                        password: cred.password
                      });
                    }}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                  >
                    Use
                  </Button>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  Email: {cred.email}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  Username: {cred.username}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  Password: {cred.password}
                </Typography>
              </Box>
            ))}
          </Paper>
          <Typography variant="body2" color="text.secondary">
            Welcome to ShareWise AI - Your Intelligent Trading Platform
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Experience AI-powered trading with comprehensive market analysis
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
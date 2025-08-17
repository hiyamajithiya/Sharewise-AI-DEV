import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, TrendingUp, Analytics, Security, Speed, ShowChart, Assessment } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

  const features = [
    { icon: <TrendingUp />, title: 'Real-Time Analytics', description: 'Live market data and trend analysis' },
    { icon: <Security />, title: 'Secure Trading', description: 'Bank-level security for your investments' },
    { icon: <Speed />, title: 'Lightning Fast', description: 'Execute trades in milliseconds' },
    { icon: <ShowChart />, title: 'Advanced Charts', description: 'Professional technical analysis tools' },
    { icon: <Analytics />, title: 'AI Predictions', description: 'Machine learning powered insights' },
    { icon: <Assessment />, title: 'Portfolio Tracking', description: 'Monitor your complete portfolio' },
  ];

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <LoadingSpinner message="Signing in..." />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      <Grid container sx={{ flex: 1, height: '100%' }}>
        {/* Left Column - Branding */}
        <Grid 
          item 
          xs={12} 
          md={6}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              animation: 'rotate 30s linear infinite',
            },
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        >
          <Box sx={{ 
            zIndex: 1, 
            maxWidth: 550, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Logo */}
            <Box
              sx={{
                width: { xs: 70, sm: 80, md: 90 },
                height: { xs: 70, sm: 80, md: 90 },
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Typography variant="h1" sx={{ 
                color: 'white', 
                fontWeight: 900, 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}>
                S
              </Typography>
            </Box>

            {/* Brand Name */}
            <Typography variant="h2" sx={{ 
              color: 'white', 
              fontWeight: 800,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.3rem' },
              mb: 0.5,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}>
              ShareWise AI
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              mb: 3,
              fontWeight: 300,
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
            }}>
              Your Intelligent Trading Platform
            </Typography>

            {/* Features Grid */}
            <Grid container spacing={2} sx={{ mt: 2, px: 2 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      p: 2,
                      height: '100%',
                      minHeight: '80px',
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ 
                      color: 'white', 
                      mr: 2,
                      minWidth: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& svg': { fontSize: 28 },
                    }}>
                      {feature.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: 'white', 
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.95rem',
                        lineHeight: 1.2,
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.3,
                        fontSize: '0.8rem',
                        display: 'block',
                      }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        {/* Right Column - Login Form */}
        <Grid 
          item 
          xs={12} 
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: { xs: 2, sm: 3, md: 4 },
            backgroundColor: '#f8f9fa',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h3" sx={{ 
              mb: 1,
              fontWeight: 700,
              color: '#2D3748',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '2.5rem' },
            }}>
              Welcome Back
            </Typography>
            
            <Typography variant="body1" sx={{ 
              mb: 3,
              color: '#718096',
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}>
              Sign in to access your trading dashboard
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
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
                size="medium"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#667eea' }} />
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
                size="medium"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{ color: '#667eea' }}
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
                disabled={loading}
                sx={{ 
                  mt: 2, 
                  mb: 2, 
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  },
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body1"
                  sx={{
                    color: '#667eea',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo/Brand */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #0052CC 100%)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
                mb: 3,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '26px',
                  zIndex: -1,
                },
              }}
            >
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, fontSize: '2.2rem' }}>
                S
              </Typography>
            </Box>
            <Typography 
              component="h1" 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                textAlign: 'center',
              }}
            >
              ShareWise AI
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '1.1rem',
                mb: 2,
              }}
            >
              Professional Trading Platform
            </Typography>
          </Box>
          
          <Typography 
            component="h2" 
            variant="h4" 
            sx={{ 
              mb: 4, 
              fontWeight: 700,
              color: '#2D3748',
              textAlign: 'center',
            }}
          >
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
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
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
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
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
                      sx={{ 
                        color: '#667eea',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        },
                      }}
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
                mb: 3, 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-3px)',
                },
                '&:active': {
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #a0a0a0 0%, #808080 100%)',
                  boxShadow: 'none',
                  transform: 'none',
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
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#764ba2',
                    textDecoration: 'underline',
                  },
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Demo Credentials Info */}
        <Paper 
          sx={{ 
            mt: 4, 
            p: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 700,
              textAlign: 'center',
              color: '#2D3748',
            }}
          >
            🚀 Try Demo Accounts
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 3, 
              fontWeight: 500, 
              color: '#4A5568',
              textAlign: 'center',
            }}
          >
            Explore different subscription tiers with these demo credentials:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MockAuthService.getDemoCredentials().map((cred, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    {cred.tier} Plan
                  </Typography>
                  <Button 
                    size="medium" 
                    variant="contained"
                    onClick={() => {
                      setFormData({
                        usernameOrEmail: cred.email,
                        password: cred.password
                      });
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Use This Account
                  </Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.9rem' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#4A5568' }}>
                    <strong>Email:</strong> {cred.email}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#4A5568' }}>
                    <strong>Username:</strong> {cred.username}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#4A5568', gridColumn: '1 / -1' }}>
                    <strong>Password:</strong> {cred.password}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#4A5568', fontWeight: 500, mb: 1 }}>
              Welcome to ShareWise AI - Your Intelligent Trading Platform
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Experience AI-powered trading with comprehensive market analysis
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
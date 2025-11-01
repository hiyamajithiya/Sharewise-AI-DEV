import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
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
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import Footer from '../components/common/Footer';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
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
      const registerData = {
        ...formData,
        confirm_password: formData.confirmPassword,
      };
      const result = await dispatch(registerUser(registerData) as any);
      if (registerUser.fulfilled.match(result)) {
        // Redirect to email verification page
        navigate('/verify-email', {
          state: {
            email: formData.email,
            userId: result.payload.user_id,
            message: 'Registration successful! Please check your email for verification code.',
          },
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Container component="main" maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        <Box
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
          }}
        >
          {/* Logo/Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background: 'rgba(255, 255, 255, 0.2)',
                
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Typography variant="h5" sx={{ color: '#1F2937', fontWeight: 700 }}>
                S
              </Typography>
            </Box>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 0 }}>
                ShareWise AI
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                Elite Trading Platform
              </Typography>
            </Box>
          </Box>
          
          <Typography component="h2" variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1F2937' }}>
            Start Your Journey
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  name="first_name"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#6B7280' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      '& input': {
                        color: '#1F2937',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.4)',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                      '&.Mui-focused': {
                        color: '#1F2937',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#6B7280',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#6B7280' }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: '#f5f7fa',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.5)',
                },
              }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1F2937',
                  },
                }}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Box>

          {/* Terms Notice */}
          <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 600 }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              All trading involves risk and past performance does not guarantee future results.
            </Typography>
          </Box>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default Register;
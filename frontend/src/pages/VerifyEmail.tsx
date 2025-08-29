import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ArrowBack, Refresh, Email as EmailIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail, resendVerification, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Get data from navigation state
  const email = (location.state as any)?.email || '';
  const userId = (location.state as any)?.userId || '';
  const message = (location.state as any)?.message || '';
  
  const [otpCode, setOtpCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Redirect if no email or userId
  useEffect(() => {
    if (!email || !userId) {
      navigate('/register');
    }
  }, [email, userId, navigate]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      return;
    }

    try {
      const result = await dispatch(verifyEmail({ userId, otpCode }) as any);
      if (verifyEmail.fulfilled.match(result)) {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      const result = await dispatch(resendVerification(email) as any);
      if (resendVerification.fulfilled.match(result)) {
        setResendTimer(60); // 60 seconds cooldown
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Resend failed:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtpCode(value);
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
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
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
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, width: '100%' }}>
            <IconButton 
              onClick={() => navigate('/register')}
              sx={{ color: '#6B7280' }}
            >
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  background: 'rgba(255, 255, 255, 0.2)',
                  
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <EmailIcon sx={{ color: '#1F2937', fontSize: 24 }} />
              </Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 0 }}>
                Verify Email
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                Check your inbox for verification code
              </Typography>
            </Box>
          </Box>

          {/* Success message */}
          {message && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Verification code sent successfully!
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Email info */}
          <Box sx={{ textAlign: 'center', mb: 4, width: '100%' }}>
            <Typography variant="body1" sx={{ color: '#374151', mb: 1 }}>
              We sent a 6-digit verification code to:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 2 }}>
              {email}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              The code expires in 10 minutes
            </Typography>
          </Box>

          {/* OTP Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              required
              fullWidth
              id="otpCode"
              label="Verification Code"
              name="otpCode"
              value={otpCode}
              onChange={handleOtpChange}
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace',
                  color: '#1F2937',
                },
              }}
              placeholder="000000"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #e0e0e0',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: 'rgba(255,255,255,0.2)',
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
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || otpCode.length !== 6}
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                mb: 3,
                fontSize: '1rem',
                textTransform: 'none',
                background: '#f5f7fa',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.5)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Verify Email'
              )}
            </Button>

            {/* Resend section */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#374151', mb: 1 }}>
                Didn't receive the code?
              </Typography>
              
              {resendTimer > 0 ? (
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Resend available in {resendTimer}s
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  startIcon={resendLoading ? <CircularProgress size={16} sx={{ color: '#6B7280' }} /> : <Refresh />}
                  sx={{ 
                    borderRadius: '8px',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#1F2937',
                    },
                  }}
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>

          {/* Help text */}
          <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 600 }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              If you continue to have trouble receiving the verification code, 
              please check your spam folder or contact our support team.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
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
                  background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0px 4px 8px rgba(0, 82, 204, 0.2)',
                }}
              >
                <EmailIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#0052CC', mb: 0 }}>
                Verify Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              We sent a 6-digit verification code to:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0052CC', mb: 2 }}>
              {email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
                },
              }}
              placeholder="000000"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '& fieldset': {
                    borderWidth: '2px',
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
                background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #003884 0%, #1565C0 100%)',
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Didn't receive the code?
              </Typography>
              
              {resendTimer > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Resend available in {resendTimer}s
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  startIcon={resendLoading ? <CircularProgress size={16} /> : <Refresh />}
                  sx={{ borderRadius: '8px' }}
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Help text */}
        <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 600 }}>
          <Typography variant="body2" color="text.secondary">
            If you continue to have trouble receiving the verification code, 
            please check your spam folder or contact our support team.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
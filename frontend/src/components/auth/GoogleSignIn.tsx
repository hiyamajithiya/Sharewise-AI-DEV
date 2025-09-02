import React, { useEffect, useState } from 'react';
import { Button, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Fetch Google OAuth config from backend
    const fetchGoogleConfig = async () => {
      try {
        const response = await axios.get('/api/auth/google/config/');
        setClientId(response.data.client_id);
      } catch (error) {
        console.log('Google OAuth not configured on backend');
        // Use a placeholder client ID for now
        setClientId('YOUR_GOOGLE_CLIENT_ID_HERE');
      }
    };

    fetchGoogleConfig();
  }, []);

  useEffect(() => {
    if (!clientId) return;

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [clientId]);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError('');

    try {
      // Send the credential to your backend
      const res = await axios.post('/api/auth/google/signin/', {
        credential: response.credential,
      });

      if (res.data.access && res.data.refresh) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        
        // Update Redux store if needed
        // dispatch(loginSuccess(res.data));
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate to dashboard
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.response?.data?.error || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In is not available. Please try again later.');
    }
  };

  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return (
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          alert('Google Sign-In will be available soon!\n\nTo enable it:\n1. Get a Google OAuth Client ID from Google Cloud Console\n2. Add it to backend settings as GOOGLE_OAUTH_CLIENT_ID\n3. Restart the server');
        }}
        sx={{ 
          mb: 2, 
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
          borderColor: '#e0e0e0',
          color: '#374151',
          backgroundColor: 'white',
          '&:hover': {
            borderColor: '#d0d0d0',
            backgroundColor: '#f9fafb',
          },
        }}
        startIcon={<GoogleIcon sx={{ color: '#4285F4' }} />}
      >
        Sign in with Google
      </Button>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Google Sign-In button container */}
      <div id="google-signin-button" style={{ marginBottom: '16px' }}></div>
      
      {/* Fallback button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={handleManualGoogleSignIn}
        disabled={isLoading}
        sx={{ 
          mb: 2, 
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
          borderColor: '#e0e0e0',
          color: '#374151',
          backgroundColor: 'white',
          display: 'none', // Hide by default, show only if Google button doesn't render
          '&:hover': {
            borderColor: '#d0d0d0',
            backgroundColor: '#f9fafb',
          },
        }}
        startIcon={<GoogleIcon sx={{ color: '#4285F4' }} />}
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </>
  );
};

export default GoogleSignIn;
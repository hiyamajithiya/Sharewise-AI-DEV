/**
 * Enhanced Error Display Component
 * Shows user-friendly error messages with appropriate actions
 */

import React from 'react';
import { Alert, Button, Typography, Box } from '@mui/material';
import { ErrorHandler, EnhancedError } from '../../utils/errorHandler';

interface ErrorDisplayProps {
  error: EnhancedError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetryButton?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetryButton = true
}) => {
  if (!error) return null;

  const userMessage = ErrorHandler.getUserMessage(error);
  const isRecoverable = ErrorHandler.isRecoverable(error);
  const retryDelay = ErrorHandler.getRetryDelay(error);
  const errorCategory = ErrorHandler.getErrorCategory(error);

  // Determine alert severity based on error type
  const getSeverity = (): 'error' | 'warning' | 'info' => {
    if (error.isSecurityViolation || error.isIPBlocked) return 'error';
    if (error.isRateLimit) return 'warning';
    if (error.isNetworkError || error.isServerError) return 'info';
    return 'error';
  };

  // Get appropriate icon based on error type
  const getErrorTitle = (): string => {
    if (error.isRateLimit) return 'Rate Limit Exceeded';
    if (error.isSecurityViolation) return 'Security Issue';
    if (error.isIPBlocked) return 'Access Restricted';
    if (error.isNetworkError) return 'Connection Issue';
    if (error.isServerError) return 'Server Issue';
    return 'Error';
  };

  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity={getSeverity()}
        onClose={onDismiss}
        action={
          isRecoverable && showRetryButton && onRetry ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              disabled={retryDelay > 0}
            >
              {retryDelay > 0 ? `Retry in ${retryDelay}s` : 'Retry'}
            </Button>
          ) : null
        }
      >
        <Typography variant="subtitle2" component="div">
          {getErrorTitle()}
        </Typography>
        <Typography variant="body2">
          {userMessage}
        </Typography>
        
        {/* Show additional context for specific error types */}
        {error.isRateLimit && (
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
            You've made too many requests. This helps protect our servers and ensure fair usage.
          </Typography>
        )}
        
        {error.isSecurityViolation && (
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
            Our security system detected potentially harmful content in your request.
          </Typography>
        )}
        
        {error.isNetworkError && (
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
            Please check your internet connection and try again.
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;
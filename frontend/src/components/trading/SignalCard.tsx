import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PlayArrow,
  AccessTime,
} from '@mui/icons-material';
import { TradingSignal } from '../../types';

interface SignalCardProps {
  signal: TradingSignal;
  onExecute?: (signalId: string) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onExecute }) => {
  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case 'BUY':
      case 'COVER':
        return 'success';
      case 'SELL':
      case 'SHORT':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY':
      case 'COVER':
        return <TrendingUp />;
      case 'SELL':
      case 'SHORT':
        return <TrendingDown />;
      default:
        return <TrendingUp />;
    }
  };

  const confidencePercentage = Math.round(signal.confidence_score * 100);
  
  const timeRemaining = signal.valid_until 
    ? new Date(signal.valid_until).getTime() - new Date().getTime()
    : null;
    
  const hoursRemaining = timeRemaining ? Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60))) : null;

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: signal.executed ? '1px solid #E5E7EB' : `2px solid ${getSignalTypeColor(signal.signal_type) === 'success' ? '#10B981' : '#EF4444'}`,
        opacity: signal.executed ? 0.7 : 1,
        '&:hover': {
          transform: signal.executed ? 'none' : 'translateY(-4px)',
          boxShadow: signal.executed 
            ? 'none' 
            : '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Status Indicator */}
      {signal.executed && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(107, 114, 128, 0.1)',
            color: '#6B7280',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 1,
          }}
        >
          EXECUTED
        </Box>
      )}

      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontSize: '1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
              }}
            >
              {signal.symbol.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                {signal.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {signal.strategy_name}
              </Typography>
            </Box>
          </Box>
          
          <Chip
            icon={getSignalIcon(signal.signal_type)}
            label={signal.signal_type}
            color={getSignalTypeColor(signal.signal_type) as any}
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
            }}
          />
        </Box>

        {/* Price Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                ENTRY PRICE
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                ₹{signal.entry_price.toLocaleString()}
              </Typography>
            </Box>
            {signal.target_price && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  TARGET
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                  ₹{signal.target_price.toLocaleString()}
                </Typography>
              </Box>
            )}
            {signal.stop_loss && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  STOP LOSS
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
                  ₹{signal.stop_loss.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {signal.target_price && signal.stop_loss && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>
                POTENTIAL RETURN
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981' }}>
                {signal.signal_type === 'BUY' 
                  ? `+${(((signal.target_price - signal.entry_price) / signal.entry_price) * 100).toFixed(1)}%`
                  : `+${(((signal.entry_price - signal.target_price) / signal.entry_price) * 100).toFixed(1)}%`
                }
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Confidence & Time */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              CONFIDENCE LEVEL
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0052CC' }}>
              {confidencePercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={confidencePercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)`,
              },
            }}
          />
          
          {hoursRemaining !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {hoursRemaining > 0 ? `${hoursRemaining}h remaining` : 'Expired'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Button */}
        {!signal.executed && onExecute && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={() => onExecute(signal.id)}
            disabled={hoursRemaining === 0}
            sx={{
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #003884 0%, #1565C0 100%)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                background: '#E5E7EB',
                color: '#9CA3AF',
              },
            }}
          >
            {hoursRemaining === 0 ? 'Signal Expired' : 'Execute Signal'}
          </Button>
        )}

        {signal.executed && signal.executed_price && (
          <Box
            sx={{
              p: 2,
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Executed at ₹{signal.executed_price.toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalCard;
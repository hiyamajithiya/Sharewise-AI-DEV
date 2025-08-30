import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactElement<SvgIconComponent>;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'primary',
  subtitle,
}) => {
  const theme = useTheme();

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getIconBackground = () => {
    switch (color) {
      case 'success':
        return 'linear-gradient(135deg, #10B981 0%, #34D399 100%)';
      case 'error':
        return 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)';
      case 'info':
        return 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)';
      default:
        return 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header with Icon */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: getIconBackground(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: `0px 4px 8px ${theme.palette[color].main}40`,
            }}
          >
            {icon}
          </Box>
        </Box>

        {/* Value */}
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: change ? 1 : 0,
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>

        {/* Change Indicator */}
        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={change}
              size="small"
              sx={{
                backgroundColor: changeType === 'positive' 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : changeType === 'negative'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(107, 114, 128, 0.1)',
                color: getChangeColor(),
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
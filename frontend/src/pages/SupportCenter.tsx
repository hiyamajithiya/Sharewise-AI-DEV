import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  IconButton,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Support,
  AssignmentTurnedIn,
  Schedule,
  PriorityHigh,
  Person,
  Phone,
  Email,
  Chat,
  TrendingUp,
  Assessment,
  Refresh,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { SupportCenterData, SupportMetrics, SupportTicket, SupportChannel } from '../types';
import apiService from '../services/api';

const SupportCenter: React.FC = () => {
  // State management
  const [supportData, setSupportData] = useState<SupportCenterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch support center data
  const fetchSupportData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await apiService.getSupportCenterData();
      setSupportData(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch support center data:', err);
      setError(err.message || 'Failed to load support center data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle refresh
  const handleRefreshData = useCallback(() => {
    fetchSupportData(true);
  }, [fetchSupportData]);

  // Auto-refresh every 2 minutes for support tickets
  useEffect(() => {
    fetchSupportData();
    
    const interval = setInterval(() => {
      fetchSupportData(true);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchSupportData]);

  // Format time helper
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'closed': return 'success';
      case 'in-progress': return 'info';
      case 'escalated': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Get icon for support channels
  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'chat': return <Chat />;
      case 'email': return <Email />;
      case 'phone': return <Phone />;
      case 'support': return <Support />;
      default: return <Support />;
    }
  };

  // Loading skeleton component
  const MetricSkeleton = () => (
    <Card
      sx={{
        background: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e0e0e0',
        borderRadius: '16px',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Error display component
  if (error && !supportData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f5f7fa',
          p: 3,
        }}
      >
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={() => fetchSupportData()}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              Support Center
            </Typography>
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 400 }}>
              Comprehensive customer support management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {lastRefreshed && (
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </Typography>
            )}
            <IconButton
              onClick={handleRefreshData}
              disabled={refreshing}
              sx={{
                background: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} sx={{ color: '#1F2937' }} />
              ) : (
                <Refresh sx={{ color: '#1F2937' }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Support Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MetricSkeleton />
              </Grid>
            ))
          ) : (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(244, 67, 54, 0.3)', mr: 2 }}>
                        <PriorityHigh sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {supportData?.supportMetrics.openTickets || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Open Tickets
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                        <TrendingUp sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {supportData?.supportMetrics.resolvedToday || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Resolved Today
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                        <Schedule sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {supportData?.supportMetrics.avgResponseTime || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Avg Response
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                        <Assessment sx={{ color: '#1F2937' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                          {supportData?.supportMetrics.satisfaction || 0}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Satisfaction
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={supportData?.supportMetrics.satisfaction || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#4caf50',
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Support Tickets */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                height: 450,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                    Recent Support Tickets
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: '#1F2937',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    View All
                  </Button>
                </Box>
                <List sx={{ flex: 1, overflow: 'auto' }}>
                  {loading ? (
                    // Loading skeletons for tickets
                    Array.from({ length: 4 }).map((_, index) => (
                      <Box key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Skeleton variant="circular" width={40} height={40} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ mb: 1 }}>
                                <Skeleton variant="text" width="80%" height={24} />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Skeleton variant="rectangular" width={60} height={20} />
                                  <Skeleton variant="rectangular" width={70} height={20} />
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Skeleton variant="text" width="90%" height={20} />
                                <Skeleton variant="text" width="40%" height={16} />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 3 && <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
                      </Box>
                    ))
                  ) : supportData?.recentTickets.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      color: '#6B7280',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CheckCircle sx={{ fontSize: 48, color: '#10B981', mb: 1 }} />
                      <Typography variant="body2">
                        No recent tickets
                      </Typography>
                      <Typography variant="caption">
                        All support requests have been handled
                      </Typography>
                    </Box>
                  ) : (
                    supportData?.recentTickets.map((ticket, index) => (
                      <Box key={ticket.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <Person sx={{ color: '#1F2937' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                  {ticket.title}
                                </Typography>
                                <Chip
                                  label={ticket.priority.toUpperCase()}
                                  size="small"
                                  color={getPriorityColor(ticket.priority) as any}
                                />
                                <Chip
                                  label={ticket.status.replace('-', ' ').toUpperCase()}
                                  size="small"
                                  color={getStatusColor(ticket.status) as any}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                  {ticket.id} • {ticket.user} • Assigned to {ticket.assignedTo}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {formatTimeAgo(ticket.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < supportData.recentTickets.length - 1 && (
                          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </Box>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Support Channels */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
                height: 450,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Support Channels
                </Typography>
                <Grid container spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
                  {loading ? (
                    // Loading skeletons for channels
                    Array.from({ length: 4 }).map((_, index) => (
                      <Grid item xs={12} key={index}>
                        <Card
                          sx={{
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2 }} />
                                <Skeleton variant="text" width="60%" height={24} />
                              </Box>
                              <Skeleton variant="rectangular" width={40} height={24} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : supportData?.supportChannels.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 4, 
                        color: '#6B7280',
                      }}>
                        <Typography variant="body2">
                          No support channels configured
                        </Typography>
                      </Box>
                    </Grid>
                  ) : (
                    supportData?.supportChannels.map((channel) => (
                      <Grid item xs={12} key={channel.id}>
                        <Card
                          sx={{
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            opacity: channel.isActive ? 1 : 0.6,
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: channel.color, width: 36, height: 36, mr: 2 }}>
                                  {getChannelIcon(channel.icon)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 500 }}>
                                    {channel.name}
                                  </Typography>
                                  {channel.lastActivity && (
                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                      Last: {formatTimeAgo(channel.lastActivity)}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <Chip
                                label={channel.count}
                                sx={{
                                  bgcolor: channel.color,
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SupportCenter;
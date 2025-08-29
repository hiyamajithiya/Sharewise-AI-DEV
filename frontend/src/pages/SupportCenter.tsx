import React from 'react';
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
} from '@mui/icons-material';

const SupportCenter: React.FC = () => {
  // Mock data for support center
  const supportMetrics = {
    openTickets: 23,
    resolvedToday: 47,
    avgResponseTime: '2.4h',
    satisfaction: 94.2,
  };

  const recentTickets = [
    {
      id: 'SUP-001',
      title: 'Trading bot not executing orders',
      user: 'John Smith',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2 hours ago',
      assignedTo: 'Sarah Connor',
    },
    {
      id: 'SUP-002',
      title: 'API connection timeout issues',
      user: 'Emma Davis',
      priority: 'medium',
      status: 'pending',
      createdAt: '4 hours ago',
      assignedTo: 'Mike Johnson',
    },
    {
      id: 'SUP-003',
      title: 'Portfolio sync not working',
      user: 'David Wilson',
      priority: 'low',
      status: 'resolved',
      createdAt: '1 day ago',
      assignedTo: 'Lisa Park',
    },
    {
      id: 'SUP-004',
      title: 'Unable to access premium features',
      user: 'Rachel Green',
      priority: 'high',
      status: 'escalated',
      createdAt: '3 hours ago',
      assignedTo: 'Tom Anderson',
    },
  ];

  const supportChannels = [
    { name: 'Live Chat', count: 12, icon: <Chat />, color: '#4caf50' },
    { name: 'Email Support', count: 18, icon: <Email />, color: '#2196f3' },
    { name: 'Phone Support', count: 5, icon: <Phone />, color: '#ff9800' },
    { name: 'Help Center', count: 34, icon: <Support />, color: '#9c27b0' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in-progress': return 'info';
      case 'escalated': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

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
          <IconButton
            sx={{
              background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              
              '&:hover': { background: 'rgba(255,255,255,0.2)' },
            }}
          >
            <Refresh sx={{ color: '#1F2937' }} />
          </IconButton>
        </Box>

        {/* Support Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
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
                      {supportMetrics.openTickets}
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
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
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
                      {supportMetrics.resolvedToday}
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
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
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
                      {supportMetrics.avgResponseTime}
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
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
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
                      {supportMetrics.satisfaction}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Satisfaction
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={supportMetrics.satisfaction}
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
                  {recentTickets.map((ticket, index) => (
                    <Box key={ticket.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <Person sx={{ color: '#1F2937' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                {ticket.title}
                              </Typography>
                              <Chip
                                label={ticket.priority.toUpperCase()}
                                size="small"
                                color={getPriorityColor(ticket.priority) as any}
                              />
                              <Chip
                                label={ticket.status.toUpperCase()}
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
                                {ticket.createdAt}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentTickets.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      )}
                    </Box>
                  ))}
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
                  {supportChannels.map((channel) => (
                    <Grid item xs={12} key={channel.name}>
                      <Card
                        sx={{
                          background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          
                          border: '1px solid #e0e0e0',
                          borderRadius: '12px',
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: channel.color, width: 36, height: 36, mr: 2 }}>
                                {channel.icon}
                              </Avatar>
                              <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 500 }}>
                                {channel.name}
                              </Typography>
                            </Box>
                            <Chip
                              label={channel.count}
                              sx={{
                                bgcolor: channel.color,
                                color: '#1F2937',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
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
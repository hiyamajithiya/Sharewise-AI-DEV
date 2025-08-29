import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  ContactSupport,
  Person,
  Chat,
  VideoCall,
  Phone,
  Search,
  Send,
  Help,
  LiveHelp,
  QuestionAnswer,
  School,
  Notifications,
} from '@mui/icons-material';

const UserAssistance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');

  // Mock data for user assistance
  const activeChats = [
    {
      id: 1,
      user: 'John Smith',
      avatar: 'J',
      lastMessage: 'I need help with my trading bot setup',
      timestamp: '2 min ago',
      unread: 3,
      status: 'online',
    },
    {
      id: 2,
      user: 'Emma Davis',
      avatar: 'E',
      lastMessage: 'The portfolio sync is not working',
      timestamp: '5 min ago',
      unread: 1,
      status: 'online',
    },
    {
      id: 3,
      user: 'David Wilson',
      avatar: 'D',
      lastMessage: 'Thank you for the help!',
      timestamp: '15 min ago',
      unread: 0,
      status: 'away',
    },
  ];

  const quickActions = [
    { title: 'Start Video Call', icon: <VideoCall />, color: '#4caf50' },
    { title: 'Schedule Call', icon: <Phone />, color: '#2196f3' },
    { title: 'Send Tutorial', icon: <School />, color: '#ff9800' },
    { title: 'Create Ticket', icon: <ContactSupport />, color: '#9c27b0' },
  ];

  const frequentIssues = [
    {
      title: 'API Connection Problems',
      description: 'Help users troubleshoot broker API connectivity issues',
      count: 12,
      category: 'Technical',
    },
    {
      title: 'Strategy Performance Questions',
      description: 'Explain trading strategy metrics and performance',
      count: 8,
      category: 'General',
    },
    {
      title: 'Account Verification',
      description: 'Assist with account verification and document upload',
      count: 6,
      category: 'Account',
    },
    {
      title: 'Subscription Upgrades',
      description: 'Guide users through plan upgrades and feature unlocks',
      count: 4,
      category: 'Billing',
    },
  ];

  const assistanceMetrics = {
    activeChats: 12,
    avgResponseTime: '1.2min',
    satisfaction: 4.8,
    resolvedToday: 23,
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technical': return 'error';
      case 'General': return 'info';
      case 'Account': return 'warning';
      case 'Billing': return 'success';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        <Box sx={{ mb: 4 }}>
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
            User Assistance
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
            Real-time user support and assistance platform
          </Typography>
        </Box>

        {/* Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <Chat sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {assistanceMetrics.activeChats}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Active Chats
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <LiveHelp sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {assistanceMetrics.avgResponseTime}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Response Time
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 193, 7, 0.3)', mr: 2 }}>
                    <QuestionAnswer sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {assistanceMetrics.satisfaction}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Satisfaction
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.3)', mr: 2 }}>
                    <Help sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {assistanceMetrics.resolvedToday}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Resolved Today
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Active Chats & Communication */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                height: 600,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  sx={{
                    px: 2,
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .Mui-selected': { color: 'white' },
                    '& .MuiTabs-indicator': { backgroundColor: 'white' },
                  }}
                >
                  <Tab label="Active Chats" />
                  <Tab label="Quick Actions" />
                </Tabs>
              </Box>

              <CardContent sx={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        placeholder="Search conversations..."
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                            </InputAdornment>
                          ),
                          sx: {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)',
                            },
                          },
                        }}
                      />
                    </Box>

                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {activeChats.map((chat, index) => (
                        <Box key={chat.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Badge
                                variant="dot"
                                color={chat.status === 'online' ? 'success' : 'warning'}
                              >
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                                  {chat.avatar}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                    {chat.user}
                                  </Typography>
                                  {chat.unread > 0 && (
                                    <Chip
                                      label={chat.unread}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        height: 20,
                                        minWidth: 20,
                                        '& .MuiChip-label': { px: 0.5, fontSize: '0.75rem' },
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {chat.lastMessage}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                    {chat.timestamp}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <IconButton size="small" sx={{ color: 'white' }}>
                                <VideoCall />
                              </IconButton>
                              <IconButton size="small" sx={{ color: 'white' }}>
                                <Phone />
                              </IconButton>
                            </Box>
                          </ListItem>
                          {index < activeChats.length - 1 && (
                            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                          )}
                        </Box>
                      ))}
                    </List>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Type your message..."
                        variant="outlined"
                        size="small"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        InputProps={{
                          sx: {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        }}
                      />
                      <IconButton
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        <Send />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Grid container spacing={2}>
                    {quickActions.map((action, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card
                          sx={{
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.1)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Avatar
                              sx={{
                                bgcolor: action.color,
                                width: 56,
                                height: 56,
                                mx: 'auto',
                                mb: 2,
                              }}
                            >
                              {action.icon}
                            </Avatar>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              {action.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Frequent Issues */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                height: 600,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Frequent Issues
                </Typography>
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {frequentIssues.map((issue, index) => (
                    <Box key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                {issue.title}
                              </Typography>
                              <Chip
                                label={issue.count}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                                {issue.description}
                              </Typography>
                              <Chip
                                label={issue.category}
                                size="small"
                                color={getCategoryColor(issue.category) as any}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < frequentIssues.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      )}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default UserAssistance;
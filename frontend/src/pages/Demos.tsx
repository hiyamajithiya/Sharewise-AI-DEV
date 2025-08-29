import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ModelTraining,
  PlayArrow,
  Schedule,
  Person,
  VideoCall,
  Add,
  Edit,
  Delete,
  Refresh,
  Computer,
  PhoneAndroid,
  Laptop,
  CheckCircle,
  AccessTime,
  Cancel,
} from '@mui/icons-material';

const Demos: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock data for customer demos
  const upcomingDemos = [
    {
      id: 'DEMO-001',
      customerName: 'John Smith',
      company: 'TechCorp Inc.',
      email: 'john.smith@techcorp.com',
      date: '2024-01-16',
      time: '10:00 AM',
      duration: 60,
      type: 'Product Demo',
      platform: 'Zoom',
      status: 'scheduled',
      assignedTo: 'Sarah Connor',
      notes: 'Focus on AI trading strategies and risk management features',
    },
    {
      id: 'DEMO-002',
      customerName: 'Emma Davis',
      company: 'FinancePlus',
      email: 'emma.davis@financeplus.com',
      date: '2024-01-16',
      time: '2:00 PM',
      duration: 45,
      type: 'Technical Demo',
      platform: 'Google Meet',
      status: 'confirmed',
      assignedTo: 'Mike Johnson',
      notes: 'API integration and broker connectivity demonstration',
    },
    {
      id: 'DEMO-003',
      customerName: 'David Wilson',
      company: 'Invest Group LLC',
      email: 'david.wilson@investgroup.com',
      date: '2024-01-17',
      time: '11:00 AM',
      duration: 30,
      type: 'Follow-up Demo',
      platform: 'Teams',
      status: 'pending',
      assignedTo: 'Lisa Park',
      notes: 'Advanced analytics and portfolio management tools',
    },
  ];

  const completedDemos = [
    {
      id: 'DEMO-004',
      customerName: 'Rachel Green',
      company: 'Hedge Fund Solutions',
      email: 'rachel.green@hedgefund.com',
      date: '2024-01-12',
      time: '3:00 PM',
      duration: 75,
      type: 'Product Demo',
      platform: 'Zoom',
      status: 'completed',
      outcome: 'converted',
      assignedTo: 'Tom Anderson',
      feedback: 'Very impressed with the AI capabilities. Ready to move forward.',
      rating: 5,
    },
    {
      id: 'DEMO-005',
      customerName: 'Mark Johnson',
      company: 'Capital Traders',
      email: 'mark.johnson@capitaltraders.com',
      date: '2024-01-11',
      time: '1:00 PM',
      duration: 60,
      type: 'Technical Demo',
      platform: 'Google Meet',
      status: 'completed',
      outcome: 'follow-up',
      assignedTo: 'Sarah Connor',
      feedback: 'Needs more time to evaluate. Interested in enterprise features.',
      rating: 4,
    },
  ];

  const demoStats = {
    totalScheduled: upcomingDemos.length,
    totalCompleted: completedDemos.length,
    conversionRate: 65.0,
    avgRating: 4.5,
  };

  const demoTypes = [
    { name: 'Product Demo', count: 12, duration: '60 min', color: '#4caf50' },
    { name: 'Technical Demo', count: 8, duration: '45 min', color: '#2196f3' },
    { name: 'Follow-up Demo', count: 5, duration: '30 min', color: '#ff9800' },
    { name: 'Enterprise Demo', count: 3, duration: '90 min', color: '#9c27b0' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'converted': return 'success';
      case 'follow-up': return 'info';
      case 'not-interested': return 'error';
      default: return 'default';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom': return <VideoCall />;
      case 'teams': return <Computer />;
      case 'google meet': return <Laptop />;
      default: return <PhoneAndroid />;
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
              Customer Demos
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              Schedule and manage product demonstrations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
              }}
            >
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Schedule Demo
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
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
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <Schedule sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {demoStats.totalScheduled}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Scheduled
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
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <CheckCircle sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {demoStats.totalCompleted}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Completed
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
                    <ModelTraining sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {demoStats.conversionRate}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Conversion
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
                    <Person sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {demoStats.avgRating}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Avg Rating
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Demo List */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                height: 600,
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
                  <Tab label="Upcoming Demos" />
                  <Tab label="Completed Demos" />
                </Tabs>
              </Box>

              <CardContent sx={{ height: 'calc(100% - 72px)', overflow: 'auto' }}>
                {activeTab === 0 && (
                  <List>
                    {upcomingDemos.map((demo, index) => (
                      <Box key={demo.id}>
                        <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <Person sx={{ color: 'white' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                    {demo.customerName} - {demo.company}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {demo.type} • {demo.duration} minutes
                                  </Typography>
                                </Box>
                                <Chip
                                  label={demo.status.toUpperCase()}
                                  size="small"
                                  color={getStatusColor(demo.status) as any}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                      {demo.date} at {demo.time}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {getPlatformIcon(demo.platform)}
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                      {demo.platform}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Assigned to: {demo.assignedTo}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                                  {demo.notes}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              <PlayArrow />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              <Edit />
                            </IconButton>
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              <Cancel />
                            </IconButton>
                          </Box>
                        </ListItem>
                        {index < upcomingDemos.length - 1 && (
                          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </Box>
                    ))}
                  </List>
                )}

                {activeTab === 1 && (
                  <List>
                    {completedDemos.map((demo, index) => (
                      <Box key={demo.id}>
                        <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <CheckCircle sx={{ color: '#4caf50' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                    {demo.customerName} - {demo.company}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {demo.type} • {demo.duration} minutes
                                  </Typography>
                                </Box>
                                <Chip
                                  label={demo.outcome?.toUpperCase()}
                                  size="small"
                                  color={getOutcomeColor(demo.outcome!) as any}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {demo.date} at {demo.time}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Rating: {demo.rating}/5 ⭐
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Conducted by: {demo.assignedTo}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                                  Feedback: {demo.feedback}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < completedDemos.length - 1 && (
                          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </Box>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Demo Types */}
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
                  Demo Types
                </Typography>
                
                <Grid container spacing={2}>
                  {demoTypes.map((type, index) => (
                    <Grid item xs={12} key={index}>
                      <Card
                        sx={{
                          background: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: type.color, width: 36, height: 36, mr: 2 }}>
                                <ModelTraining sx={{ fontSize: '1.2rem' }} />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                  {type.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {type.duration}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={type.count}
                              sx={{
                                bgcolor: type.color,
                                color: 'white',
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

        {/* Schedule Demo Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Schedule New Demo</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    type="email"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Demo Type</InputLabel>
                    <Select
                      label="Demo Type"
                      defaultValue="product"
                    >
                      <MenuItem value="product">Product Demo</MenuItem>
                      <MenuItem value="technical">Technical Demo</MenuItem>
                      <MenuItem value="followup">Follow-up Demo</MenuItem>
                      <MenuItem value="enterprise">Enterprise Demo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    variant="outlined"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    variant="outlined"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Platform</InputLabel>
                    <Select
                      label="Platform"
                      defaultValue="zoom"
                    >
                      <MenuItem value="zoom">Zoom</MenuItem>
                      <MenuItem value="teams">Microsoft Teams</MenuItem>
                      <MenuItem value="meet">Google Meet</MenuItem>
                      <MenuItem value="phone">Phone Call</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      label="Assigned To"
                      defaultValue="sarah"
                    >
                      <MenuItem value="sarah">Sarah Connor</MenuItem>
                      <MenuItem value="mike">Mike Johnson</MenuItem>
                      <MenuItem value="lisa">Lisa Park</MenuItem>
                      <MenuItem value="tom">Tom Anderson</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Demo Notes"
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Key topics to cover, customer interests, etc."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setOpenDialog(false)}>
              Schedule Demo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Demos;
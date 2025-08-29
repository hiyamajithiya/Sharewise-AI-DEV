import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Assignment,
  MoreVert,
  Add,
  FilterList,
  Search,
  PriorityHigh,
  Person,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';

const SupportTickets: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock data for support tickets
  const tickets = [
    {
      id: 'TKT-001',
      title: 'Cannot connect to broker API',
      description: 'User experiencing timeout errors when connecting to Alpaca API',
      customer: 'John Smith',
      email: 'john.smith@email.com',
      priority: 'high',
      status: 'open',
      assignedTo: 'Sarah Connor',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      category: 'Technical',
    },
    {
      id: 'TKT-002',
      title: 'Premium features not unlocked',
      description: 'Customer upgraded to Pro plan but still seeing basic features',
      customer: 'Emma Davis',
      email: 'emma.davis@email.com',
      priority: 'medium',
      status: 'in-progress',
      assignedTo: 'Mike Johnson',
      createdAt: '2024-01-15T09:15:00Z',
      updatedAt: '2024-01-15T13:45:00Z',
      category: 'Billing',
    },
    {
      id: 'TKT-003',
      title: 'Strategy performance question',
      description: 'User asking about expected returns for momentum strategy',
      customer: 'David Wilson',
      email: 'david.wilson@email.com',
      priority: 'low',
      status: 'resolved',
      assignedTo: 'Lisa Park',
      createdAt: '2024-01-14T16:20:00Z',
      updatedAt: '2024-01-15T08:30:00Z',
      category: 'General',
    },
    {
      id: 'TKT-004',
      title: 'Account login issues',
      description: 'Customer cannot log in after password reset',
      customer: 'Rachel Green',
      email: 'rachel.green@email.com',
      priority: 'high',
      status: 'escalated',
      assignedTo: 'Tom Anderson',
      createdAt: '2024-01-15T11:45:00Z',
      updatedAt: '2024-01-15T15:10:00Z',
      category: 'Account',
    },
  ];

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'info';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
      case 'escalated': return 'error';
      default: return 'default';
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, ticketId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticketId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTicket(null);
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
              Support Tickets
            </Typography>
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 400 }}>
              Manage and track customer support requests
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              background: 'rgba(255,255,255,0.2)',
              
              color: '#1F2937',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            New Ticket
          </Button>
        </Box>

        {/* Stats Cards */}
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
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <Assignment sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {ticketStats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Total Tickets
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
                  <Avatar sx={{ bgcolor: 'rgba(244, 67, 54, 0.3)', mr: 2 }}>
                    <PriorityHigh sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {ticketStats.open}
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
                  <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.3)', mr: 2 }}>
                    <Schedule sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {ticketStats.inProgress}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      In Progress
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
                    <CheckCircle sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {ticketStats.resolved}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Resolved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tickets Table */}
        <Card
          sx={{
            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                All Support Tickets
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  sx={{
                    color: '#6B7280',
                    '&:hover': { color: '#1F2937', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Search />
                </IconButton>
                <IconButton
                  sx={{
                    color: '#6B7280',
                    '&:hover': { color: '#1F2937', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <FilterList />
                </IconButton>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Assigned To</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell sx={{ color: '#1F2937', fontWeight: 500 }}>{ticket.id}</TableCell>
                      <TableCell sx={{ color: '#1F2937' }}>{ticket.title}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <Person sx={{ color: '#1F2937', fontSize: '1rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#1F2937' }}>
                              {ticket.customer}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              {ticket.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.priority.toUpperCase()}
                          size="small"
                          color={getPriorityColor(ticket.priority) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status.replace('-', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(ticket.status) as any}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#1F2937' }}>{ticket.assignedTo}</TableCell>
                      <TableCell sx={{ color: '#374151' }}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, ticket.id)}
                          sx={{ color: '#6B7280' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
          <MenuItem onClick={handleMenuClose}>Edit Ticket</MenuItem>
          <MenuItem onClick={handleMenuClose}>Assign</MenuItem>
          <MenuItem onClick={handleMenuClose}>Close Ticket</MenuItem>
        </Menu>

        {/* New Ticket Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1F2937' }}>Create New Support Ticket</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ticket Title"
                    variant="outlined"
                    InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    InputProps={{ sx: { color: '#1F2937' } }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Priority</InputLabel>
                    <Select
                      label="Priority"
                      defaultValue="medium"
                      sx={{
                        color: '#1F2937',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                    <Select
                      label="Category"
                      defaultValue="general"
                      sx={{
                        color: '#1F2937',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    >
                      <MenuItem value="technical">Technical</MenuItem>
                      <MenuItem value="billing">Billing</MenuItem>
                      <MenuItem value="account">Account</MenuItem>
                      <MenuItem value="general">General</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    variant="outlined"
                    InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    InputProps={{ sx: { color: '#1F2937' } }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: '#1F2937' }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => setOpenDialog(false)}
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                color: '#1F2937'
              }}
            >
              Create Ticket
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SupportTickets;
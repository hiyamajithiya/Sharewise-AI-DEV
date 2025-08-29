import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  LinearProgress,
} from '@mui/material';
import {
  People,
  PersonAdd,
  TrendingUp,
  Email,
  Phone,
  MoreVert,
  Add,
  FilterList,
  Search,
  Business,
  AttachMoney,
  Schedule,
  Assignment,
} from '@mui/icons-material';

const Leads: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock data for leads management
  const leads = [
    {
      id: 'LED-001',
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Inc.',
      position: 'Investment Manager',
      status: 'qualified',
      source: 'Website',
      value: 50000,
      probability: 75,
      lastContact: '2024-01-15',
      nextFollowup: '2024-01-18',
      stage: 'proposal',
      assignedTo: 'Sarah Connor',
    },
    {
      id: 'LED-002',
      name: 'Emma Davis',
      email: 'emma.davis@financeplus.com',
      phone: '+1 (555) 234-5678',
      company: 'FinancePlus',
      position: 'Trading Director',
      status: 'new',
      source: 'Referral',
      value: 75000,
      probability: 25,
      lastContact: '2024-01-14',
      nextFollowup: '2024-01-16',
      stage: 'discovery',
      assignedTo: 'Mike Johnson',
    },
    {
      id: 'LED-003',
      name: 'David Wilson',
      email: 'david.wilson@investgroup.com',
      phone: '+1 (555) 345-6789',
      company: 'Invest Group LLC',
      position: 'Portfolio Manager',
      status: 'contacted',
      source: 'LinkedIn',
      value: 100000,
      probability: 50,
      lastContact: '2024-01-13',
      nextFollowup: '2024-01-19',
      stage: 'negotiation',
      assignedTo: 'Lisa Park',
    },
    {
      id: 'LED-004',
      name: 'Rachel Green',
      email: 'rachel.green@hedgefund.com',
      phone: '+1 (555) 456-7890',
      company: 'Hedge Fund Solutions',
      position: 'Chief Investment Officer',
      status: 'converted',
      source: 'Conference',
      value: 200000,
      probability: 100,
      lastContact: '2024-01-12',
      nextFollowup: null,
      stage: 'closed-won',
      assignedTo: 'Tom Anderson',
    },
  ];

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    totalValue: leads.reduce((sum, lead) => sum + lead.value, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'success';
      case 'converted': return 'success';
      default: return 'default';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'discovery': return 'info';
      case 'proposal': return 'warning';
      case 'negotiation': return 'secondary';
      case 'closed-won': return 'success';
      case 'closed-lost': return 'error';
      default: return 'default';
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, leadId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(leadId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
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
              Lead Management
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              Track and manage sales prospects and opportunities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
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
            New Lead
          </Button>
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
                    <People sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {leadStats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Total Leads
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
                  <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.3)', mr: 2 }}>
                    <Assignment sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {leadStats.qualified}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Qualified
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
                    <TrendingUp sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {leadStats.converted}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Converted
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
                    <AttachMoney sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      ${(leadStats.totalValue / 1000).toFixed(0)}K
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Pipeline Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Leads Table */}
        <Card
          sx={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Sales Pipeline
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Search />
                </IconButton>
                <IconButton
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <FilterList />
                </IconButton>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Lead</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Stage</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Value</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Probability</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Next Followup</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                              {lead.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {lead.position}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', mr: 1 }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {lead.company}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status.toUpperCase()}
                          size="small"
                          color={getStatusColor(lead.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.stage.replace('-', ' ').toUpperCase()}
                          size="small"
                          color={getStageColor(lead.stage) as any}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                        ${lead.value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={lead.probability}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: lead.probability > 75 ? '#4caf50' : lead.probability > 50 ? '#ff9800' : '#2196f3',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'white', minWidth: '30px' }}>
                            {lead.probability}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Schedule sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', mr: 1 }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {lead.nextFollowup ? new Date(lead.nextFollowup).toLocaleDateString() : 'None'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, lead.id)}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
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
          <MenuItem onClick={handleMenuClose}>
            <Email sx={{ mr: 1 }} />
            Send Email
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Phone sx={{ mr: 1 }} />
            Call Lead
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Schedule sx={{ mr: 1 }} />
            Schedule Meeting
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Assignment sx={{ mr: 1 }} />
            View Details
          </MenuItem>
        </Menu>

        {/* New Lead Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
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
                  <TextField
                    fullWidth
                    label="Phone"
                    variant="outlined"
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
                    label="Position"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Source</InputLabel>
                    <Select
                      label="Source"
                      defaultValue="website"
                    >
                      <MenuItem value="website">Website</MenuItem>
                      <MenuItem value="referral">Referral</MenuItem>
                      <MenuItem value="linkedin">LinkedIn</MenuItem>
                      <MenuItem value="conference">Conference</MenuItem>
                      <MenuItem value="cold-call">Cold Call</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Value ($)"
                    variant="outlined"
                    type="number"
                  />
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
                    label="Notes"
                    multiline
                    rows={3}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setOpenDialog(false)}>
              Add Lead
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Leads;
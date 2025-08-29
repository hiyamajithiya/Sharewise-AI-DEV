import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Alert,
  Avatar,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  People,
  PersonAdd,
  MoreVert,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Warning,
  Search,
  FilterList,
  Download,
  Upload,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Support,
  SellOutlined,
  AccountCircle,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  subscription_tier: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  last_login: string;
  created_at: string;
  is_verified: boolean;
  total_trades: number;
  portfolio_value: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState(0);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'USER',
    subscription_tier: 'PRO',
    password: ''
  });

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser: testingUser } = testingState;

  // Mock user data
  const mockUsers: User[] = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'USER',
      subscription_tier: 'PRO',
      status: 'ACTIVE',
      last_login: '2024-01-15T10:30:00Z',
      created_at: '2024-01-01T08:00:00Z',
      is_verified: true,
      total_trades: 145,
      portfolio_value: 250000
    },
    {
      id: 2,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@example.com',
      role: 'USER',
      subscription_tier: 'ELITE',
      status: 'ACTIVE',
      last_login: '2024-01-14T16:45:00Z',
      created_at: '2023-11-15T12:30:00Z',
      is_verified: true,
      total_trades: 320,
      portfolio_value: 750000
    },
    {
      id: 3,
      first_name: 'Mike',
      last_name: 'Wilson',
      email: 'mike.wilson@example.com',
      role: 'SUPPORT',
      subscription_tier: 'PRO',
      status: 'ACTIVE',
      last_login: '2024-01-15T09:15:00Z',
      created_at: '2024-01-10T14:20:00Z',
      is_verified: true,
      total_trades: 0,
      portfolio_value: 0
    },
    {
      id: 4,
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@example.com',
      role: 'USER',
      subscription_tier: 'PRO',
      status: 'PENDING',
      last_login: '2024-01-12T14:20:00Z',
      created_at: '2024-01-12T14:00:00Z',
      is_verified: false,
      total_trades: 5,
      portfolio_value: 10000
    },
    {
      id: 5,
      first_name: 'Alex',
      last_name: 'Thompson',
      email: 'alex.t@example.com',
      role: 'SALES',
      subscription_tier: 'PRO',
      status: 'SUSPENDED',
      last_login: '2024-01-10T11:30:00Z',
      created_at: '2023-12-01T09:45:00Z',
      is_verified: true,
      total_trades: 0,
      portfolio_value: 0
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  // Check URL parameter to auto-open add user dialog
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'add') {
      handleAddUser();
      // Clean up the URL parameter after opening the dialog
      navigate('/users', { replace: true });
    }
  }, [location.search, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddUser = () => {
    setUserDialogOpen(true);
    setSelectedUser(null);
    setNewUser({
      first_name: '',
      last_name: '',
      email: '',
      role: 'USER',
      subscription_tier: 'PRO',
      password: ''
    });
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setNewUser({
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        email: selectedUser.email,
        role: selectedUser.role,
        subscription_tier: selectedUser.subscription_tier || 'PRO',
        password: ''
      });
      setUserDialogOpen(true);
    }
    setActionMenuAnchor(null);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSuspendUser = () => {
    if (selectedUser) {
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }
          : u
      ));
    }
    setActionMenuAnchor(null);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      // Edit existing user
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              first_name: newUser.first_name,
              last_name: newUser.last_name,
              email: newUser.email,
              role: newUser.role,
              subscription_tier: newUser.subscription_tier
            }
          : u
      ));
    } else {
      // Add new user
      const newUserData = {
        id: Math.max(...users.map(u => u.id)) + 1,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        subscription_tier: newUser.subscription_tier,
        status: 'ACTIVE',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_verified: false,
        total_trades: 0,
        portfolio_value: 0
      };
      setUsers([...users, newUserData as User]);
    }
    setUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Role,Status,Last Login,Portfolio Value\n"
      + filteredUsers.map(user => 
          `"${user.first_name} ${user.last_name}",${user.email},${user.role},${user.status},${new Date(user.last_login).toLocaleDateString()},${user.portfolio_value}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Importing file:', file.name);
        // Here you would implement CSV parsing logic
        alert('Import functionality would be implemented here');
      }
    };
    input.click();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <AdminPanelSettings />;
      case 'SUPPORT': return <Support />;
      case 'SALES': return <SellOutlined />;
      default: return <AccountCircle />;
    }
  };

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const pending = users.filter(u => u.status === 'PENDING').length;
    const suspended = users.filter(u => u.status === 'SUSPENDED').length;
    const totalValue = users.reduce((sum, u) => sum + u.portfolio_value, 0);
    
    return [
      {
        title: 'Total Users',
        value: total.toString(),
        change: '+12%',
        changeType: 'positive' as const,
        icon: <People />,
        color: 'primary' as const,
        subtitle: 'Registered users'
      },
      {
        title: 'Active Users',
        value: active.toString(),
        change: '+8%',
        changeType: 'positive' as const,
        icon: <CheckCircle />,
        color: 'success' as const,
        subtitle: 'Currently active'
      },
      {
        title: 'Pending Approval',
        value: pending.toString(),
        change: '+3',
        changeType: 'positive' as const,
        icon: <Warning />,
        color: 'warning' as const,
        subtitle: 'Awaiting verification'
      },
      {
        title: 'Total Portfolio Value',
        value: `₹${(totalValue / 100000).toFixed(1)}L`,
        change: '+15%',
        changeType: 'positive' as const,
        icon: <AccountCircle />,
        color: 'info' as const,
        subtitle: 'Combined value'
      }
    ];
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{
          p: 4,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <LinearProgress sx={{ mb: 2, borderRadius: '10px' }} />
          <Typography sx={{ color: 'white' }}>Loading user data...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
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
      }
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 1, 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}>
                User Management 👥
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                {isTestingMode && testingUser
                  ? `Testing user management for ${testingUser.role} role`
                  : 'Manage users, roles, and permissions across the platform'
                }
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={handleAddUser}
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)',
                },
              }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getUserStats().map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Filters and Search */}
        <Paper sx={{ 
          mb: 3,
          p: 3,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'white !important',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  Role
                </InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="ALL">All Roles</MenuItem>
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="SUPPORT">Support</MenuItem>
                  <MenuItem value="SALES">Sales</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  Status
                </InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => console.log('Filters clicked')}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={handleImport}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Import
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ 
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'white',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            }}>
              Users ({filteredUsers.length})
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Subscription</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Last Login</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Portfolio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40,
                        }}>
                          {user.first_name[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: 'white' }}>
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(user.role)}
                        <Typography sx={{ color: 'white' }}>{user.role}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.subscription_tier} 
                        color={user.subscription_tier === 'ELITE' ? 'warning' : user.subscription_tier === 'PRO' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status} 
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {new Date(user.last_login).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        ₹{user.portfolio_value.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          setSelectedUser(user);
                          setActionMenuAnchor(e.currentTarget);
                        }}
                        sx={{ color: 'white' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
        >
          <MenuItem onClick={handleEditUser}>
            <Edit sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => {
            setDeleteDialogOpen(true);
            setActionMenuAnchor(null);
          }}>
            <Delete sx={{ mr: 1 }} /> Delete
          </MenuItem>
          <MenuItem onClick={handleSuspendUser}>
            <Block sx={{ mr: 1 }} /> 
            {selectedUser?.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
          </MenuItem>
        </Menu>

        {/* User Dialog */}
        <Dialog 
          open={userDialogOpen} 
          onClose={() => setUserDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <DialogTitle sx={{ color: 'white' }}>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={newUser.first_name}
                onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ sx: { color: 'white' } }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={newUser.last_name}
                onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ sx: { color: 'white' } }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ sx: { color: 'white' } }}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Role</InputLabel>
                <Select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="SUPPORT">Support</MenuItem>
                  <MenuItem value="SALES">Sales</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Subscription Tier</InputLabel>
                <Select
                  value={newUser.subscription_tier}
                  onChange={(e) => setNewUser({...newUser, subscription_tier: e.target.value})}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  <MenuItem value="PRO">Pro</MenuItem>
                  <MenuItem value="ELITE">Elite</MenuItem>
                </Select>
              </FormControl>
              {!selectedUser && (
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                  InputProps={{ sx: { color: 'white' } }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)} sx={{ color: 'white' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUser} 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                color: 'white'
              }}
            >
              {selectedUser ? 'Update' : 'Add'} User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <DialogTitle sx={{ color: 'white' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'white' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagement;
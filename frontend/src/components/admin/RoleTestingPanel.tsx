import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Security,
  AdminPanelSettings,
  Support,
  CheckCircle,
  Cancel,
  ExpandMore,
  PlayArrow,
  Info,
  People,
  Analytics,
  Shield,
  Settings,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import apiService from '../../services/api';

interface UserRole {
  user_id: string;
  username: string;
  email: string;
  role: string;
  role_display: string;
  permissions: {
    is_super_admin: boolean;
    is_staff_member: boolean;
    has_admin_access: boolean;
    can_manage_users: boolean;
    can_view_analytics: boolean;
  };
  subscription_tier: string;
  subscription_tier_display: string;
}

interface TestResult {
  user_role: string;
  test_type: string;
  timestamp: string;
  tests: Record<string, any>;
}

interface SystemInfo {
  total_users: number;
  verified_users: number;
  super_admins: number;
  regular_users: number;
  recent_registrations_24h?: number;
  recent_registrations_7d?: number;
  subscription_breakdown?: {
    basic: number;
    pro: number;
    enterprise: number;
  };
}

interface SystemUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  subscription_tier: string;
  subscription_tier_display: string;
  is_active: boolean;
  email_verified: boolean;
  date_joined: string;
  last_login: string | null;
}

const RoleTestingPanel: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testType, setTestType] = useState('basic');
  const [error, setError] = useState<string | null>(null);

  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    fetchUserRole();
    fetchSystemInfo();
    fetchAllUsers();
  }, []);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<UserRole>('/users/roles/');
      setUserRole(response);
    } catch (error: any) {
      setError('Failed to fetch user role information');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await apiService.get<SystemInfo>('/users/system/info/');
      setSystemInfo(response);
    } catch (error: any) {
      console.error('Failed to fetch system info:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response: any = await apiService.get('/users/admin/all-users/');
      setAllUsers(response.results || response);
    } catch (error: any) {
      console.error('Failed to fetch all users:', error);
      setAllUsers([]);
    }
  };

  const runRoleTest = async () => {
    try {
      setTestLoading(true);
      setError(null);
      const response = await apiService.post<TestResult>('/users/roles/test/', {
        test_type: testType,
      });
      setTestResults(response);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to run role test');
    } finally {
      setTestLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <AdminPanelSettings sx={{ color: '#EF4444' }} />;
      default:
        return <Security sx={{ color: '#6B7280' }} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!userRole?.permissions.is_staff_member) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6" gutterBottom>
          Access Denied
        </Typography>
        <Typography>
          This panel is only available for Super Admin and Support Team members.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#0052CC', fontWeight: 700, mb: 3 }}>
        <Shield sx={{ mr: 2, verticalAlign: 'bottom' }} />
        Role Testing Panel
      </Typography>

      <Grid container spacing={3}>
        {/* User Role Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {getRoleIcon(userRole.role)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Current User Role
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  User Information
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {userRole.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Username:</strong> {userRole.username}
                </Typography>
                <Box mt={1}>
                  <Chip 
                    label={userRole.role_display} 
                    color={getRoleColor(userRole.role) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={userRole.subscription_tier_display} 
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permissions
              </Typography>
              <List dense>
                {Object.entries(userRole.permissions).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {value ? 
                        <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} /> : 
                        <Cancel sx={{ color: '#EF4444', fontSize: 20 }} />
                      }
                    </ListItemIcon>
                    <ListItemText 
                      primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Analytics sx={{ color: '#0052CC' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  System Overview
                </Typography>
              </Box>

              {systemInfo && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F3F4F6' }}>
                        <Typography variant="h5" sx={{ color: '#0052CC', fontWeight: 700 }}>
                          {systemInfo.total_users}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Users
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F3F4F6' }}>
                        <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 700 }}>
                          {systemInfo.verified_users}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Verified Users
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#FEF3F2' }}>
                        <Typography variant="h5" sx={{ color: '#EF4444', fontWeight: 700 }}>
                          {systemInfo.super_admins}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Super Admins
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {userRole.permissions.is_super_admin && systemInfo.recent_registrations_24h !== undefined && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Recent Activity (Admin Only)
                      </Typography>
                      <Typography variant="body2">
                        <strong>24h:</strong> {systemInfo.recent_registrations_24h} new registrations
                      </Typography>
                      <Typography variant="body2">
                        <strong>7d:</strong> {systemInfo.recent_registrations_7d} new registrations
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Users Section */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <People sx={{ color: '#0052CC' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  All System Users
                </Typography>
                <Chip 
                  label={`${allUsers.length} Total`} 
                  color="primary" 
                  size="small" 
                />
              </Box>

              {allUsers.length > 0 ? (
                <Grid container spacing={2}>
                  {allUsers.map((systemUser) => (
                    <Grid item xs={12} sm={6} md={4} key={systemUser.id}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: 3,
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          {getRoleIcon(systemUser.role)}
                          <Box flex={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {systemUser.first_name} {systemUser.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                              {systemUser.email}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {systemUser.is_active ? 
                              <CheckCircle sx={{ color: '#10B981', fontSize: 16 }} /> : 
                              <Cancel sx={{ color: '#EF4444', fontSize: 16 }} />
                            }
                          </Box>
                        </Box>

                        <Box display="flex" gap={1} mb={2}>
                          <Chip 
                            label={systemUser.role_display} 
                            color={getRoleColor(systemUser.role) as any}
                            size="small"
                          />
                          <Chip 
                            label={systemUser.subscription_tier_display || systemUser.subscription_tier} 
                            variant="outlined"
                            size="small"
                          />
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            <strong>Joined:</strong> {new Date(systemUser.date_joined).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            <strong>Last Login:</strong> {
                              systemUser.last_login 
                                ? new Date(systemUser.last_login).toLocaleDateString()
                                : 'Never'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            <strong>Email Verified:</strong> {systemUser.email_verified ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  minHeight="200px"
                  flexDirection="column"
                  color="text.secondary"
                >
                  <People sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    No users found or insufficient permissions to view users
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Role Testing Section */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <PlayArrow sx={{ color: '#0052CC' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Role Permission Testing
                </Typography>
              </Box>

              <Box display="flex" gap={2} alignItems="center" mb={3}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Test Type</InputLabel>
                  <Select
                    value={testType}
                    label="Test Type"
                    onChange={(e) => setTestType(e.target.value)}
                  >
                    <MenuItem value="basic">Basic Tests</MenuItem>
                    {userRole.permissions.is_super_admin && (
                      <MenuItem value="advanced">Advanced Tests</MenuItem>
                    )}
                    {userRole.permissions.is_staff_member && (
                      <MenuItem value="support">Support Tests</MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={runRoleTest}
                  disabled={testLoading}
                  startIcon={testLoading ? <CircularProgress size={16} /> : <PlayArrow />}
                  sx={{
                    background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #003884 0%, #1565C0 100%)',
                    },
                  }}
                >
                  {testLoading ? 'Running Tests...' : 'Run Tests'}
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {testResults && (
                <Box>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6">
                        Test Results - {testResults.test_type.toUpperCase()}
                      </Typography>
                      <Chip 
                        label={testResults.user_role} 
                        color={getRoleColor(testResults.user_role) as any}
                        size="small" 
                        sx={{ ml: 2 }}
                      />
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Test executed at: {new Date(testResults.timestamp).toLocaleString()}
                      </Typography>
                      
                      <List>
                        {Object.entries(testResults.tests).map(([testName, result]) => (
                          <ListItem key={testName} divider>
                            <ListItemIcon>
                              {typeof result === 'boolean' ? (
                                result ? 
                                  <CheckCircle sx={{ color: '#10B981' }} /> : 
                                  <Cancel sx={{ color: '#EF4444' }} />
                              ) : (
                                <Info sx={{ color: '#3B82F6' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={testName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              secondary={typeof result === 'boolean' ? 
                                (result ? 'PASS' : 'FAIL') : 
                                `Value: ${result}`
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoleTestingPanel;
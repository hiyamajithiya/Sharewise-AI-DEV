import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from '@mui/material';
import {
  Build,
  Code,
  Api,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Settings,
  ExpandMore,
  Webhook,
  Schedule,
  Storage,
  CloudSync,
  BugReport,
  Refresh,
  TrendingUp,
  Security,
  Assessment,
  AccountBalance,
  BarChart,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { RootState } from '../store';
import { selectTestingState } from '../store/slices/testingSlice';
import { CustomTool, ToolResult } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-tools-tabpanel-${index}`}
      style={{ 
        flex: 1, 
        display: value === index ? 'block' : 'none',
        margin: 0,
        padding: 0
      }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const CustomTools: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'ELITE';

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog states
  const [createToolDialog, setCreateToolDialog] = useState(false);
  const [editToolDialog, setEditToolDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<CustomTool | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<CustomTool | null>(null);
  const [apiTestDialog, setApiTestDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [documentationDialog, setDocumentationDialog] = useState(false);
  const [testResponse, setTestResponse] = useState('');
  
  // Form states
  const [toolResults, setToolResults] = useState<{ [key: string]: ToolResult[] }>({});

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Tool action handlers
  const handleEditTool = (tool: CustomTool) => {
    setSelectedTool(tool);
    setEditToolDialog(true);
    console.log('Editing tool:', tool.name);
  };

  const handleExecuteTool = async (tool: CustomTool) => {
    try {
      console.log('Executing tool:', tool.name);
      const result = await apiService.executeCustomTool(tool.id, {});
      console.log('Tool execution result:', result);
      
      // Refresh tools to get updated usage count
      handleRefresh();
      
      alert(`Tool "${tool.name}" executed successfully!`);
    } catch (err: any) {
      console.error('Tool execution failed:', err);
      alert(`Tool execution failed: ${err.message}`);
    }
  };

  const handleToggleToolStatus = async (tool: CustomTool) => {
    try {
      const updatedTool = await apiService.updateCustomTool(tool.id, {
        isActive: !tool.isActive
      });
      
      // Update local state
      setCustomTools(prev => prev.map(t => 
        t.id === tool.id ? updatedTool : t
      ));
      
      console.log(`Tool ${tool.name} ${updatedTool.isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      console.error('Failed to update tool status:', err);
      alert(`Failed to update tool status: ${err.message}`);
    }
  };

  const handleToolSettings = (tool: CustomTool) => {
    setSelectedTool(tool);
    setEditToolDialog(true);
    console.log('Opening settings for tool:', tool.name);
  };

  const handleDeleteTool = (tool: CustomTool) => {
    setToolToDelete(tool);
    setDeleteConfirmDialog(true);
  };

  const confirmDeleteTool = async () => {
    if (toolToDelete) {
      try {
        await apiService.deleteCustomTool(toolToDelete.id);
        
        // Remove from local state
        setCustomTools(prev => prev.filter(t => t.id !== toolToDelete.id));
        
        console.log('Deleted tool:', toolToDelete.name);
        alert(`Deleted ${toolToDelete.name}`);
      } catch (err: any) {
        console.error('Failed to delete tool:', err);
        alert(`Failed to delete tool: ${err.message}`);
      } finally {
        setDeleteConfirmDialog(false);
        setToolToDelete(null);
      }
    }
  };

  // API Console handlers
  const handleTestEndpoint = (endpoint: any) => {
    setSelectedEndpoint(endpoint);
    setApiTestDialog(true);
    console.log('Testing API endpoint:', endpoint.name);
  };

  const executeApiTest = async () => {
    if (selectedEndpoint) {
      try {
        setLoading(true);
        console.log('Executing API test for:', selectedEndpoint.endpoint);
        
        // Make actual API call based on the endpoint
        const response = await apiService.testCustomEndpoint({
          endpoint: selectedEndpoint.endpoint,
          method: selectedEndpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });
        
        setTestResponse(JSON.stringify(response, null, 2));
        console.log(`API test executed successfully for ${selectedEndpoint.name}!`);
      } catch (error: any) {
        const errorResponse = {
          status: error.response?.status || 500,
          error: error.message || 'API test failed',
          timestamp: new Date().toISOString(),
          endpoint: selectedEndpoint.endpoint
        };
        setTestResponse(JSON.stringify(errorResponse, null, 2));
        console.error(`API test failed for ${selectedEndpoint.name}:`, error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDocumentation = () => {
    setDocumentationDialog(true);
    console.log('Opening API documentation');
  };

  // Fetch custom tools data
  const fetchCustomTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tools = await apiService.getCustomTools();
      setCustomTools(tools);
      
      // Fetch results for each tool
      const results: { [key: string]: ToolResult[] } = {};
      for (const tool of tools) {
        try {
          const toolResults = await apiService.getToolResults(tool.id, 5);
          results[tool.id] = toolResults;
        } catch (err) {
          console.warn(`Could not fetch results for tool ${tool.id}:`, err);
          results[tool.id] = [];
        }
      }
      setToolResults(results);
      
    } catch (err: any) {
      console.error('Failed to fetch custom tools:', err);
      setError(err.message || 'Failed to load custom tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomTools();
  }, [refreshKey]);

  const apiEndpoints = [
    { name: 'Portfolio Data', endpoint: '/api/v1/portfolio', method: 'GET', calls: 1247 },
    { name: 'Execute Trade', endpoint: '/api/v1/trades', method: 'POST', calls: 89 },
    { name: 'Market Data', endpoint: '/api/v1/market-data', method: 'GET', calls: 3456 },
    { name: 'Risk Metrics', endpoint: '/api/v1/risk', method: 'GET', calls: 567 },
  ];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'warning';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getToolIcon = (type: CustomTool['type']) => {
    switch (type) {
      case 'screener': return <Assessment />;
      case 'calculator': return <Code />;
      case 'analyzer': return <TrendingUp />;
      case 'monitor': return <Schedule />;
      case 'alerts': return <Webhook />;
      default: return <Build />;
    }
  };

  const getCategoryIcon = (category: CustomTool['category']) => {
    switch (category) {
      case 'technical': return <TrendingUp />;
      case 'fundamental': return <Assessment />;
      case 'risk': return <Security />;
      case 'portfolio': return <AccountBalance />;
      case 'market': return <BarChart />;
      default: return <Build />;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f5f7fa',
      position: 'relative'
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Paper sx={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        p: 3,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: '#1F2937'
            }}>
              🔧 Custom Tools & Integrations
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              {isTestingMode && selectedUser
                ? `Testing custom tools for ${selectedUser.role} role`
                : 'Build custom trading tools, webhooks, and API integrations for automated workflows'
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={`${subscriptionTier} Plan`}
              sx={{ 
                fontWeight: 600,
                backgroundColor: '#f0f9ff',
                color: '#1e40af',
                border: '1px solid #3b82f6'
              }} 
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ borderRadius: '8px' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateToolDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)',
                },
              }}
            >
              Create Tool
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Elite Feature Notice */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          border: '2px solid #667eea',
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            opacity: 0.1,
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography sx={{ fontSize: '1.8rem' }}>👑</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 700, 
              mb: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              🌟 Elite Developer Tools
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              Advanced API access, custom webhook endpoints, automated trading scripts, 
              and integration capabilities available exclusively to Elite subscribers.
            </Typography>
          </Box>
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            px: 2,
            py: 1,
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Typography variant="caption" sx={{ 
              color: 'white', 
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Premium
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Content Tabs */}
        <Paper sx={{ 
          mb: 3,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: 40,
            height: 40,
            flexShrink: 0,
            '& .MuiTab-root': {
              color: '#6B7280',
              fontWeight: 600,
              minHeight: 40,
              height: 40,
              py: 0,
              px: 2,
              fontSize: '0.875rem',
              '&:hover': {
                color: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
              },
              '&.Mui-selected': {
                color: '#667eea',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea',
            },
          }}
        >
          <Tab
            icon={<Build />}
            label="My Tools"
            iconPosition="start"
          />
          <Tab
            icon={<Api />}
            label="API Console"
            iconPosition="start"
          />
          <Tab
            icon={<Webhook />}
            label="Webhooks"
            iconPosition="start"
          />
          <Tab
            icon={<Code />}
            label="Scripts & Automation"
            iconPosition="start"
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
        {/* My Tools */}
        <Grid container spacing={3}>
          {loading && customTools.length === 0 ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Paper sx={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  p: 3,
                  height: '250px'
                }}>
                  <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: '8px' }} />
                  <Skeleton height={20} sx={{ mb: 1 }} />
                  <Skeleton height={20} width="80%" sx={{ mb: 2 }} />
                  <Skeleton height={32} width="60%" />
                </Paper>
              </Grid>
            ))
          ) : customTools.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: '20px',
                border: '2px dashed #e0e0e0'
              }}>
                <Build sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Custom Tools Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first custom tool to automate your trading workflows
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateToolDialog(true)}
                  sx={{ borderRadius: '8px' }}
                >
                  Create Your First Tool
                </Button>
              </Paper>
            </Grid>
          ) : (
            customTools.map((tool) => (
            <Grid item xs={12} md={6} lg={4} key={tool.id}>
              <Paper sx={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                height: '100%',
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                }
              }}>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getToolIcon(tool.type)}
                      <Typography variant="h6" component="div" sx={{ color: '#1F2937' }}>
                        {tool.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(tool.isActive)}
                      color={getStatusColor(tool.isActive) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, flex: '1 0 auto' }}>
                    {tool.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Last used: {tool.lastUsed}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {tool.usageCount} uses
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditTool(tool)}
                      title="Edit Tool"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleExecuteTool(tool)}
                      title="Start Tool"
                    >
                      <PlayArrow />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => handleToggleToolStatus(tool)}
                      title="Pause Tool"
                    >
                      <Pause />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="default"
                      onClick={() => handleToolSettings(tool)}
                      title="Tool Settings"
                    >
                      <Settings />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteTool(tool)}
                      title="Delete Tool"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            ))
          )}

          {/* Duplicate Empty State - Remove this section */}
          {false && customTools.length === 0 && (
            <Grid item xs={12}>
              <Card sx={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Build sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Custom Tools Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create your first custom tool to automate trading workflows
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateToolDialog(true)}
                  >
                    Create Your First Tool
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* API Console */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  API Endpoints
                </Typography>

                <List>
                  {apiEndpoints.map((endpoint, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <Api />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {endpoint.name}
                            </Typography>
                            <Chip label={endpoint.method} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                              {endpoint.endpoint}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {endpoint.calls.toLocaleString()} calls this month
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleTestEndpoint(endpoint)}
                        >
                          Test
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  API Usage
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom sx={{ color: '#1F2937' }}>
                    Monthly Quota: 8,547 / 10,000 calls
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.300',
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            width: '85.47%',
                            height: '100%',
                            borderRadius: 4,
                            bgcolor: 'warning.main'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'warning.main' }}>
                      85.47%
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Approaching monthly limit. Consider upgrading for higher quotas.
                  </Typography>
                </Alert>

                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={handleViewDocumentation}
                >
                  View Documentation
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Webhooks */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Webhook Configuration
                </Typography>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ color: '#1F2937', fontWeight: 600 }}>Trading Signals Webhook</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      placeholder="Enter your API endpoint URL"
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable for Buy Signals"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable for Sell Signals"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable for Risk Alerts"
                      sx={{ display: 'block' }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ color: '#1F2937', fontWeight: 600 }}>Portfolio Updates Webhook</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      placeholder="Enter your webhook URL"
                      sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Update Frequency</InputLabel>
                      <Select label="Update Frequency" defaultValue="realtime">
                        <MenuItem value="realtime">Real-time</MenuItem>
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Webhook Activity
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Today's Deliveries
                  </Typography>
                  <Typography variant="h4" sx={{ color: 'success.main' }}>
                    247
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    Success rate: 99.2%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Failed Deliveries
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'error.main' }}>
                    2
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    Retry in progress
                  </Typography>
                </Box>

                <Button variant="outlined" fullWidth startIcon={<BugReport />}>
                  View Logs
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Scripts & Automation */}
        <Paper sx={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
              Trading Scripts & Automation
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Custom Python/JavaScript script execution environment 
                with access to real-time market data, portfolio information, and trading APIs.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Code sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#1F2937' }}>Python Scripts</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Custom trading algorithms and data analysis
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Launch Python IDE
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Schedule sx={{ fontSize: 40, color: 'info.main' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#1F2937' }}>Scheduled Tasks</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Automated execution based on time or market conditions
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Create Schedule
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CloudSync sx={{ fontSize: 40, color: 'success.main' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#1F2937' }}>Cloud Functions</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Serverless execution of trading logic
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Deploy Function
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Storage sx={{ fontSize: 40, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#1F2937' }}>Data Pipeline</Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Custom data processing and storage solutions
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Configure Pipeline
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </TabPanel>
      </Paper>

      {/* Create Tool Dialog */}
      <Dialog
        open={createToolDialog}
        onClose={() => setCreateToolDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🔧 Create Custom Tool
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tool Name"
                placeholder="e.g., Price Alert Bot"
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                placeholder="Describe what this tool does..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}>
                <InputLabel>Tool Type</InputLabel>
                <Select label="Tool Type">
                  <MenuItem value="webhook">🔗 Webhook</MenuItem>
                  <MenuItem value="scheduler">⏰ Scheduled Task</MenuItem>
                  <MenuItem value="api">🔌 API Integration</MenuItem>
                  <MenuItem value="script">📜 Custom Script</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}>
                <InputLabel>Trigger</InputLabel>
                <Select label="Trigger">
                  <MenuItem value="manual">👆 Manual</MenuItem>
                  <MenuItem value="price">💰 Price Change</MenuItem>
                  <MenuItem value="time">⏰ Time-based</MenuItem>
                  <MenuItem value="portfolio">📊 Portfolio Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>🚀 Pro Tip:</strong> Custom tools help automate your trading workflow. 
              Start simple with webhooks or scheduled tasks before creating complex scripts.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setCreateToolDialog(false)}
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setCreateToolDialog(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Create Tool
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog
        open={editToolDialog}
        onClose={() => {
          setEditToolDialog(false);
          setSelectedTool(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ✏️ Edit Tool: {selectedTool?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tool Name"
                defaultValue={selectedTool?.name}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue={selectedTool?.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}>
                <InputLabel>Tool Type</InputLabel>
                <Select label="Tool Type" defaultValue={selectedTool?.type}>
                  <MenuItem value="webhook">🔗 Webhook</MenuItem>
                  <MenuItem value="scheduler">⏰ Scheduled Task</MenuItem>
                  <MenuItem value="api">🔌 API Integration</MenuItem>
                  <MenuItem value="script">📜 Custom Script</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{
                '& .MuiInputBase-root': {
                  height: '56px'
                }
              }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" defaultValue={selectedTool?.isActive ? "active" : "inactive"}>
                  <MenuItem value="active">✅ Active</MenuItem>
                  <MenuItem value="paused">⏸️ Paused</MenuItem>
                  <MenuItem value="error">❌ Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Note:</strong> Changes will be applied immediately. Make sure to test your tool after updating.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setEditToolDialog(false);
              setSelectedTool(null);
            }}
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log('Saving changes for:', selectedTool?.name);
              alert(`Changes saved for ${selectedTool?.name}!`);
              setEditToolDialog(false);
              setSelectedTool(null);
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => {
          setDeleteConfirmDialog(false);
          setToolToDelete(null);
        }}
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
            🗑️ Delete Tool
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Alert>
          <Typography variant="body1">
            Are you sure you want to delete <strong>"{toolToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#6B7280' }}>
            This tool has been used {toolToDelete?.usageCount} times and was last used {toolToDelete?.lastUsed}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setDeleteConfirmDialog(false);
              setToolToDelete(null);
            }}
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteTool}
            variant="contained"
            color="error"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Delete Tool
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Test Dialog */}
      <Dialog
        open={apiTestDialog}
        onClose={() => {
          setApiTestDialog(false);
          setSelectedEndpoint(null);
          setTestResponse('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🧪 Test API Endpoint: {selectedEndpoint?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Endpoint Details
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Method:</strong> {selectedEndpoint?.method}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>URL:</strong> {selectedEndpoint?.endpoint}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Calls:</strong> {selectedEndpoint?.calls?.toLocaleString()}
                  </Typography>
                </Paper>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Request Parameters
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter JSON parameters here..."
                  defaultValue='{}'
                  sx={{ mb: 2 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Response
                </Typography>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#1e1e1e', 
                  color: '#00ff00', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  minHeight: '200px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {testResponse || 'Click "Execute Test" to see response...'}
                  </pre>
                </Paper>
              </Box>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💡 Note:</strong> This is a test environment. Actual API calls will be made in production mode.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setApiTestDialog(false);
              setSelectedEndpoint(null);
              setTestResponse('');
            }}
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeApiTest}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Execute Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Documentation Dialog */}
      <Dialog
        open={documentationDialog}
        onClose={() => setDocumentationDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📚 API Documentation
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                📖 Quick Start
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Base URL:</strong><br/>
                  <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                    https://api.sharewise.com/v1
                  </code>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Authentication:</strong><br/>
                  Bearer Token required in headers
                </Typography>
                <Typography variant="body2">
                  <strong>Rate Limits:</strong><br/>
                  Unlimited (Elite)
                </Typography>
              </Paper>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                🔗 SDKs & Libraries
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
                  📦 Python SDK
                </Button>
                <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
                  📦 Node.js SDK
                </Button>
                <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
                  📦 REST API
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937' }}>
                🚀 API Endpoints
              </Typography>
              
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ fontWeight: 600 }}>Portfolio Management</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      GET /api/v1/portfolio
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                      Retrieve current portfolio holdings and performance metrics
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      curl -H "Authorization: Bearer YOUR_TOKEN" https://api.sharewise.com/v1/portfolio
                    </Paper>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                      POST /api/v1/trades
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                      Execute buy/sell trades programmatically
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -d '{JSON.stringify({"symbol":"AAPL","action":"buy","quantity":10}, null, 2)}' https://api.sharewise.com/v1/trades
                    </Paper>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ fontWeight: 600 }}>Market Data</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      GET /api/v1/market-data
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                      Get real-time and historical market data
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.sharewise.com/v1/market-data?symbol=AAPL&period=1d"
                    </Paper>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ fontWeight: 600 }}>Risk Analytics</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      GET /api/v1/risk
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                      Calculate portfolio risk metrics and VaR
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      curl -H "Authorization: Bearer YOUR_TOKEN" https://api.sharewise.com/v1/risk
                    </Paper>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDocumentationDialog(false)}
            sx={{ borderRadius: '12px' }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              window.open('https://docs.sharewise.com/api', '_blank');
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Open Full Documentation
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default CustomTools;
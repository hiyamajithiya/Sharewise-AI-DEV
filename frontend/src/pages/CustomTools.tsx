import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Build,
  Code,
  Notifications,
  Api,
  Dashboard as DashboardIcon,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Settings,
  ExpandMore,
  Webhook,
  Schedule,
  Security,
  Storage,
  CloudSync,
  BugReport,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';

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
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomTools: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [tabValue, setTabValue] = useState(0);
  const [createToolDialog, setCreateToolDialog] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Sample custom tools data
  const customTools = [
    {
      id: 1,
      name: 'Price Alert Bot',
      description: 'Automated price monitoring and alerts via Telegram',
      type: 'webhook',
      status: 'active',
      lastRun: '2 minutes ago',
      executions: 247
    },
    {
      id: 2,
      name: 'Portfolio Rebalancer',
      description: 'Automatically rebalance portfolio based on drift thresholds',
      type: 'scheduler',
      status: 'active',
      lastRun: '1 hour ago',
      executions: 89
    },
    {
      id: 3,
      name: 'News Sentiment Analyzer',
      description: 'Analyze news sentiment for portfolio stocks',
      type: 'api',
      status: 'paused',
      lastRun: '1 day ago',
      executions: 156
    },
  ];

  const apiEndpoints = [
    { name: 'Portfolio Data', endpoint: '/api/v1/portfolio', method: 'GET', calls: 1247 },
    { name: 'Execute Trade', endpoint: '/api/v1/trades', method: 'POST', calls: 89 },
    { name: 'Market Data', endpoint: '/api/v1/market-data', method: 'GET', calls: 3456 },
    { name: 'Risk Metrics', endpoint: '/api/v1/risk', method: 'GET', calls: 567 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'webhook': return <Webhook />;
      case 'scheduler': return <Schedule />;
      case 'api': return <Api />;
      default: return <Build />;
    }
  };

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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Custom Tools & Integrations 🛠️
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isTestingMode && selectedUser
                ? `Testing custom tools for ${selectedUser.role} role`
                : 'Build custom trading tools, webhooks, and API integrations for automated workflows'
              }
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateToolDialog(true)}
          >
            Create Tool
          </Button>
        </Box>
      </Box>

      {/* Elite Feature Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>🌟 Elite Developer Tools:</strong> Advanced API access, custom webhook endpoints, 
          automated trading scripts, and integration capabilities available exclusively to Elite subscribers.
        </Typography>
      </Alert>

      {/* Main Content Tabs */}
        <Paper sx={{ 
          mb: 3,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
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
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* My Tools */}
        <Grid container spacing={3}>
          {customTools.map((tool) => (
            <Grid item xs={12} md={6} lg={4} key={tool.id}>
              <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getToolIcon(tool.type)}
                      <Typography variant="h6" component="div">
                        {tool.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={tool.status}
                      color={getStatusColor(tool.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {tool.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last run: {tool.lastRun}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tool.executions} executions
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="success">
                      <PlayArrow />
                    </IconButton>
                    <IconButton size="small" color="warning">
                      <Pause />
                    </IconButton>
                    <IconButton size="small" color="default">
                      <Settings />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Empty State */}
          {customTools.length === 0 && (
            <Grid item xs={12}>
              <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
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
            <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {endpoint.name}
                            </Typography>
                            <Chip label={endpoint.method} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {endpoint.endpoint}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {endpoint.calls.toLocaleString()} calls this month
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="outlined">
                          Test
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  API Usage
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
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
                    <Typography variant="body2" color="warning.main">
                      85.47%
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Approaching monthly limit. Consider upgrading for higher quotas.
                  </Typography>
                </Alert>

                <Button variant="outlined" fullWidth>
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Webhooks */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Webhook Configuration
                </Typography>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Trading Signals Webhook</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      value="https://api.example.com/trading-signals"
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
                    <Typography>Portfolio Updates Webhook</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      value="https://api.example.com/portfolio-updates"
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
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Webhook Activity
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Today's Deliveries
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    247
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Success rate: 99.2%
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Failed Deliveries
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    2
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Retry in progress
                  </Typography>
                </Box>

                <Button variant="outlined" fullWidth startIcon={<BugReport />}>
                  View Logs
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Scripts & Automation */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                        <Typography variant="h6">Python Scripts</Typography>
                        <Typography variant="body2" color="text.secondary">
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
                        <Typography variant="h6">Scheduled Tasks</Typography>
                        <Typography variant="body2" color="text.secondary">
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
                        <Typography variant="h6">Cloud Functions</Typography>
                        <Typography variant="body2" color="text.secondary">
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
                        <Typography variant="h6">Data Pipeline</Typography>
                        <Typography variant="body2" color="text.secondary">
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
          </CardContent>
        </Card>
      </TabPanel>

      {/* Create Tool Dialog */}
      <Dialog
        open={createToolDialog}
        onClose={() => setCreateToolDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Tool</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tool Name"
                placeholder="e.g., Price Alert Bot"
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
              <FormControl fullWidth>
                <InputLabel>Tool Type</InputLabel>
                <Select label="Tool Type">
                  <MenuItem value="webhook">Webhook</MenuItem>
                  <MenuItem value="scheduler">Scheduled Task</MenuItem>
                  <MenuItem value="api">API Integration</MenuItem>
                  <MenuItem value="script">Custom Script</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Trigger</InputLabel>
                <Select label="Trigger">
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="price">Price Change</MenuItem>
                  <MenuItem value="time">Time-based</MenuItem>
                  <MenuItem value="portfolio">Portfolio Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateToolDialog(false)}>Cancel</Button>
          <Button
            onClick={() => setCreateToolDialog(false)}
            variant="contained"
          >
            Create Tool
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default CustomTools;
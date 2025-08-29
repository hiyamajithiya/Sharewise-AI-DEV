import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ModelTraining as ModelIcon,
  Store as MarketplaceIcon,
  School as LearnIcon,
  Info,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../store';
import { fetchStudioDashboard } from '../store/slices/aiStudioSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import ModelStudio from '../components/ai-studio/ModelStudio';
import Marketplace from '../components/ai-studio/Marketplace';
import MyModels from '../components/ai-studio/MyModels';
import TrainingJobs from '../components/ai-studio/TrainingJobs';
import FnOModelStudio from '../components/ai-studio/FnOModelStudio';

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
      id={`ai-studio-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AIStudio: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, loading, error } = useSelector((state: RootState) => state.aiStudio);
  const [tabValue, setTabValue] = useState(0);
  const [showFnOStudio, setShowFnOStudio] = useState(false);

  useEffect(() => {
    dispatch(fetchStudioDashboard());
  }, [dispatch]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  if (loading && !dashboard) {
    return <LoadingSpinner />;
  }

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
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
              AI Model Studio 🤖
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Create intelligent trading assistants that learn from market data
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setShowFnOStudio(true)}
                startIcon={<TrendingUpIcon />}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                F&O Models
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setShowFnOStudio(false)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                General Models
              </Button>
            </Box>
          </Box>
          
          {/* Quick Help - Top Right */}
          {(!dashboard || dashboard.total_models === 0) && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                maxWidth: 300
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>
                💡 Getting Started
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                AI models predict "Buy/Sell/Hold" decisions by learning from historical data. 
                No coding required - just follow the step-by-step wizard!
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Dashboard Overview - Only show on Dashboard tab */}
      {tabValue === 0 && dashboard && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Models"
                value={dashboard.total_models.toString()}
                icon={<ModelIcon />}
                color="primary"
                subtitle="AI models created"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Published Models"
                value={dashboard.published_models.toString()}
                icon={<MarketplaceIcon />}
                color="success"
                subtitle="Shared in marketplace"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Training Models"
                value={dashboard.training_models.toString()}
                icon={<ModelIcon />}
                color="warning"
                subtitle="Currently learning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Earnings"
                value={`₹${dashboard.total_earnings.toFixed(2)}`}
                icon={<DashboardIcon />}
                color="info"
                subtitle="From model sales"
              />
            </Grid>
          </Grid>
          
          {/* Progress Guide for Beginners - Bottom Right */}
          {dashboard.total_models === 0 && (
            <Grid item xs={12}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  mt: 2
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                  🚀 Quick Start Guide
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                      1. Create Model
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Choose what to predict
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                      2. Select Features
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Pick data indicators
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                      3. Train AI
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      10-30 minutes wait
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>
                      4. Get Predictions
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Ready to trade
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </>
      )}

      {/* Tabs */}
      <Paper sx={{ 
        mb: 3,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '16px'
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'rgba(255,255,255,0.2)',
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: 'white'
              },
              '&:hover': {
                color: 'white'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white'
            }
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Dashboard</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Overview & stats</Typography>
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<ModelIcon />}
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>My Models</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Your AI models</Typography>
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<ModelIcon />}
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Create Model</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Build new AI</Typography>
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<MarketplaceIcon />}
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Marketplace</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Browse & buy models</Typography>
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<LearnIcon />}
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>Training Jobs</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Monitor AI learning</Typography>
              </Box>
            }
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Dashboard Content */}
        {dashboard && (
          <Grid container spacing={3}>
            {/* Recent Models */}
            <Grid item xs={12} lg={6}>
              <Card sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    Recent Models
                  </Typography>
                  {dashboard.recent_models.length === 0 ? (
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      No models created yet. Create your first model to get started.
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {dashboard.recent_models.map((model) => (
                        <Box
                          key={model.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'rgba(255,255,255,0.2)',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: 'white' }}>
                              {model.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {model.model_type} • {model.created_at}
                            </Typography>
                          </Box>
                          <Chip
                            label={model.status}
                            size="small"
                            color={
                              model.status === 'COMPLETED'
                                ? 'success'
                                : model.status === 'TRAINING'
                                ? 'warning'
                                : model.status === 'FAILED'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Training Jobs */}
            <Grid item xs={12} lg={6}>
              <Card sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    Recent Training Jobs
                  </Typography>
                  {dashboard.recent_training_jobs.length === 0 ? (
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      No training jobs yet.
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {dashboard.recent_training_jobs.map((job) => (
                        <Box
                          key={job.id}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'rgba(255,255,255,0.2)',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white' }}>
                              Training Job #{job.id.slice(-8)}
                            </Typography>
                            <Chip
                              label={job.status}
                              size="small"
                              color={
                                job.status === 'COMPLETED'
                                  ? 'success'
                                  : job.status === 'RUNNING'
                                  ? 'warning'
                                  : job.status === 'FAILED'
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          </Box>
                          {job.status === 'RUNNING' && (
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                  {job.current_step}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                  {job.progress_percentage}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={job.progress_percentage}
                                sx={{ 
                                  borderRadius: 1,
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'white'
                                  }
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item>
                      <Button
                        variant="contained"
                        onClick={() => setTabValue(2)}
                        startIcon={<ModelIcon />}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.3)'
                          }
                        }}
                      >
                        Create New Model
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={() => setTabValue(3)}
                        startIcon={<MarketplaceIcon />}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.5)',
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Browse Marketplace
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={() => setTabValue(1)}
                        startIcon={<ModelIcon />}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.5)',
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        View My Models
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MyModels />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {showFnOStudio ? <FnOModelStudio /> : <ModelStudio />}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Marketplace />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <TrainingJobs />
      </TabPanel>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>
        </Box>
      )}
      </Container>
    </Box>
  );
};

export default AIStudio;
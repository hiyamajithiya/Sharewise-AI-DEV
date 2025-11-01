import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  ModelTraining as ModelIcon,
  Store as MarketplaceIcon,
  School as LearnIcon,
  Info,
  TrendingUp as TrendingUpIcon,
  MoreVert,
  Refresh,
  Add,
  PlayArrow,
  SmartToy,
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
import { selectTestingState } from '../store/slices/testingSlice';

const AIStudio: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, loading, error } = useSelector((state: RootState) => state.aiStudio);
  const [currentView, setCurrentView] = useState<'overview' | 'create' | 'marketplace' | 'training'>('overview');
  const [showFnOStudio, setShowFnOStudio] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const user = useSelector((state: any) => state.auth.user);
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const subscriptionTier = effectiveUser?.subscription_tier || 'ELITE';

  useEffect(() => {
    dispatch(fetchStudioDashboard());
  }, [dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading && !dashboard) {
    return <LoadingSpinner />;
  }

  const renderOverview = () => (
    <>
      {/* Welcome Section */}
      <Paper sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        p: 4,
        borderRadius: '20px',
        mb: 4,
        textAlign: 'center'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          🤖 AI Model Studio
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
          Create intelligent trading assistants that learn from market data
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setCurrentView('create')}
            startIcon={<Add />}
            sx={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Create New Model
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setCurrentView('marketplace')}
            startIcon={<MarketplaceIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: 'white',
                background: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Browse Marketplace
          </Button>
        </Box>
      </Paper>

      {/* Stats Overview */}
      {dashboard && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Your Models"
              value={dashboard.total_models.toString()}
              icon={<SmartToy />}
              color="primary"
              subtitle="AI models created"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Training"
              value={dashboard.training_models.toString()}
              icon={<LearnIcon />}
              color="warning"
              subtitle="Models learning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Published"
              value={dashboard.published_models.toString()}
              icon={<MarketplaceIcon />}
              color="success"
              subtitle="In marketplace"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Earnings"
              value={`₹${dashboard.total_earnings.toFixed(0)}`}
              icon={<TrendingUpIcon />}
              color="info"
              subtitle="From model sales"
            />
          </Grid>
        </Grid>
      )}

      {/* Getting Started Guide for new users */}
      {(!dashboard || dashboard.total_models === 0) && (
        <Paper sx={{
          background: '#f0f9ff',
          border: '2px dashed #3b82f6',
          p: 4,
          borderRadius: '20px',
          textAlign: 'center',
          mb: 4
        }}>
          <Typography variant="h5" sx={{ color: '#1e40af', mb: 2, fontWeight: 600 }}>
            🚀 Welcome to AI Studio!
          </Typography>
          <Typography variant="body1" sx={{ color: '#1f2937', mb: 3 }}>
            Create your first AI model in just 4 simple steps. No coding required!
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: '#3b82f6', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Choose Model Type
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: '#10b981', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Select Data Features
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: '#f59e0b', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Train AI Model
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: '#8b5cf6', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  4
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Get Predictions
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            size="large"
            onClick={() => setCurrentView('create')}
            startIcon={<PlayArrow />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            Start Creating Your First AI Model
          </Button>
        </Paper>
      )}

      {/* Your Models Section */}
      {dashboard && dashboard.total_models > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                  Your Recent Models
                </Typography>
                <Button
                  size="small"
                  onClick={() => setCurrentView('create')}
                  sx={{ 
                    color: '#667eea',
                    textTransform: 'none',
                    fontWeight: 600 
                  }}
                >
                  View All
                </Button>
              </Box>
              
              {dashboard.recent_models.length === 0 ? (
                <Typography sx={{ color: '#6B7280', textAlign: 'center', py: 2 }}>
                  No models yet. Create your first one!
                </Typography>
              ) : (
                <Box>
                  {dashboard.recent_models.slice(0, 3).map((model) => (
                    <Box
                      key={model.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: '1px solid #e0e0e0',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#1F2937', fontWeight: 600 }}>
                          {model.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
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
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                  Training Progress
                </Typography>
                <Button
                  size="small"
                  onClick={() => setCurrentView('training')}
                  sx={{ 
                    color: '#667eea',
                    textTransform: 'none',
                    fontWeight: 600 
                  }}
                >
                  View All
                </Button>
              </Box>
              
              {dashboard.recent_training_jobs.length === 0 ? (
                <Typography sx={{ color: '#6B7280', textAlign: 'center', py: 2 }}>
                  No training jobs running.
                </Typography>
              ) : (
                <Box>
                  {dashboard.recent_training_jobs.slice(0, 2).map((job) => (
                    <Box
                      key={job.id}
                      sx={{
                        py: 2,
                        borderBottom: '1px solid #e0e0e0',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#1F2937', fontWeight: 600 }}>
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
                              backgroundColor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </>
  );

  const renderCreateModel = () => (
    <Box>
      <Paper sx={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        p: 3,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#1F2937', fontWeight: 600 }}>
              Create AI Model
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Choose the type of trading model you want to create
            </Typography>
          </Box>
          <Button
            onClick={() => setCurrentView('overview')}
            sx={{ color: '#6B7280', textTransform: 'none' }}
          >
            ← Back to Overview
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{
                p: 3,
                height: '220px',
                border: showFnOStudio ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: '#667eea',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                }
              }}
              onClick={() => setShowFnOStudio(true)}
            >
              <Box sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>
                  F&O Trading Model
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                  Advanced futures & options trading strategies with risk management
                </Typography>
                <Chip 
                  label="Professional" 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              sx={{
                p: 3,
                height: '220px',
                border: !showFnOStudio ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: '#667eea',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                }
              }}
              onClick={() => setShowFnOStudio(false)}
            >
              <Box sx={{ textAlign: 'center' }}>
                <ModelIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937' }}>
                  General Trading Model
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                  Equity trading models for buy/sell/hold decisions
                </Typography>
                <Chip 
                  label="Beginner Friendly" 
                  color="success" 
                  size="small" 
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {showFnOStudio ? <FnOModelStudio /> : <ModelStudio />}
    </Box>
  );

  return (
    <Box sx={{ 
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
      }
    }}>
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Simple Header */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '20px',
          background: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                color: '#1F2937',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}>
                AI Studio
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                {isTestingMode && selectedUser
                  ? `Testing AI studio for ${selectedUser.role} role`
                  : 'Create, manage and deploy your AI trading models'
                }
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`${subscriptionTier} Plan`}
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  backgroundColor: '#f3f4f6',
                  color: '#1F2937',
                  border: '1px solid #d1d5db'
                }} 
              />
              <IconButton onClick={handleMenuClick} sx={{ color: '#1F2937' }}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Action Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { console.log('Refreshing...'); handleMenuClose(); }}>
            <Refresh sx={{ mr: 1 }} /> Refresh Data
          </MenuItem>
          <MenuItem onClick={() => { setCurrentView('create'); handleMenuClose(); }}>
            <Add sx={{ mr: 1 }} /> Create New Model
          </MenuItem>
        </Menu>

        {/* Simple Navigation */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={currentView === 'overview' ? 'contained' : 'outlined'}
            onClick={() => setCurrentView('overview')}
            sx={{
              borderRadius: '15px',
              textTransform: 'none',
              fontWeight: 600,
              ...(currentView === 'overview' ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            Overview
          </Button>
          <Button
            variant={currentView === 'create' ? 'contained' : 'outlined'}
            onClick={() => setCurrentView('create')}
            startIcon={<Add />}
            sx={{
              borderRadius: '15px',
              textTransform: 'none',
              fontWeight: 600,
              ...(currentView === 'create' ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            Create Model
          </Button>
          <Button
            variant={currentView === 'marketplace' ? 'contained' : 'outlined'}
            onClick={() => setCurrentView('marketplace')}
            startIcon={<MarketplaceIcon />}
            sx={{
              borderRadius: '15px',
              textTransform: 'none',
              fontWeight: 600,
              ...(currentView === 'marketplace' ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            Marketplace
          </Button>
          <Button
            variant={currentView === 'training' ? 'contained' : 'outlined'}
            onClick={() => setCurrentView('training')}
            startIcon={<LearnIcon />}
            sx={{
              borderRadius: '15px',
              textTransform: 'none',
              fontWeight: 600,
              ...(currentView === 'training' ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              } : {
                color: '#1F2937',
                borderColor: '#d1d5db',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#667eea',
                  background: '#f8f9ff',
                  color: '#667eea',
                },
              })
            }}
          >
            Training Jobs
          </Button>
        </Box>

        {/* Content based on current view */}
        {currentView === 'overview' && renderOverview()}
        {currentView === 'create' && renderCreateModel()}
        {currentView === 'marketplace' && <Marketplace />}
        {currentView === 'training' && <TrainingJobs />}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default AIStudio;
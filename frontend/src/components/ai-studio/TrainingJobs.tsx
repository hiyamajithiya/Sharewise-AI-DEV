import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb,
  HelpOutline,
  Info,
  Psychology,
  School,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store';
import { fetchTrainingJobs } from '../../store/slices/aiStudioSlice';
import { TrainingJob } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

const TrainingJobs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trainingJobs, loading, error } = useSelector((state: RootState) => state.aiStudio);
  
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchTrainingJobs());
    
    // Auto-refresh every 30 seconds for running jobs
    const interval = setInterval(() => {
      if (trainingJobs.some(job => job.status === 'RUNNING' || job.status === 'QUEUED')) {
        dispatch(fetchTrainingJobs());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, trainingJobs]);

  const handleRefresh = () => {
    dispatch(fetchTrainingJobs());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon color="success" />;
      case 'RUNNING':
        return <PlayArrowIcon color="warning" />;
      case 'FAILED':
        return <ErrorIcon color="error" />;
      case 'QUEUED':
        return <HourglassIcon color="info" />;
      default:
        return <HourglassIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'QUEUED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper component for guidelines
  const GuidelineBox = ({ title, children, icon = <Info /> }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <Alert severity="info" sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {icon}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2">
            {children}
          </Typography>
        </Box>
      </Box>
    </Alert>
  );

  if (loading && trainingJobs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5">AI Training Jobs 🎓</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Watch your AI models learn from historical data in real-time.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Quick Help - Top Right */}
          {trainingJobs.length > 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'info.light', 
                borderRadius: 2, 
                maxWidth: 280,
                border: '1px solid',
                borderColor: 'info.main'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
                💡 Status Guide
              </Typography>
              <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.8rem' }}>
                🟦 Queued → 🟡 Running → 🟢 Completed. Auto-refreshes every 30s.
              </Typography>
            </Paper>
          )}
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh Status
          </Button>
        </Box>
      </Box>



      {trainingJobs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No AI training jobs yet 🎓
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your AI models will appear here once you start training them. Think of this as your "AI classroom" where you can monitor learning progress.
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'info.light', textAlign: 'left', maxWidth: 450, mx: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
                💡 What you'll see here once you start training:
              </Typography>
              <Typography variant="body2" sx={{ color: 'info.dark' }}>
                • <strong>Real-time Progress:</strong> Watch your AI learn step by step<br/>
                • <strong>Training Status:</strong> Queued → Running → Completed<br/>
                • <strong>Performance Metrics:</strong> See how accurate your AI becomes<br/>
                • <strong>Error Tracking:</strong> Troubleshoot any training issues<br/>
                • <strong>Results Summary:</strong> Detailed analysis when training completes
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="primary"
              href="/ai-studio?tab=2"
              size="large"
              sx={{ px: 4 }}
            >
              Create Your First AI Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Job ID
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Training Status
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Learning Progress
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Duration
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Started At
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Details
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {trainingJobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      #{job.id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(job.status)}
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', maxWidth: 200 }}>
                      {job.status === 'RUNNING' ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontSize="0.75rem">
                              🎓 {job.current_step}
                            </Typography>
                            <Typography variant="body2" fontSize="0.75rem" sx={{ fontWeight: 600 }}>
                              {job.progress_percentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={job.progress_percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                            AI is learning patterns...
                          </Typography>
                        </>
                      ) : job.status === 'COMPLETED' ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={100}
                              color="success"
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" fontSize="0.75rem" sx={{ fontWeight: 600 }}>
                              100%
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem' }}>
                            ✅ AI training completed!
                          </Typography>
                        </Box>
                      ) : job.status === 'FAILED' ? (
                        <Box>
                          <Typography variant="body2" color="error.main" fontSize="0.75rem" sx={{ fontWeight: 600 }}>
                            ❌ Training Failed
                          </Typography>
                          <Typography variant="caption" color="error.main" sx={{ fontSize: '0.7rem' }}>
                            Click details to see error
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                            ⏳ Waiting in queue
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Your AI will start learning soon
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDuration(job.started_at, job.completed_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(job.queued_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Training Details & Results">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedJob(job);
                          setDetailDialog(true);
                        }}
                        sx={{ 
                          bgcolor: job.status === 'COMPLETED' ? 'success.light' : 'transparent',
                          '&:hover': { bgcolor: job.status === 'COMPLETED' ? 'success.main' : 'action.hover' }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}

      {/* Job Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology />
            AI Training Details - Job #{selectedJob?.id.slice(-8)}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    📋 Training Session Info
                  </Typography>
                  <Typography variant="body2">• <strong>Job ID:</strong> #{selectedJob.id.slice(-8)}</Typography>
                  <Typography variant="body2">• <strong>Status:</strong> 
                    {selectedJob.status === 'COMPLETED' ? ' ✅ Successfully Trained' :
                     selectedJob.status === 'FAILED' ? ' ❌ Training Failed' :
                     selectedJob.status === 'RUNNING' ? ' 🟡 Currently Learning' :
                     ' ⏳ Waiting in Queue'}
                  </Typography>
                  <Typography variant="body2">• <strong>Queued At:</strong> {formatTimestamp(selectedJob.queued_at)}</Typography>
                  {selectedJob.started_at && (
                    <Typography variant="body2">• <strong>Started Learning:</strong> {formatTimestamp(selectedJob.started_at)}</Typography>
                  )}
                  {selectedJob.completed_at && (
                    <Typography variant="body2">• <strong>Finished At:</strong> {formatTimestamp(selectedJob.completed_at)}</Typography>
                  )}
                  {selectedJob.started_at && selectedJob.completed_at && (
                    <Typography variant="body2">• <strong>Total Learning Time:</strong> {formatDuration(selectedJob.started_at, selectedJob.completed_at)}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    🎓 Learning Progress
                  </Typography>
                  {selectedJob.status === 'RUNNING' && (
                    <Box>
                      <Typography variant="body2" gutterBottom sx={{ color: 'warning.main', fontWeight: 600 }}>
                        🧠 Currently Learning: {selectedJob.current_step}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedJob.progress_percentage}
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant="body2" align="center" sx={{ fontWeight: 600 }}>
                        {selectedJob.progress_percentage}% Complete
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                        Your AI is studying market patterns and learning to make predictions
                      </Typography>
                    </Box>
                  )}
                  {selectedJob.status === 'COMPLETED' && (
                    <Box>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
                        🎉 AI Training Completed Successfully!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your AI trading assistant is now ready to make predictions. Check the performance metrics below to see how well it learned.
                      </Typography>
                    </Box>
                  )}
                  {selectedJob.status === 'FAILED' && (
                    <Box>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
                        ⚠️ Training Encountered Issues
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Don't worry! Training failures are common. Check the error message below and try adjusting your model configuration.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {selectedJob.error_message && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    ⚠️ Training Error Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>What went wrong:</strong> {selectedJob.error_message}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'error.dark' }}>
                    <strong>💡 Common fixes:</strong> Check your data quality, reduce training period, or try a simpler algorithm like Random Forest.
                  </Typography>
                </Alert>
              )}

              {selectedJob.result_data && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        📊 Detailed Training Results & AI Performance Report
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>

                    {selectedJob.result_data.metrics && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'success.main', mb: 2 }}>
                          🎯 AI Performance Metrics (How Smart Your AI Became)
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(selectedJob.result_data.metrics).map(([key, value]) => (
                            <Grid item xs={6} sm={4} key={key}>
                              <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {key.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {typeof value === 'number' ? 
                                    (key.includes('accuracy') || key.includes('precision') || key.includes('recall') || key.includes('f1') ? 
                                      `${(value * 100).toFixed(1)}%` : value.toFixed(4)
                                    ) : String(value)
                                  }
                                </Typography>
                                {key === 'accuracy' && typeof value === 'number' && (
                                  <Typography variant="caption" color={value > 0.8 ? 'success.main' : value > 0.6 ? 'warning.main' : 'error.main'}>
                                    {value > 0.8 ? '🎉 Excellent!' : value > 0.6 ? '👍 Good' : '⚠️ Needs improvement'}
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {selectedJob.result_data.backtest_results && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'info.main', mb: 2 }}>
                          📈 Backtest Results (How Your AI Would Have Performed in the Past)
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>What is backtesting?</strong> We tested your AI on historical data it never saw during training. This shows how it would have performed in real trading scenarios.
                          </Typography>
                        </Alert>
                        <Grid container spacing={2}>
                          {Object.entries(selectedJob.result_data.backtest_results).map(([key, value]) => (
                            <Grid item xs={6} sm={4} key={key}>
                              <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {key.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                                  {typeof value === 'number' ? 
                                    (key.includes('return') || key.includes('profit') ? 
                                      `${(value * 100).toFixed(1)}%` : value.toFixed(4)
                                    ) : String(value)
                                  }
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {selectedJob.result_data.feature_importance && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'warning.main', mb: 2 }}>
                          🎯 Feature Importance (What Data Your AI Found Most Useful)
                        </Typography>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>🧠 AI Insights:</strong> These are the market indicators your AI found most important for making predictions. 
                            Higher bars mean your AI relies more on that data point when making trading decisions.
                          </Typography>
                        </Alert>
                        <Grid container spacing={2}>
                          {Object.entries(selectedJob.result_data.feature_importance)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 10)
                            .map(([feature, importance], index) => (
                            <Grid item xs={12} sm={6} key={feature}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{index + 1} {feature.replace(/_/g, ' ').toUpperCase()}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {((importance as number) * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={(importance as number) * 100}
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 2,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: index < 3 ? 'success.main' : 'primary.main'
                                    }
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {index < 3 ? '🌟 Critical for decisions' : '📊 Moderately important'}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Bottom Progress Guide - Only show when jobs exist */}
      {trainingJobs.length > 0 && (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mt: 3, 
            bgcolor: 'success.light', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'success.main'
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
            🎯 Training Progress Guide
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🟦 Queued
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Waiting to start learning
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🟡 Running
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AI studying market data
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🟢 Completed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ready to make predictions
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                👁️ View Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                See performance & results
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default TrainingJobs;
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Publish as PublishIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store';
import {
  fetchMLModels,
  deleteMLModel,
  trainModel,
  publishModel,
  unpublishModel,
} from '../../store/slices/aiStudioSlice';
import { MLModel } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

const MyModels: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { models, loading, error } = useSelector((state: RootState) => state.aiStudio);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [publishDialog, setPublishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [publishPrice, setPublishPrice] = useState('');

  useEffect(() => {
    dispatch(fetchMLModels({}));
  }, [dispatch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, model: MLModel) => {
    setAnchorEl(event.currentTarget);
    setSelectedModel(model);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModel(null);
  };

  const handleTrainModel = (model: MLModel) => {
    dispatch(trainModel(model.id));
    handleMenuClose();
  };

  const handlePublishModel = () => {
    if (selectedModel && publishPrice) {
      dispatch(publishModel({
        modelId: selectedModel.id,
        publishData: { monthly_lease_price: parseFloat(publishPrice) }
      }));
      setPublishDialog(false);
      setPublishPrice('');
      handleMenuClose();
    }
  };

  const handleUnpublishModel = () => {
    if (selectedModel) {
      dispatch(unpublishModel(selectedModel.id));
      handleMenuClose();
    }
  };

  const handleDeleteModel = () => {
    if (selectedModel) {
      dispatch(deleteMLModel(selectedModel.id));
      setDeleteDialog(false);
      handleMenuClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'TRAINING':
        return 'warning';
      case 'PUBLISHED':
        return 'info';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatMetric = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(4);
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toFixed(2)}`;
  };

  if (loading && models.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">My Models</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Quick Help when models exist */}
          {models.length > 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5, 
                bgcolor: 'info.light', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'info.main'
              }}
            >
              <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.8rem' }}>
                💡 Right-click model cards for training, publishing & management options
              </Typography>
            </Paper>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<TrendingUpIcon />}
            href="/ai-studio"
          >
            Create New Model
          </Button>
        </Box>
      </Box>

      {models.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No AI models yet 🤖
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Your AI trading assistants will appear here once you create them. Each model will learn from market data and help you make better trading decisions.
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'info.light', textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
                💡 What you'll see here:
              </Typography>
              <Typography variant="body2" sx={{ color: 'info.dark' }}>
                • Model status (Training, Completed, Published)<br/>
                • Performance metrics and accuracy<br/>
                • Training progress and logs<br/>
                • Publishing options for marketplace<br/>
                • Action buttons (Start, Stop, Delete)
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="primary"
              href="/ai-studio"
              size="large"
              sx={{ px: 4 }}
            >
              Create Your First AI Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {models.map((model) => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {model.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, model)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {model.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={model.status}
                      size="small"
                      color={getStatusColor(model.status) as any}
                    />
                    <Chip
                      label={model.model_type}
                      size="small"
                      variant="outlined"
                    />
                    {model.is_published && (
                      <Chip
                        label="Published"
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {model.status === 'TRAINING' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Training in progress...
                      </Typography>
                      <LinearProgress sx={{ mt: 1 }} />
                    </Box>
                  )}

                  {model.status === 'COMPLETED' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Performance Metrics
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy
                          </Typography>
                          <Typography variant="body2">
                            {formatMetric(model.accuracy)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Win Rate
                          </Typography>
                          <Typography variant="body2">
                            {model.win_rate ? `${(model.win_rate * 100).toFixed(1)}%` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Sharpe Ratio
                          </Typography>
                          <Typography variant="body2">
                            {formatMetric(model.sharpe_ratio)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Return
                          </Typography>
                          <Typography variant="body2">
                            {model.total_return ? `${(model.total_return * 100).toFixed(1)}%` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {model.is_published && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Marketplace Stats
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Monthly Price
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(model.monthly_lease_price)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Earnings
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(model.total_earnings)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Features: {model.features.length} • Created: {new Date(model.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedModel?.status === 'DRAFT' && (
          <MenuItem onClick={() => handleTrainModel(selectedModel)}>
            <PlayIcon sx={{ mr: 1 }} />
            Start Training
          </MenuItem>
        )}
        
        {selectedModel?.status === 'FAILED' && (
          <MenuItem onClick={() => handleTrainModel(selectedModel)}>
            <PlayIcon sx={{ mr: 1 }} />
            Retry Training
          </MenuItem>
        )}
        
        {selectedModel?.status === 'COMPLETED' && !selectedModel.is_published && (
          <MenuItem onClick={() => setPublishDialog(true)}>
            <PublishIcon sx={{ mr: 1 }} />
            Publish to Marketplace
          </MenuItem>
        )}
        
        {selectedModel?.is_published && (
          <MenuItem onClick={handleUnpublishModel}>
            <StopIcon sx={{ mr: 1 }} />
            Remove from Marketplace
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {}}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Model
        </MenuItem>
        
        <MenuItem onClick={() => {}}>
          <AssessmentIcon sx={{ mr: 1 }} />
          View Performance
        </MenuItem>
        
        <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Model
        </MenuItem>
      </Menu>

      {/* Publish Dialog */}
      <Dialog open={publishDialog} onClose={() => setPublishDialog(false)}>
        <DialogTitle>Publish Model to Marketplace</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Set a monthly lease price for your model. The platform takes a 10% commission.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Monthly Lease Price (₹)"
            type="number"
            fullWidth
            variant="outlined"
            value={publishPrice}
            onChange={(e) => setPublishPrice(e.target.value)}
            inputProps={{ min: 1, step: 0.01 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Users will be able to lease your model for {publishPrice ? `₹${publishPrice}` : '₹X'} per month.
            You'll earn {publishPrice ? `₹${(parseFloat(publishPrice) * 0.9).toFixed(2)}` : '₹X'} per lease (after 10% platform fee).
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePublishModel}
            variant="contained"
            disabled={!publishPrice || parseFloat(publishPrice) <= 0}
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Model</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedModel?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteModel} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default MyModels;
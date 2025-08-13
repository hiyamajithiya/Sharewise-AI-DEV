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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Lightbulb,
  HelpOutline,
  Warning,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store';
import {
  fetchMarketplace,
  leaseModel,
} from '../../store/slices/aiStudioSlice';
import { MarketplaceModel } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

const Marketplace: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { marketplace, loading, error } = useSelector((state: RootState) => state.aiStudio);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modelTypeFilter, setModelTypeFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [sortBy, setSortBy] = useState('-total_return');
  const [selectedModel, setSelectedModel] = useState<MarketplaceModel | null>(null);
  const [leaseDialog, setLeaseDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchMarketplace({
      search: searchQuery,
      model_type: modelTypeFilter,
      max_price: maxPriceFilter,
      ordering: sortBy,
    }));
  }, [dispatch, searchQuery, modelTypeFilter, maxPriceFilter, sortBy]);

  const handleLeaseModel = () => {
    if (selectedModel) {
      dispatch(leaseModel(selectedModel.id));
      setLeaseDialog(false);
      setSelectedModel(null);
    }
  };

  const formatMetric = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(4);
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Helper component for guidelines
  const GuidelineBox = ({ title, children, icon = <InfoIcon /> }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
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

  if (loading && marketplace.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5">AI Model Marketplace 🛒</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Discover and lease proven AI trading models from experienced creators.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Quick Help - Top Right */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'info.light', 
              borderRadius: 2, 
              maxWidth: 300,
              border: '1px solid',
              borderColor: 'info.main'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
              💡 Quick Start
            </Typography>
            <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.8rem' }}>
              Rent proven AI models instead of building your own. Look for high returns, good ratings, and positive reviews.
            </Typography>
          </Paper>
          
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            href="/ai-studio?tab=4"
          >
            My Leases
          </Button>
        </Box>
      </Box>




      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          🔎 Search & Filter AI Models
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search models (e.g., NIFTY, Banking)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Try: RELIANCE, NIFTY, day trading"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={modelTypeFilter}
                onChange={(e) => setModelTypeFilter(e.target.value)}
                label="Model Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="CLASSIFICATION">
                  <Box>
                    <Typography variant="body2">Classification</Typography>
                    <Typography variant="caption" color="text.secondary">
                      🟢 Best for beginners
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="REGRESSION">
                  <Box>
                    <Typography variant="body2">Regression</Typography>
                    <Typography variant="caption" color="text.secondary">
                      🟡 Price predictions
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="CLUSTERING">
                  <Box>
                    <Typography variant="body2">Clustering</Typography>
                    <Typography variant="caption" color="text.secondary">
                      🔴 Pattern analysis
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Max Price (₹)"
              type="number"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value)}
              helperText="Monthly budget"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="-total_return">
                  <Box>
                    <Typography variant="body2">Best Return</Typography>
                    <Typography variant="caption" color="text.secondary">
                      🟢 Recommended for beginners
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="-sharpe_ratio">Best Sharpe Ratio</MenuItem>
                <MenuItem value="-win_rate">Highest Win Rate</MenuItem>
                <MenuItem value="monthly_lease_price">Lowest Price</MenuItem>
                <MenuItem value="-monthly_lease_price">Highest Price</MenuItem>
                <MenuItem value="-total_leases">Most Popular</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon />
              <Typography variant="body2">
                {marketplace.length} AI models found
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {marketplace.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No AI models found 🔍
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Try adjusting your search filters to find more models, or check back later as new AI models are added daily.
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'warning.light', textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}>
                💡 Search Tips:
              </Typography>
              <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                • Remove price filters to see more options<br/>
                • Try broader search terms (e.g., just "NIFTY")<br/>
                • Select "All Types" for model type<br/>
                • New AI models are added weekly!
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="primary"
              href="/ai-studio?tab=2"
              sx={{ px: 4 }}
            >
              Create Your Own AI Model Instead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {marketplace.map((model) => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {model.name}
                    </Typography>
                    <Tooltip title="Model Information">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedModel(model);
                          setLeaseDialog(true);
                        }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      by {model.creator_username}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {model.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={model.model_type}
                      size="small"
                      variant="outlined"
                    />
                    {model.total_leases > 0 && (
                      <Chip
                        label={`${model.total_leases} leases`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {model.average_rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={model.average_rating} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">
                        ({model.average_rating.toFixed(1)})
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total Return
                        </Typography>
                        <Typography 
                          variant="body2"
                          color={model.total_return && model.total_return > 0 ? 'success.main' : 'error.main'}
                        >
                          {formatPercentage(model.total_return)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Typography variant="body2">
                          {formatPercentage(model.win_rate)}
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
                          Max Drawdown
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {formatPercentage(model.max_drawdown)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(model.monthly_lease_price)}/month
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        30-day lease
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => {
                        setSelectedModel(model);
                        setLeaseDialog(true);
                      }}
                    >
                      Lease
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Lease Confirmation Dialog */}
      <Dialog
        open={leaseDialog}
        onClose={() => setLeaseDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon />
            Lease Model: {selectedModel?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedModel && (
            <Box>
              <Typography variant="body1" paragraph>
                You are about to lease this ML trading model for one month.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Model Details
                    </Typography>
                    <Typography variant="body2">Name: {selectedModel.name}</Typography>
                    <Typography variant="body2">Type: {selectedModel.model_type}</Typography>
                    <Typography variant="body2">Creator: {selectedModel.creator_username}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Performance
                    </Typography>
                    <Typography variant="body2">
                      Total Return: {formatPercentage(selectedModel.total_return)}
                    </Typography>
                    <Typography variant="body2">
                      Win Rate: {formatPercentage(selectedModel.win_rate)}
                    </Typography>
                    <Typography variant="body2">
                      Sharpe Ratio: {formatMetric(selectedModel.sharpe_ratio)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <GuidelineBox title="What You Get When You Lease This AI Model" icon={<InfoIcon />}>
                <strong>Your AI trading assistant will provide:</strong><br/><br/>
                • <strong>📱 Daily Signals:</strong> Buy/Sell/Hold recommendations for your stocks<br/>
                • <strong>📊 Performance Dashboard:</strong> Track how well the AI is doing<br/>
                • <strong>🔄 Real-time Updates:</strong> Get fresh predictions as market conditions change<br/>
                • <strong>📈 Historical Analysis:</strong> See past performance and accuracy<br/><br/>
                
                <strong>⏰ Lease Duration:</strong> 30 days from activation (auto-renewal available)
              </GuidelineBox>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>💳 Lease Terms:</strong>
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li><strong>Duration:</strong> 30 days from activation</li>
                  <li><strong>Monthly Price:</strong> {formatCurrency(selectedModel.monthly_lease_price)}</li>
                  <li><strong>What's Included:</strong> AI predictions, performance analytics, signal history</li>
                  <li><strong>Renewal:</strong> Auto-renewal available (can be disabled anytime)</li>
                  <li><strong>Support:</strong> Direct creator support for questions</li>
                </ul>
              </Alert>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ Important Beginner Notice:</strong><br/>
                  • AI models are tools that help with decisions, but YOU make the final trading choices<br/>
                  • Past performance doesn't guarantee future results - markets can be unpredictable<br/>
                  • Start with small amounts to test the model before investing larger sums<br/>
                  • Always use proper risk management (stop losses, position sizing)<br/>
                  • Consider this as ONE input in your trading decisions, not the only factor
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaseDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLeaseModel}
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartIcon />}
          >
            Confirm Lease ({selectedModel ? formatCurrency(selectedModel.monthly_lease_price) : ''})
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Bottom Help Guide - Only show when models exist */}
      {marketplace.length > 0 && (
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
            🎯 Model Selection Tips
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Total Return
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Higher = more profitable
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Win Rate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                60%+ is good
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                User Reviews
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Check ratings & feedback
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Model Type
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Classification = beginner friendly
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Marketplace;
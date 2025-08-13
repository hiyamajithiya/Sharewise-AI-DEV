import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface FnOModelType {
  type: string;
  name: string;
  description: string;
  recommended_features: string[];
  target_variables: string[];
  algorithms: string[];
  min_training_days: number;
  complexity: string;
}

interface FnOStrategy {
  id: string;
  name: string;
  strategy_type: string;
  description: string;
  risk_level: string;
  minimum_capital: number;
  instruments_required: string[];
  best_market_condition: string;
}

interface Feature {
  name: string;
  display_name: string;
  category: string;
  description: string;
}

const FnOModelStudio: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [modelData, setModelData] = useState<any>({
    name: '',
    description: '',
    model_type: '',
    instrument_types: ['OPTIONS'],
    underlying_assets: ['NIFTY'],
    features: [],
    target_variable: '',
    training_parameters: {},
    training_period_days: 252,
    option_strategies: [],
    expiry_handling: 'AUTO_ROLLOVER'
  });

  const [fnoModelTypes, setFnoModelTypes] = useState<FnOModelType[]>([]);
  const [fnoStrategies, setFnoStrategies] = useState<FnOStrategy[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [instruments, setInstruments] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    'Choose F&O Model Type',
    'Select Strategy Template',
    'Configure Instruments',
    'Select Features',
    'Training Configuration',
    'Review & Create'
  ];

  useEffect(() => {
    loadFnOData();
  }, []);

  const loadFnOData = async () => {
    try {
      const [modelTypesRes, strategiesRes, featuresRes, instrumentsRes] = await Promise.all([
        api.get('/api/ai-studio/fno/model-types/'),
        api.get('/api/ai-studio/fno/strategies/'),
        api.get('/api/ai-studio/features/'),
        api.get('/api/ai-studio/fno/instruments/')
      ]);

      setFnoModelTypes((modelTypesRes as any).data.model_types || []);
      setFnoStrategies((strategiesRes as any).data.strategies || []);
      setAvailableFeatures((featuresRes as any).data.features || []);
      setInstruments((instrumentsRes as any).data || {});
    } catch (err) {
      console.error('Error loading F&O data:', err);
      setError('Failed to load F&O configuration data');
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleModelTypeSelect = (modelType: FnOModelType) => {
    setModelData((prev: any) => ({
      ...prev,
      model_type: modelType.type,
      features: modelType.recommended_features,
      target_variable: modelType.target_variables[0],
      training_period_days: modelType.min_training_days
    }));
  };

  const handleStrategySelect = (strategy: FnOStrategy) => {
    setModelData((prev: any) => ({
      ...prev,
      option_strategies: [strategy.strategy_type],
      instrument_types: strategy.instruments_required,
      description: `${strategy.name} - ${strategy.description}`
    }));
  };

  const handleFeatureToggle = (featureName: string) => {
    setModelData((prev: any) => ({
      ...prev,
      features: prev.features.includes(featureName)
        ? prev.features.filter((f: string) => f !== featureName)
        : [...prev.features, featureName]
    }));
  };

  const createModel = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai-studio/fno/create-model/', modelData);
      setError('');
      // Reset form or redirect
      console.log('F&O Model created:', (response as any).data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create F&O model');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select F&O Model Type
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the type of F&O AI model you want to create
            </Typography>
            <Grid container spacing={2}>
              {fnoModelTypes.map((type) => (
                <Grid item xs={12} md={6} key={type.type}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      border: modelData.model_type === type.type ? '2px solid' : '1px solid',
                      borderColor: modelData.model_type === type.type ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handleModelTypeSelect(type)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PsychologyIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">{type.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {type.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip 
                          label={`Complexity: ${type.complexity}`} 
                          size="small" 
                          color={type.complexity === 'HIGH' ? 'error' : type.complexity === 'MEDIUM' ? 'warning' : 'success'}
                        />
                        <Chip 
                          label={`Min: ${type.min_training_days} days`} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Recommended Features: {type.recommended_features.join(', ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Strategy Template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a pre-built F&O strategy template to get started quickly
            </Typography>
            <Grid container spacing={2}>
              {fnoStrategies.map((strategy) => (
                <Grid item xs={12} md={6} key={strategy.id}>
                  <Card 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strategy.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {strategy.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={strategy.risk_level} 
                          size="small" 
                          color={strategy.risk_level === 'HIGH' ? 'error' : strategy.risk_level === 'MEDIUM' ? 'warning' : 'success'}
                        />
                        <Chip 
                          label={`₹${strategy.minimum_capital.toLocaleString()}`} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={strategy.best_market_condition} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Instruments & Assets
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Instrument Types</InputLabel>
                  <Select
                    multiple
                    value={modelData.instrument_types}
                    onChange={(e) => setModelData((prev: any) => ({
                      ...prev,
                      instrument_types: e.target.value as string[]
                    }))}
                  >
                    <MenuItem value="OPTIONS">Options</MenuItem>
                    <MenuItem value="FUTURES">Futures</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Underlying Assets</InputLabel>
                  <Select
                    multiple
                    value={modelData.underlying_assets}
                    onChange={(e) => setModelData((prev: any) => ({
                      ...prev,
                      underlying_assets: e.target.value as string[]
                    }))}
                  >
                    {instruments.options?.map((inst: any) => (
                      <MenuItem key={inst.symbol} value={inst.symbol}>
                        {inst.name} (Lot: {inst.lot_size})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiry Handling</InputLabel>
                  <Select
                    value={modelData.expiry_handling}
                    onChange={(e) => setModelData((prev: any) => ({
                      ...prev,
                      expiry_handling: e.target.value
                    }))}
                  >
                    <MenuItem value="AUTO_ROLLOVER">Auto Rollover</MenuItem>
                    <MenuItem value="MANUAL_EXIT">Manual Exit</MenuItem>
                    <MenuItem value="EXPIRY_BASED">Expiry Based</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const featuresByCategory = availableFeatures.reduce((acc, feature) => {
          if (!acc[feature.category]) {
            acc[feature.category] = [];
          }
          acc[feature.category].push(feature);
          return acc;
        }, {} as Record<string, Feature[]>);

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Features for Training
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the F&O-specific features your model will use for predictions
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              F&O models require specialized features. Options Greeks and volatility features are highly recommended.
            </Alert>

            {Object.entries(featuresByCategory).map(([category, features]) => (
              <Accordion key={category} defaultExpanded={['Options Greeks', 'Options Pricing'].includes(category)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {category} ({features.filter(f => modelData.features.includes(f.name)).length}/{features.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {features.map((feature) => (
                      <FormControlLabel
                        key={feature.name}
                        control={
                          <Checkbox
                            checked={modelData.features.includes(feature.name)}
                            onChange={() => handleFeatureToggle(feature.name)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {feature.display_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feature.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Training Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={modelData.name}
                  onChange={(e) => setModelData((prev: any) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Training Period (Days)"
                  type="number"
                  value={modelData.training_period_days}
                  onChange={(e) => setModelData((prev: any) => ({ ...prev, training_period_days: parseInt(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={modelData.description}
                  onChange={(e) => setModelData((prev: any) => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review F&O Model Configuration
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Model Type</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {fnoModelTypes.find(t => t.type === modelData.model_type)?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Instruments</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {modelData.instrument_types.join(', ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Underlying Assets</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {modelData.underlying_assets.join(', ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Features Selected</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {modelData.features.length} features
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Training Period</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {modelData.training_period_days} days
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        F&O Model Studio 📈
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create AI models specialized for Futures & Options trading with advanced Greeks analysis and volatility strategies
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={createModel}
                disabled={loading || !modelData.name}
              >
                {loading ? 'Creating F&O Model...' : 'Create F&O Model'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !modelData.model_type) ||
                  (activeStep === 3 && modelData.features.length === 0)
                }
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FnOModelStudio;
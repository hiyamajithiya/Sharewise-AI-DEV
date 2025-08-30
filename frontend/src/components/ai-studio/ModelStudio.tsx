import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Info,
  HelpOutline,
  Lightbulb,
  Warning,
  Psychology,
} from '@mui/icons-material';

import { RootState, AppDispatch } from '../../store';
import { createMLModel, fetchAvailableFeatures } from '../../store/slices/aiStudioSlice';
import { Feature } from '../../types';

const steps = [
  'Basic Information',
  'Features & Target',
  'Training Parameters',
  'Review & Create'
];

const ModelStudio: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availableFeatures, loading, error } = useSelector((state: RootState) => state.aiStudio);
  
  const [activeStep, setActiveStep] = useState(0);
  const [modelData, setModelData] = useState({
    name: '',
    description: '',
    model_type: 'CLASSIFICATION',
    target_variable: 'signal_type',
    features: [] as string[],
    training_period_days: 365,
    validation_split: 0.2,
    training_parameters: {
      algorithm: 'random_forest',
      n_estimators: 100,
      max_depth: 10,
      learning_rate: 0.1,
      C: 1.0,
      kernel: 'rbf',
    },
  });

  const [featuresByCategory, setFeaturesByCategory] = useState<Record<string, Feature[]>>({});

  useEffect(() => {
    dispatch(fetchAvailableFeatures());
  }, [dispatch]);

  useEffect(() => {
    if (availableFeatures.length > 0) {
      const grouped = availableFeatures.reduce((acc, feature) => {
        if (!acc[feature.category]) {
          acc[feature.category] = [];
        }
        acc[feature.category].push(feature);
        return acc;
      }, {} as Record<string, Feature[]>);
      setFeaturesByCategory(grouped);
    }
  }, [availableFeatures]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleFeatureChange = (featureName: string, checked: boolean) => {
    setModelData(prev => ({
      ...prev,
      features: checked
        ? [...prev.features, featureName]
        : prev.features.filter(f => f !== featureName)
    }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createMLModel(modelData)).unwrap();
      // Reset form and show success message
      setModelData({
        name: '',
        description: '',
        model_type: 'CLASSIFICATION',
        target_variable: 'signal_type',
        features: [],
        training_period_days: 365,
        validation_split: 0.2,
        training_parameters: {
          algorithm: 'random_forest',
          n_estimators: 100,
          max_depth: 10,
          learning_rate: 0.1,
          C: 1.0,
          kernel: 'rbf',
        },
      });
      setActiveStep(0);
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return modelData.name.trim() !== '' && modelData.description.trim() !== '';
      case 1:
        return modelData.features.length > 0;
      case 2:
        return true; // Parameters have defaults
      case 3:
        return true;
      default:
        return false;
    }
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create New AI Trading Model ✨
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Build your own intelligent trading assistant that learns from market data and makes predictions for you
        </Typography>
        
        {/* Quick Help - Below Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            bgcolor: 'info.light', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'info.main',
            mb: 2
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
            💡 Quick Start Guide
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
            Create an AI that predicts Buy/Sell/Hold decisions. Classification models are best for beginners.
            Takes 5 min to setup + 10-30 min to train.
          </Typography>
        </Paper>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Information */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon fontSize="small" />
                  Basic Information
                </Box>
              </StepLabel>
              <StepContent>

                <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', minHeight: '80px', display: 'flex', alignItems: 'stretch' }}>
                      <TextField
                        fullWidth
                        label="Model Name"
                        value={modelData.name}
                        onChange={(e) => setModelData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., RELIANCE Buy/Sell Predictor"
                        helperText="Give your AI model a descriptive name"
                        required
                        sx={{ 
                          '& .MuiInputBase-root': {
                            height: '56px'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', minHeight: '80px', display: 'flex', alignItems: 'stretch' }}>
                      <FormControl fullWidth sx={{
                        '& .MuiInputBase-root': {
                          height: '56px'
                        }
                      }}>
                        <InputLabel>Model Type</InputLabel>
                        <Select
                          value={modelData.model_type}
                          onChange={(e) => setModelData(prev => ({ ...prev, model_type: e.target.value }))}
                          label="Model Type"
                        >
                          <MenuItem value="CLASSIFICATION">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Classification (Buy/Sell/Hold)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟢 Beginner-friendly - Simple decisions
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="REGRESSION">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Regression (Price Prediction)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟡 Advanced - Predicts exact prices
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="CLUSTERING">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Clustering (Pattern Recognition)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🔴 Expert - Finds hidden patterns
                              </Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={modelData.description}
                        onChange={(e) => setModelData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Example: This AI learns from RELIANCE stock data to predict whether I should buy, sell, or hold based on technical indicators"
                        helperText="Describe what you want your AI to learn and predict"
                        required
                        sx={{ minHeight: '120px' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(0)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Features & Target */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon fontSize="small" />
                  Features & Target Variable
                </Box>
              </StepLabel>
              <StepContent>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
                      <FormControl fullWidth sx={{ minHeight: '80px' }}>
                        <InputLabel>Target Variable</InputLabel>
                        <Select
                          value={modelData.target_variable}
                          onChange={(e) => setModelData(prev => ({ ...prev, target_variable: e.target.value }))}
                          label="Target Variable"
                        >
                          <MenuItem value="signal_type">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Signal Type (Buy/Sell/Hold)</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟢 Best for beginners - Clear decisions
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="price_change">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Price Change</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟡 Advanced - Predicts price movements
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="return">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Return</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟡 Advanced - Predicts profit/loss %
                              </Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      height: '100%', 
                      minHeight: '80px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Features ({modelData.features.length})
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        flex: 1,
                        alignItems: 'flex-start'
                      }}>
                        {modelData.features.map(feature => (
                          <Chip
                            key={feature}
                            label={availableFeatures.find(f => f.name === feature)?.display_name || feature}
                            size="small"
                            onDelete={() => handleFeatureChange(feature, false)}
                          />
                        ))}
                        {modelData.features.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Select features from the categories below
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>

                  <Typography variant="h6" gutterBottom>
                    Available Features (Select the data your AI will study)
                  </Typography>
                  {Object.entries(featuresByCategory).map(([category, features]) => (
                    <Accordion key={category}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          {category} ({features.filter(f => modelData.features.includes(f.name)).length}/{features.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormGroup>
                          <Grid container spacing={1}>
                            {features.map(feature => (
                              <Grid item xs={12} sm={6} md={4} key={feature.name}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={modelData.features.includes(feature.name)}
                                      onChange={(e) => handleFeatureChange(feature.name, e.target.checked)}
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2">
                                        {feature.display_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {feature.description}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </FormGroup>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(1)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Training Parameters */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon fontSize="small" />
                  Training Parameters
                </Box>
              </StepLabel>
              <StepContent>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
                      <FormControl fullWidth sx={{ minHeight: '80px' }}>
                        <InputLabel>Algorithm</InputLabel>
                        <Select
                          value={modelData.training_parameters.algorithm}
                          onChange={(e) => setModelData(prev => ({
                            ...prev,
                            training_parameters: { ...prev.training_parameters, algorithm: e.target.value }
                          }))}
                          label="Algorithm"
                        >
                          <MenuItem value="random_forest">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Random Forest</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟢 Beginner-friendly - Reliable and accurate
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="gradient_boosting">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Gradient Boosting</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟡 Advanced - High accuracy, complex
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="logistic_regression">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Logistic Regression</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🟢 Simple - Fast and interpretable
                              </Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="svm">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Support Vector Machine</Typography>
                              <Typography variant="caption" color="text.secondary">
                                🔴 Expert - Complex but powerful
                              </Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      height: '100%', 
                      minHeight: '80px',
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}>
                      <Typography gutterBottom>
                        Training Period: {modelData.training_period_days} days
                        <Typography variant="caption" color="text.secondary" display="block">
                          How much historical data to use for learning
                        </Typography>
                      </Typography>
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 1 }}>
                        <Slider
                          value={modelData.training_period_days}
                          onChange={(_, value) => setModelData(prev => ({ ...prev, training_period_days: value as number }))}
                          min={30}
                          max={1095}
                          step={30}
                          marks={[
                            { value: 30, label: '1m' },
                            { value: 365, label: '1y (Recommended)' },
                            { value: 730, label: '2y' },
                            { value: 1095, label: '3y' },
                          ]}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      height: '100%', 
                      minHeight: '80px',
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}>
                      <Typography gutterBottom>
                        Validation Split: {(modelData.validation_split * 100).toFixed(0)}%
                        <Typography variant="caption" color="text.secondary" display="block">
                          Data reserved for testing accuracy
                        </Typography>
                      </Typography>
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 1 }}>
                        <Slider
                          value={modelData.validation_split}
                          onChange={(_, value) => setModelData(prev => ({ ...prev, validation_split: value as number }))}
                          min={0.1}
                          max={0.4}
                          step={0.05}
                          marks={[
                            { value: 0.1, label: '10%' },
                            { value: 0.2, label: '20% (Recommended)' },
                            { value: 0.3, label: '30%' },
                            { value: 0.4, label: '40%' },
                          ]}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  {/* Algorithm-specific parameters */}
                  {(modelData.training_parameters.algorithm === 'random_forest' || 
                    modelData.training_parameters.algorithm === 'gradient_boosting') && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: '100%' }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Number of Estimators"
                            value={modelData.training_parameters.n_estimators}
                            onChange={(e) => setModelData(prev => ({
                              ...prev,
                              training_parameters: { ...prev.training_parameters, n_estimators: parseInt(e.target.value) || 100 }
                            }))}
                            sx={{ height: '80px' }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: '100%' }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Max Depth"
                            value={modelData.training_parameters.max_depth}
                            onChange={(e) => setModelData(prev => ({
                              ...prev,
                              training_parameters: { ...prev.training_parameters, max_depth: parseInt(e.target.value) || 10 }
                            }))}
                            sx={{ height: '80px' }}
                          />
                        </Box>
                      </Grid>
                    </>
                  )}

                  {modelData.training_parameters.algorithm === 'gradient_boosting' && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: '100%' }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Learning Rate"
                          value={modelData.training_parameters.learning_rate}
                          onChange={(e) => setModelData(prev => ({
                            ...prev,
                            training_parameters: { ...prev.training_parameters, learning_rate: parseFloat(e.target.value) || 0.1 }
                          }))}
                          inputProps={{ step: 0.01, min: 0.01, max: 1 }}
                          sx={{ height: '80px' }}
                        />
                      </Box>
                    </Grid>
                  )}

                  {(modelData.training_parameters.algorithm === 'logistic_regression' || 
                    modelData.training_parameters.algorithm === 'svm') && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: '100%' }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Regularization (C)"
                          value={modelData.training_parameters.C}
                          onChange={(e) => setModelData(prev => ({
                            ...prev,
                            training_parameters: { ...prev.training_parameters, C: parseFloat(e.target.value) || 1.0 }
                          }))}
                          inputProps={{ step: 0.1, min: 0.01 }}
                          sx={{ height: '80px' }}
                        />
                      </Box>
                    </Grid>
                  )}

                  {modelData.training_parameters.algorithm === 'svm' && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: '100%' }}>
                        <FormControl fullWidth sx={{ height: '80px' }}>
                          <InputLabel>Kernel</InputLabel>
                          <Select
                            value={modelData.training_parameters.kernel}
                            onChange={(e) => setModelData(prev => ({
                              ...prev,
                              training_parameters: { ...prev.training_parameters, kernel: e.target.value }
                            }))}
                            label="Kernel"
                          >
                            <MenuItem value="rbf">RBF</MenuItem>
                            <MenuItem value="linear">Linear</MenuItem>
                            <MenuItem value="poly">Polynomial</MenuItem>
                            <MenuItem value="sigmoid">Sigmoid</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(2)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Review & Create */}
            <Step>
              <StepLabel>Review & Create</StepLabel>
              <StepContent>

                <Typography variant="h6" gutterBottom>
                  Your AI Model Configuration Summary
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>📋 Basic Information</Typography>
                      <Typography variant="body2">• <strong>Name:</strong> {modelData.name}</Typography>
                      <Typography variant="body2">• <strong>Type:</strong> {modelData.model_type}</Typography>
                      <Typography variant="body2">• <strong>Target:</strong> {modelData.target_variable}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Description:</strong> {modelData.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>⚙️ Training Configuration</Typography>
                      <Typography variant="body2">• <strong>Algorithm:</strong> {modelData.training_parameters.algorithm}</Typography>
                      <Typography variant="body2">• <strong>Training Period:</strong> {modelData.training_period_days} days</Typography>
                      <Typography variant="body2">• <strong>Features:</strong> {modelData.features.length} selected</Typography>
                      <Typography variant="body2">• <strong>Validation:</strong> {(modelData.validation_split * 100).toFixed(0)}%</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Alert severity="success" sx={{ mb: 2 }}>
                  <strong>Ready to create your AI model!</strong> Your configuration looks good. After creation, you can start training immediately or modify settings later.
                </Alert>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={<AddIcon />}
                  >
                    {loading ? 'Creating...' : 'Create Model'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ModelStudio;
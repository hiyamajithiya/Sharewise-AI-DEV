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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ShowChart,
  Speed,
  Psychology,
  Settings,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  BarChart,
  Timeline,
  AccountBalance,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectTestingState } from '../store/slices/testingSlice';
import StatCard from '../components/common/StatCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Strategy {
  id: number;
  name: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  pnl: number;
  trades: number;
  winRate: number;
  capital?: number;
  timeframe?: string;
  instruments?: string;
  maxDrawdown?: number;
  dailyLossLimit?: number;
  positionSize?: number;
  enableStopLoss?: boolean;
  deployedAt?: string;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-trading-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedTrading: React.FC = () => {
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [tabValue, setTabValue] = useState(0);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [strategyConfig, setStrategyConfig] = useState({
    capital: '100000',
    timeframe: '1D',
    instruments: 'NIFTY50, BANKNIFTY',
    maxDrawdown: '15',
    dailyLossLimit: '50000',
    positionSize: '25',
    enableStopLoss: true,
  });
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [quickDeployConfig, setQuickDeployConfig] = useState({
    strategyTemplate: '',
    capital: '100000',
    enableRisk: true
  });
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([
    { id: 1, name: 'Momentum Breakout', status: 'RUNNING', pnl: 12450, trades: 24, winRate: 68.5 },
    { id: 2, name: 'Mean Reversion', status: 'PAUSED', pnl: -2340, trades: 15, winRate: 45.2 },
    { id: 3, name: 'Arbitrage Bot', status: 'STOPPED', pnl: 8760, trades: 89, winRate: 72.1 },
  ]);
  const [strategyIntervals, setStrategyIntervals] = useState<{[key: number]: NodeJS.Timeout}>({});

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeployStrategy = () => {
    setDeployDialogOpen(true);
    setActiveStep(0);
  };

  const handleCloseDialog = () => {
    setDeployDialogOpen(false);
    setActiveStep(0);
    setSelectedStrategy('');
    setStrategyConfig({
      capital: '100000',
      timeframe: '1D',
      instruments: 'NIFTY50, BANKNIFTY',
      maxDrawdown: '15',
      dailyLossLimit: '50000',
      positionSize: '25',
      enableStopLoss: true,
    });
  };

  const deploySteps = [
    'Select Strategy Type',
    'Configure Parameters', 
    'Set Risk Limits',
    'Review & Deploy'
  ];

  const strategyTypes = [
    { name: 'Momentum Breakout', description: 'Identifies strong price movements and trends', icon: '📈' },
    { name: 'Mean Reversion', description: 'Takes advantage of price corrections', icon: '🔄' },
    { name: 'Arbitrage', description: 'Exploits price differences across markets', icon: '⚖️' },
    { name: 'Custom Strategy', description: 'Create your own algorithmic strategy', icon: '🛠️' }
  ];

  const handleNextStep = () => {
    // Step 1: Validate configuration parameters
    if (activeStep === 1) {
      if (!strategyConfig.capital || parseInt(strategyConfig.capital) <= 0) {
        window.alert('Please enter a valid capital allocation amount');
        return;
      }
      if (!strategyConfig.instruments.trim()) {
        window.alert('Please specify the instruments to trade');
        return;
      }
    }
    
    // Step 2: Validate risk management parameters
    if (activeStep === 2) {
      if (!strategyConfig.maxDrawdown || parseFloat(strategyConfig.maxDrawdown) <= 0 || parseFloat(strategyConfig.maxDrawdown) > 100) {
        window.alert('Please enter a valid maximum drawdown percentage (1-100)');
        return;
      }
      if (!strategyConfig.dailyLossLimit || parseInt(strategyConfig.dailyLossLimit) <= 0) {
        window.alert('Please enter a valid daily loss limit');
        return;
      }
      if (!strategyConfig.positionSize || parseFloat(strategyConfig.positionSize) <= 0 || parseFloat(strategyConfig.positionSize) > 100) {
        window.alert('Please enter a valid position size percentage (1-100)');
        return;
      }
    }
    
    if (activeStep < deploySteps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleStrategySelect = (strategyName: string) => {
    setSelectedStrategy(strategyName);
    // Set default parameters based on selected strategy
    const strategyDefaults = getStrategyDefaults(strategyName);
    setStrategyConfig(strategyDefaults);
    // Automatically advance to next step
    setActiveStep(1);
  };

  const getStrategyDefaults = (strategyName: string) => {
    switch (strategyName) {
      case 'Momentum Breakout':
        return {
          capital: '200000',
          timeframe: '15M',
          instruments: 'NIFTY50, BANKNIFTY',
          maxDrawdown: '12',
          dailyLossLimit: '40000',
          positionSize: '30',
          enableStopLoss: true,
        };
      case 'Mean Reversion':
        return {
          capital: '150000',
          timeframe: '5M',
          instruments: 'RELIANCE, TCS, INFY',
          maxDrawdown: '8',
          dailyLossLimit: '25000',
          positionSize: '20',
          enableStopLoss: false,
        };
      case 'Arbitrage':
        return {
          capital: '500000',
          timeframe: '1M',
          instruments: 'NIFTY50 Futures, NIFTY50 Options',
          maxDrawdown: '5',
          dailyLossLimit: '15000',
          positionSize: '15',
          enableStopLoss: true,
        };
      case 'Custom Strategy':
        return {
          capital: '100000',
          timeframe: '1H',
          instruments: 'Custom Basket',
          maxDrawdown: '15',
          dailyLossLimit: '50000',
          positionSize: '25',
          enableStopLoss: true,
        };
      case 'Grid Trading':
        return {
          capital: '300000',
          timeframe: '5M',
          instruments: 'USDINR, EURINR, GBPINR',
          maxDrawdown: '10',
          dailyLossLimit: '30000',
          positionSize: '20',
          enableStopLoss: false,
        };
      default:
        return {
          capital: '100000',
          timeframe: '1D',
          instruments: 'NIFTY50, BANKNIFTY',
          maxDrawdown: '15',
          dailyLossLimit: '50000',
          positionSize: '25',
          enableStopLoss: true,
        };
    }
  };

  const getStrategyDescription = (strategyName: string) => {
    switch (strategyName) {
      case 'Momentum Breakout':
        return 'This strategy identifies strong price movements and enters positions when momentum indicators signal a breakout. Works best with high-volume stocks and indices.';
      case 'Mean Reversion':
        return 'Exploits temporary price deviations from the mean by taking contrarian positions. Suitable for range-bound markets and individual stocks.';
      case 'Arbitrage':
        return 'Captures price differences between related instruments like futures and options. Requires significant capital for profitable execution.';
      case 'Custom Strategy':
        return 'Build your own algorithmic strategy using custom indicators and rules. Full flexibility for advanced traders.';
      case 'Grid Trading':
        return 'Places multiple buy and sell orders at predefined price levels to profit from market volatility. Suitable for sideways markets.';
      default:
        return 'Configure the parameters for your selected trading strategy.';
    }
  };

  const getCapitalHelperText = (strategyName: string) => {
    switch (strategyName) {
      case 'Momentum Breakout':
        return 'Minimum ₹1.5L recommended for effective breakout trading';
      case 'Mean Reversion':
        return 'Minimum ₹1L sufficient for mean reversion strategies';
      case 'Arbitrage':
        return 'Minimum ₹3L required for profitable arbitrage opportunities';
      case 'Custom Strategy':
        return 'Amount varies based on your custom strategy requirements';
      case 'Grid Trading':
        return 'Minimum ₹2L recommended for effective grid spacing';
      default:
        return 'Amount to allocate to this strategy';
    }
  };

  const getTimeframeOptions = (strategyName: string) => {
    switch (strategyName) {
      case 'Momentum Breakout':
        return [
          { value: '5M', label: '5 Minutes' },
          { value: '15M', label: '15 Minutes' },
          { value: '1H', label: '1 Hour' }
        ];
      case 'Mean Reversion':
        return [
          { value: '1M', label: '1 Minute' },
          { value: '5M', label: '5 Minutes' },
          { value: '15M', label: '15 Minutes' }
        ];
      case 'Arbitrage':
        return [
          { value: '1M', label: '1 Minute' },
          { value: '3M', label: '3 Minutes' }
        ];
      case 'Custom Strategy':
        return [
          { value: '1M', label: '1 Minute' },
          { value: '5M', label: '5 Minutes' },
          { value: '15M', label: '15 Minutes' },
          { value: '1H', label: '1 Hour' },
          { value: '1D', label: '1 Day' }
        ];
      case 'Grid Trading':
        return [
          { value: '5M', label: '5 Minutes' },
          { value: '15M', label: '15 Minutes' },
          { value: '1H', label: '1 Hour' }
        ];
      default:
        return [
          { value: '5M', label: '5 Minutes' },
          { value: '15M', label: '15 Minutes' },
          { value: '1H', label: '1 Hour' },
          { value: '1D', label: '1 Day' }
        ];
    }
  };

  const getInstrumentsHelperText = (strategyName: string) => {
    switch (strategyName) {
      case 'Momentum Breakout':
        return 'High-volume indices and stocks (e.g., NIFTY50, BANKNIFTY, RELIANCE)';
      case 'Mean Reversion':
        return 'Individual stocks with clear support/resistance levels';
      case 'Arbitrage':
        return 'Related instruments like futures and options of same underlying';
      case 'Custom Strategy':
        return 'Define your custom basket of instruments';
      case 'Grid Trading':
        return 'Currency pairs or stable instruments (e.g., USDINR, EURINR)';
      default:
        return 'Comma-separated list of instruments to trade';
    }
  };

  const handleConfigChange = (field: string, value: string | boolean) => {
    setStrategyConfig(prev => ({ ...prev, [field]: value }));
  };

  // Real-time strategy simulation
  const startStrategySimulation = (strategyId: number) => {
    // Clear existing interval if any
    if (strategyIntervals[strategyId]) {
      clearInterval(strategyIntervals[strategyId]);
    }

    const interval = setInterval(() => {
      setActiveStrategies(prev => prev.map(strategy => {
        if (strategy.id === strategyId && strategy.status === 'RUNNING') {
          // Simulate trading activity
          const shouldTrade = Math.random() > 0.7; // 30% chance of trade per interval
          
          if (shouldTrade) {
            const isWin = Math.random() > 0.4; // 60% win rate
            const tradeAmount = Math.floor(Math.random() * 5000) + 500; // Random trade amount
            const pnlChange = isWin ? tradeAmount : -tradeAmount;
            
            const newTrades = strategy.trades + 1;
            const newPnl = strategy.pnl + pnlChange;
            const newWinRate = ((strategy.winRate * strategy.trades) + (isWin ? 100 : 0)) / newTrades;
            
            return {
              ...strategy,
              pnl: newPnl,
              trades: newTrades,
              winRate: Math.round(newWinRate * 10) / 10
            };
          }
        }
        return strategy;
      }));
    }, 3000); // Update every 3 seconds

    // Store interval ID for cleanup
    setStrategyIntervals(prev => ({ ...prev, [strategyId]: interval }));
    return interval;
  };

  // Strategy control functions
  const handleStrategyAction = (strategyId: number, action: 'play' | 'pause' | 'stop') => {
    const strategy = activeStrategies.find(s => s.id === strategyId);
    if (!strategy) return;

    if (action === 'play') {
      startStrategySimulation(strategyId);
      window.alert(`✅ ${strategy.name} strategy resumed! Trading will begin shortly.`);
    } else {
      // Clear interval for pause/stop
      if (strategyIntervals[strategyId]) {
        clearInterval(strategyIntervals[strategyId]);
        setStrategyIntervals(prev => {
          const newIntervals = { ...prev };
          delete newIntervals[strategyId];
          return newIntervals;
        });
      }
      
      if (action === 'pause') {
        window.alert(`⏸️ ${strategy.name} strategy paused. Trading stopped temporarily.`);
      } else if (action === 'stop') {
        window.alert(`🛑 ${strategy.name} strategy stopped completely. All positions will be closed.`);
      }
    }

    setActiveStrategies(prev => prev.map(s => {
      if (s.id === strategyId) {
        let newStatus: 'RUNNING' | 'PAUSED' | 'STOPPED';
        switch (action) {
          case 'play':
            newStatus = 'RUNNING';
            break;
          case 'pause':
            newStatus = 'PAUSED';
            break;
          case 'stop':
            newStatus = 'STOPPED';
            break;
        }
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  // Settings button handler
  const handleStrategySettings = (strategyId: number) => {
    const strategy = activeStrategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Create a detailed settings display
    const settingsInfo = `
🛠️ STRATEGY SETTINGS

Strategy: ${strategy.name}
Status: ${strategy.status}
Current P&L: ₹${strategy.pnl.toLocaleString()}
Total Trades: ${strategy.trades}
Win Rate: ${strategy.winRate}%

${strategy.capital ? `Capital Allocated: ₹${strategy.capital.toLocaleString()}` : ''}
${strategy.timeframe ? `Timeframe: ${strategy.timeframe}` : ''}
${strategy.instruments ? `Instruments: ${strategy.instruments}` : ''}
${strategy.maxDrawdown ? `Max Drawdown: ${strategy.maxDrawdown}%` : ''}
${strategy.dailyLossLimit ? `Daily Loss Limit: ₹${strategy.dailyLossLimit.toLocaleString()}` : ''}
${strategy.positionSize ? `Position Size: ${strategy.positionSize}%` : ''}
${strategy.enableStopLoss !== undefined ? `Stop Loss: ${strategy.enableStopLoss ? 'Enabled' : 'Disabled'}` : ''}
${strategy.deployedAt ? `Deployed: ${strategy.deployedAt}` : ''}

⚙️ Options:
- Click OK to modify settings
- Click Cancel to remove this strategy
`;

    const userWantsToModify = window.confirm(settingsInfo);
    
    if (userWantsToModify) {
      window.alert('🔧 Strategy settings modification will be available in the next update!');
    } else {
      const confirmDelete = window.confirm(`⚠️ Are you sure you want to remove the "${strategy.name}" strategy?\n\nThis will stop the strategy and remove it from your active strategies list.`);
      
      if (confirmDelete) {
        handleRemoveStrategy(strategyId);
      }
    }
  };

  // Remove strategy function
  const handleRemoveStrategy = (strategyId: number) => {
    const strategy = activeStrategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Clear any running intervals
    if (strategyIntervals[strategyId]) {
      clearInterval(strategyIntervals[strategyId]);
      setStrategyIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[strategyId];
        return newIntervals;
      });
    }

    // Remove from active strategies
    setActiveStrategies(prev => prev.filter(s => s.id !== strategyId));
    
    window.alert(`🗑️ Strategy "${strategy.name}" has been removed successfully.`);
  };

  const handleQuickConfigChange = (field: string, value: string | boolean) => {
    setQuickDeployConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickDeploy = async () => {
    if (!quickDeployConfig.strategyTemplate) {
      window.alert('Please select a strategy template');
      return;
    }
    if (!quickDeployConfig.capital || parseInt(quickDeployConfig.capital) <= 0) {
      window.alert('Please enter a valid capital amount');
      return;
    }

    // Map quick deploy template to strategy name
    const strategyMap: { [key: string]: string } = {
      momentum: 'Momentum Breakout',
      meanrev: 'Mean Reversion',
      arbitrage: 'Arbitrage',
      grid: 'Grid Trading'
    };

    const strategyName = strategyMap[quickDeployConfig.strategyTemplate];
    const defaults = getStrategyDefaults(strategyName);
    
    try {
      // Show loading state
      setDeploySuccess(true);
      
      // Create new strategy with quick deploy config
      const newStrategy: Strategy = {
        id: activeStrategies.length + 1,
        name: strategyName,
        status: 'RUNNING',
        pnl: 0,
        trades: 0,
        winRate: 0,
        capital: parseInt(quickDeployConfig.capital),
        timeframe: defaults.timeframe,
        instruments: defaults.instruments,
        deployedAt: new Date().toLocaleString()
      };

      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to active strategies list
      setActiveStrategies(prev => [...prev, newStrategy]);
      
      // Reset form
      setQuickDeployConfig({
        strategyTemplate: '',
        capital: '100000',
        enableRisk: true
      });
      
      setDeploySuccess(false);
      window.alert(`${strategyName} deployed successfully with ₹${parseInt(quickDeployConfig.capital).toLocaleString()} capital!`);
      
      // Start simulating trading activity for this strategy
      startStrategySimulation(newStrategy.id);
      
    } catch (error) {
      console.error('Quick deployment failed:', error);
      window.alert('Failed to deploy strategy. Please try again.');
      setDeploySuccess(false);
    }
  };

  const handleAdvancedSettings = () => {
    // Open the main deploy dialog for advanced configuration
    setDeployDialogOpen(true);
    setActiveStep(0);
  };

  const handleDeploy = async () => {
    try {
      // Show loading state
      setDeploySuccess(true);
      
      // Create new strategy with full configuration
      const newStrategy: Strategy = {
        id: activeStrategies.length + 1,
        name: selectedStrategy,
        status: 'RUNNING',
        pnl: 0,
        trades: 0,
        winRate: 0,
        capital: parseInt(strategyConfig.capital),
        timeframe: strategyConfig.timeframe,
        instruments: strategyConfig.instruments,
        maxDrawdown: parseFloat(strategyConfig.maxDrawdown),
        dailyLossLimit: parseInt(strategyConfig.dailyLossLimit),
        positionSize: parseFloat(strategyConfig.positionSize),
        enableStopLoss: strategyConfig.enableStopLoss,
        deployedAt: new Date().toLocaleString()
      };
      
      console.log('Deploying strategy with full config:', newStrategy);
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to active strategies list
      setActiveStrategies(prev => [...prev, newStrategy]);
      
      // Reset dialog and show success
      handleCloseDialog();
      setDeploySuccess(false);
      
      window.alert(`Strategy "${selectedStrategy}" deployed successfully with ₹${parseInt(strategyConfig.capital).toLocaleString()} capital!`);
      
      // Start simulating trading activity for this strategy
      startStrategySimulation(newStrategy.id);
      
    } catch (error) {
      console.error('Deployment failed:', error);
      window.alert('Failed to deploy strategy. Please try again.');
      setDeploySuccess(false);
    }
  };

  // Start simulation for running strategies on component mount
  React.useEffect(() => {
    const runningStrategies = activeStrategies.filter(strategy => strategy.status === 'RUNNING');
    runningStrategies.forEach(strategy => {
      startStrategySimulation(strategy.id);
    });

    // Cleanup on unmount
    return () => {
      Object.values(strategyIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);  // Run once on component mount

  const riskMetrics = [
    { title: 'Portfolio VaR', value: '₹45,230', subtitle: 'Daily 95% VaR', color: 'warning' as const },
    { title: 'Sharpe Ratio', value: '1.24', subtitle: 'Risk-adjusted returns', color: 'success' as const },
    { title: 'Max Drawdown', value: '8.5%', subtitle: 'Historical maximum', color: 'error' as const },
    { title: 'Beta', value: '0.87', subtitle: 'Market correlation', color: 'info' as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'PAUSED': return 'warning';
      case 'STOPPED': return 'error';
      default: return 'default';
    }
  };

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
        {/* Header with glassmorphism */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '16px',
          background: 'white',
          
          border: '1px solid #e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700, 
            mb: 1, 
            color: '#1F2937',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          }}>
            Advanced Trading
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280' }}>
            {isTestingMode && selectedUser
              ? `Testing advanced trading features for ${selectedUser.role} role`
              : 'Professional algorithmic trading, risk management, and portfolio optimization tools'
            }
          </Typography>
        </Box>

        {/* Elite Feature Notice */}
        <Box sx={{
          mb: 4,
          p: 2,
          borderRadius: '16px',
          background: 'white',
          
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <Typography variant="body2" sx={{ color: '#1F2937' }}>
            <strong>🌟 Elite Feature:</strong> These advanced trading tools are available exclusively to Elite subscribers. 
            Features include algorithmic trading, advanced risk management, custom indicators, and institutional-grade analytics.
          </Typography>
        </Box>

      {/* Risk Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {riskMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={metric.title}
              value={metric.value}
              icon={<BarChart />}
              color={metric.color}
              subtitle={metric.subtitle}
            />
          </Grid>
        ))}
      </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ 
          mb: 3,
          borderRadius: '16px',
          background: 'white',
          
          border: '1px solid #e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: '#e0e0e0',
            '& .MuiTab-root': {
              color: '#6B7280',
              '&.Mui-selected': {
                color: '#1F2937',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white',
            },
          }}
        >
          <Tab
            icon={<Psychology />}
            label="Algorithmic Trading"
            iconPosition="start"
          />
          <Tab
            icon={<Speed />}
            label="Risk Management"
            iconPosition="start"
          />
          <Tab
            icon={<ShowChart />}
            label="Advanced Charts"
            iconPosition="start"
          />
          <Tab
            icon={<Timeline />}
            label="Portfolio Optimizer"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Algorithmic Trading */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Active Trading Algorithms
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<PlayArrow />}
                    onClick={handleDeployStrategy}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                      },
                    }}
                  >
                    Deploy New Strategy
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#1F2937', fontWeight: 700 }}>Strategy Name</TableCell>
                        <TableCell sx={{ color: '#1F2937', fontWeight: 700 }}>Status</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>P&L (₹)</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>Trades</TableCell>
                        <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 700 }}>Win Rate</TableCell>
                        <TableCell align="center" sx={{ color: '#1F2937', fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeStrategies.map((strategy) => (
                        <TableRow key={strategy.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              {strategy.name}
                            </Typography>
                            {strategy.deployedAt && (
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                Deployed: {strategy.deployedAt}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={strategy.status}
                              color={getStatusColor(strategy.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={strategy.pnl >= 0 ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 600 }}
                            >
                              {strategy.pnl >= 0 ? '+' : ''}₹{strategy.pnl.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1F2937' }}>{strategy.trades}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={strategy.winRate >= 60 ? 'success.main' : 'text.primary'}
                            >
                              {strategy.winRate}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleStrategySettings(strategy.id)}
                                title="View/Edit Settings"
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Settings />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleStrategyAction(strategy.id, 'play')}
                                disabled={strategy.status === 'RUNNING'}
                                title={strategy.status === 'RUNNING' ? 'Already Running' : 'Start/Resume Strategy'}
                                sx={{
                                  '&:hover:not(:disabled)': {
                                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <PlayArrow />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => handleStrategyAction(strategy.id, 'pause')}
                                disabled={strategy.status !== 'RUNNING'}
                                title={strategy.status !== 'RUNNING' ? 'Strategy Not Running' : 'Pause Strategy'}
                                sx={{
                                  '&:hover:not(:disabled)': {
                                    backgroundColor: 'rgba(237, 108, 2, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Pause />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleStrategyAction(strategy.id, 'stop')}
                                disabled={strategy.status === 'STOPPED'}
                                title={strategy.status === 'STOPPED' ? 'Already Stopped' : 'Stop Strategy'}
                                sx={{
                                  '&:hover:not(:disabled)': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Stop />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Quick Deploy
                </Typography>

                <Box sx={{ space: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Strategy Template</InputLabel>
                    <Select 
                      label="Strategy Template" 
                      value={quickDeployConfig.strategyTemplate}
                      onChange={(e) => handleQuickConfigChange('strategyTemplate', e.target.value)}
                    >
                      <MenuItem value="momentum">Momentum Breakout</MenuItem>
                      <MenuItem value="meanrev">Mean Reversion</MenuItem>
                      <MenuItem value="arbitrage">Statistical Arbitrage</MenuItem>
                      <MenuItem value="grid">Grid Trading</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Capital Allocation"
                    type="number"
                    value={quickDeployConfig.capital}
                    onChange={(e) => handleQuickConfigChange('capital', e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: '₹',
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={quickDeployConfig.enableRisk}
                        onChange={(e) => handleQuickConfigChange('enableRisk', e.target.checked)}
                      />
                    }
                    label="Enable Risk Management"
                    sx={{ mb: 2, display: 'block' }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={handleQuickDeploy}
                    disabled={deploySuccess}
                    sx={{ 
                      mb: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
                      },
                      '&:disabled': {
                        background: '#9CA3AF'
                      }
                    }}
                  >
                    {deploySuccess ? 'Deploying...' : 'Deploy Strategy'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={handleAdvancedSettings}
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a67d8',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                  >
                    Advanced Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Risk Management */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Position Risk Monitor
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Risk Alert:</strong> Portfolio exposure exceeds 85% of allocated capital
                  </Typography>
                </Alert>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Portfolio Heat: 78%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={78} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Button variant="outlined" fullWidth startIcon={<Refresh />}>
                  Rebalance Portfolio
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Risk Limits
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Position Size
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      ₹2.5L
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Daily Loss Limit
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      ₹50K
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sector Concentration
                    </Typography>
                    <Typography variant="h6">
                      25%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Leverage Ratio
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      2.1x
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Advanced Charts */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Advanced Technical Analysis
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Professional charting with 100+ technical indicators, 
                custom drawing tools, multi-timeframe analysis, and advanced pattern recognition.
              </Typography>
            </Alert>

            <Box 
              sx={{ 
                height: 400, 
                backgroundColor: 'grey.100', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6" color="text.secondary">
                📊 Advanced Chart Placeholder
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Volume Profile
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Market Depth
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Heat Map
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth>
                  Scanner
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Portfolio Optimizer */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Portfolio Optimization Engine
                </Typography>
                
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Optimization Complete:</strong> Suggested rebalancing could improve 
                    risk-adjusted returns by 12.3% while reducing volatility by 8.1%.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current vs. Optimized Allocation
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Sharpe Ratio
                      </Typography>
                      <Typography variant="h6">1.24</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Optimized Sharpe Ratio
                      </Typography>
                      <Typography variant="h6" color="success.main">1.39</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Button variant="contained" color="primary" sx={{ mr: 2 }}>
                  Apply Optimization
                </Button>
                <Button variant="outlined">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: '16px',
              background: 'white',
              
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1F2937' }}>
                  Optimization Settings
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Optimization Goal</InputLabel>
                  <Select label="Optimization Goal" defaultValue="sharpe">
                    <MenuItem value="sharpe">Maximize Sharpe Ratio</MenuItem>
                    <MenuItem value="return">Maximize Returns</MenuItem>
                    <MenuItem value="risk">Minimize Risk</MenuItem>
                    <MenuItem value="diversify">Maximize Diversification</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Target Return (%)"
                  type="number"
                  defaultValue="15"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Max Risk (%)"
                  type="number"
                  defaultValue="20"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AccountBalance />}
                >
                  Run Optimization
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Deploy New Strategy Dialog */}
      <Dialog 
        open={deployDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'white',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          pb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Psychology sx={{ mr: 1 }} />
            Deploy New Trading Strategy
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {deploySteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1F2937' }}>
                Choose Your Strategy Type
              </Typography>
              <Grid container spacing={2}>
                {strategyTypes.map((strategy) => (
                  <Grid item xs={12} sm={6} key={strategy.name}>
                    <Card 
                      onClick={() => handleStrategySelect(strategy.name)}
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer', 
                        border: selectedStrategy === strategy.name ? '2px solid #667eea' : '2px solid transparent',
                        backgroundColor: selectedStrategy === strategy.name ? 'rgba(102, 126, 234, 0.1)' : 'white',
                        '&:hover': { 
                          borderColor: '#667eea',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)'
                        } 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '1.5rem', mr: 1 }}>{strategy.icon}</Typography>
                        <Typography variant="h6" sx={{ color: '#1F2937' }}>{strategy.name}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {strategy.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1, color: '#1F2937' }}>
                Configure {selectedStrategy} Parameters
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
                {getStrategyDescription(selectedStrategy)}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Capital Allocation (₹)"
                    type="number"
                    value={strategyConfig.capital}
                    onChange={(e) => handleConfigChange('capital', e.target.value)}
                    helperText={getCapitalHelperText(selectedStrategy)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Frame</InputLabel>
                    <Select 
                      value={strategyConfig.timeframe}
                      onChange={(e) => handleConfigChange('timeframe', e.target.value)}
                      label="Time Frame"
                    >
                      {getTimeframeOptions(selectedStrategy).map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instruments"
                    value={strategyConfig.instruments}
                    onChange={(e) => handleConfigChange('instruments', e.target.value)}
                    helperText={getInstrumentsHelperText(selectedStrategy)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1F2937' }}>
                Set Risk Management Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Drawdown (%)"
                    type="number"
                    value={strategyConfig.maxDrawdown}
                    onChange={(e) => handleConfigChange('maxDrawdown', e.target.value)}
                    helperText="Stop strategy if losses exceed this percentage"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Daily Loss Limit (₹)"
                    type="number"
                    value={strategyConfig.dailyLossLimit}
                    onChange={(e) => handleConfigChange('dailyLossLimit', e.target.value)}
                    helperText="Maximum daily loss allowed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position Size (%)"
                    type="number"
                    value={strategyConfig.positionSize}
                    onChange={(e) => handleConfigChange('positionSize', e.target.value)}
                    helperText="Percentage of capital per position"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={strategyConfig.enableStopLoss}
                        onChange={(e) => handleConfigChange('enableStopLoss', e.target.checked)}
                      />
                    }
                    label="Enable Stop Loss"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, color: '#1F2937' }}>
                Review & Deploy Strategy
              </Typography>
              <Paper sx={{ p: 3, backgroundColor: '#f8fafc' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Strategy Type:</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedStrategy}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Capital Allocation:</Typography>
                    <Typography variant="body1" fontWeight={600}>₹{parseInt(strategyConfig.capital).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Time Frame:</Typography>
                    <Typography variant="body1" fontWeight={600}>{strategyConfig.timeframe}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Max Drawdown:</Typography>
                    <Typography variant="body1" fontWeight={600}>{strategyConfig.maxDrawdown}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Daily Loss Limit:</Typography>
                    <Typography variant="body1" fontWeight={600}>₹{parseInt(strategyConfig.dailyLossLimit).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Position Size:</Typography>
                    <Typography variant="body1" fontWeight={600}>{strategyConfig.positionSize}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Instruments:</Typography>
                    <Typography variant="body1" fontWeight={600}>{strategyConfig.instruments}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Stop Loss:</Typography>
                    <Typography variant="body1" fontWeight={600}>{strategyConfig.enableStopLoss ? 'Enabled' : 'Disabled'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              <Alert severity="info" sx={{ mt: 2 }}>
                Once deployed, the strategy will start executing automatically. You can pause or stop it anytime from the Active Strategies table.
              </Alert>
              {deploySuccess && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress sx={{ borderRadius: 4 }} />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#6B7280' }}>
                    Deploying strategy...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(prev => prev - 1)} color="inherit">
              Back
            </Button>
          )}
          {activeStep < deploySteps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)' }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<PlayArrow />}
              onClick={handleDeploy}
              disabled={deploySuccess}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #0d9768 0%, #047857 100%)' },
                '&:disabled': { background: '#9CA3AF' }
              }}
            >
              {deploySuccess ? 'Deploying...' : 'Deploy Strategy'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      </Container>
    </Box>
  );
};

export default AdvancedTrading;
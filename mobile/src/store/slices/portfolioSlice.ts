import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { portfolioService } from '../../services/portfolioService';

interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  percentChange: number;
  allocation: number;
  lastUpdate: string;
}

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  availableCash: number;
  investedAmount: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dayChange: number;
  dayChangePercent: number;
}

interface Transaction {
  id: string;
  symbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fees: number;
  taxes: number;
  netAmount: number;
  timestamp: string;
  strategyName?: string;
}

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
}

interface SectorAllocation {
  sector: string;
  allocation: number;
  value: number;
  change: number;
}

interface PortfolioState {
  portfolio: Portfolio | null;
  holdings: Holding[];
  transactions: Transaction[];
  performance: PerformanceMetrics | null;
  sectorAllocations: SectorAllocation[];
  performanceChart: {
    labels: string[];
    data: number[];
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  holdings: [],
  transactions: [],
  performance: null,
  sectorAllocations: [],
  performanceChart: null,
  loading: false,
  error: null,
  lastUpdate: null,
};

// Async thunks
export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolio();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const fetchHoldings = createAsyncThunk(
  'portfolio/fetchHoldings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getHoldings();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holdings');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'portfolio/fetchTransactions',
  async (params?: {
    symbol?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getTransactions(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchPerformance = createAsyncThunk(
  'portfolio/fetchPerformance',
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPerformance(days);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance');
    }
  }
);

export const fetchSectorAllocation = createAsyncThunk(
  'portfolio/fetchSectorAllocation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getSectorAllocation();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sector allocation');
    }
  }
);

export const fetchPerformanceChart = createAsyncThunk(
  'portfolio/fetchPerformanceChart',
  async (params: {
    period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  }, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPerformanceChart(params.period);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance chart');
    }
  }
);

export const syncPortfolio = createAsyncThunk(
  'portfolio/syncPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.syncPortfolio();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync portfolio');
    }
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateHolding: (state, action: PayloadAction<{
      symbol: string;
      currentPrice: number;
      percentChange: number;
    }>) => {
      const holding = state.holdings.find(h => h.symbol === action.payload.symbol);
      if (holding) {
        holding.currentPrice = action.payload.currentPrice;
        holding.percentChange = action.payload.percentChange;
        holding.unrealizedPnl = (action.payload.currentPrice - holding.averagePrice) * holding.quantity;
        holding.lastUpdate = new Date().toISOString();
      }
    },
    updatePortfolioValue: (state, action: PayloadAction<{
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
    }>) => {
      if (state.portfolio) {
        state.portfolio.totalValue = action.payload.totalValue;
        state.portfolio.dayChange = action.payload.dayChange;
        state.portfolio.dayChangePercent = action.payload.dayChangePercent;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    setLastUpdate: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
    refreshPortfolio: (state) => {
      // This will trigger a refresh in the UI
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolio = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Holdings
      .addCase(fetchHoldings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.loading = false;
        state.holdings = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.results || action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Performance
      .addCase(fetchPerformance.fulfilled, (state, action) => {
        state.performance = action.payload.metrics;
      })
      .addCase(fetchPerformance.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Sector Allocation
      .addCase(fetchSectorAllocation.fulfilled, (state, action) => {
        state.sectorAllocations = action.payload;
      })
      .addCase(fetchSectorAllocation.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Performance Chart
      .addCase(fetchPerformanceChart.fulfilled, (state, action) => {
        state.performanceChart = action.payload;
      })
      .addCase(fetchPerformanceChart.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Sync Portfolio
      .addCase(syncPortfolio.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolio = action.payload.portfolio;
        state.holdings = action.payload.holdings;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(syncPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateHolding,
  updatePortfolioValue,
  addTransaction,
  setLastUpdate,
  refreshPortfolio,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
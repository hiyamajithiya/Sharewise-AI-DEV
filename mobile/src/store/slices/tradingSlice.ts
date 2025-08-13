import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tradingService } from '../../services/tradingService';

interface TradingSignal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
  strategyName: string;
  timestamp: string;
  executed: boolean;
  executedPrice?: number;
  isValid: boolean;
}

interface TradingOrder {
  id: string;
  symbol: string;
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL_M';
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  triggerPrice?: number;
  status: 'PENDING' | 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  averagePrice?: number;
  timestamp: string;
  fees: number;
  taxes: number;
}

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  percentChange: number;
}

interface TradingState {
  signals: TradingSignal[];
  orders: TradingOrder[];
  positions: Position[];
  dashboard: {
    totalSignals: number;
    executedSignals: number;
    executionRate: number;
    pendingOrders: number;
    todaySignals: number;
    todayExecuted: number;
  } | null;
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    totalFees: number;
    netPnl: number;
    sharpeRatio: number;
    maxDrawdown: number;
  } | null;
  loading: boolean;
  error: string | null;
  isMarketOpen: boolean;
  lastUpdate: string | null;
}

const initialState: TradingState = {
  signals: [],
  orders: [],
  positions: [],
  dashboard: null,
  performance: null,
  loading: false,
  error: null,
  isMarketOpen: false,
  lastUpdate: null,
};

// Async thunks
export const fetchSignals = createAsyncThunk(
  'trading/fetchSignals',
  async (params?: { 
    symbol?: string; 
    signalType?: string; 
    executed?: boolean;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await tradingService.getSignals(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch signals');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async (params?: {
    status?: string;
    symbol?: string;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await tradingService.getOrders(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchPositions = createAsyncThunk(
  'trading/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tradingService.getPositions();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'trading/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tradingService.getDashboard();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchPerformance = createAsyncThunk(
  'trading/fetchPerformance',
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const response = await tradingService.getPerformance(days);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance');
    }
  }
);

export const executeSignal = createAsyncThunk(
  'trading/executeSignal',
  async (signalId: string, { rejectWithValue }) => {
    try {
      const response = await tradingService.executeSignal(signalId);
      return { signalId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute signal');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trading/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await tradingService.cancelOrder(orderId);
      return { orderId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const checkMarketHours = createAsyncThunk(
  'trading/checkMarketHours',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tradingService.getMarketHours();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check market hours');
    }
  }
);

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateSignal: (state, action: PayloadAction<Partial<TradingSignal> & { id: string }>) => {
      const index = state.signals.findIndex(signal => signal.id === action.payload.id);
      if (index !== -1) {
        state.signals[index] = { ...state.signals[index], ...action.payload };
      }
    },
    updateOrder: (state, action: PayloadAction<Partial<TradingOrder> & { id: string }>) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...action.payload };
      }
    },
    addSignal: (state, action: PayloadAction<TradingSignal>) => {
      state.signals.unshift(action.payload);
    },
    addOrder: (state, action: PayloadAction<TradingOrder>) => {
      state.orders.unshift(action.payload);
    },
    setLastUpdate: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
    refreshData: (state) => {
      // This will trigger a refresh in the UI
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Signals
      .addCase(fetchSignals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSignals.fulfilled, (state, action) => {
        state.loading = false;
        state.signals = action.payload.results || action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchSignals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.results || action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Positions
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      // Fetch Dashboard
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload.statistics;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Performance
      .addCase(fetchPerformance.fulfilled, (state, action) => {
        state.performance = action.payload.metrics;
      })
      .addCase(fetchPerformance.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Execute Signal
      .addCase(executeSignal.pending, (state) => {
        state.loading = true;
      })
      .addCase(executeSignal.fulfilled, (state, action) => {
        state.loading = false;
        const signalIndex = state.signals.findIndex(s => s.id === action.payload.signalId);
        if (signalIndex !== -1) {
          state.signals[signalIndex].executed = true;
          if (action.payload.executed_price) {
            state.signals[signalIndex].executedPrice = action.payload.executed_price;
          }
        }
      })
      .addCase(executeSignal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderIndex = state.orders.findIndex(o => o.id === action.payload.orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'CANCELLED';
        }
      })
      // Market Hours
      .addCase(checkMarketHours.fulfilled, (state, action) => {
        state.isMarketOpen = action.payload.is_market_open;
      });
  },
});

export const {
  clearError,
  updateSignal,
  updateOrder,
  addSignal,
  addOrder,
  setLastUpdate,
  refreshData,
} = tradingSlice.actions;

export default tradingSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TradingState, TradingSignal, TradingOrder, OrderRequest } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: TradingState = {
  signals: [],
  orders: [],
  activeOrders: [],
  orderHistory: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchSignals = createAsyncThunk(
  'trading/fetchSignals',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getSignals(params);
      return response.results || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch signals');
    }
  }
);

export const executeSignal = createAsyncThunk(
  'trading/executeSignal',
  async (signalId: string, { rejectWithValue }) => {
    try {
      const result = await apiService.executeSignal(signalId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute signal');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getOrders(params);
      return response.results || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const placeOrder = createAsyncThunk(
  'trading/placeOrder',
  async (orderData: OrderRequest, { rejectWithValue }) => {
    try {
      const order = await apiService.placeOrder(orderData);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trading/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await apiService.cancelOrder(orderId);
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const modifyOrder = createAsyncThunk(
  'trading/modifyOrder',
  async ({ orderId, orderData }: { orderId: string; orderData: Partial<TradingOrder> }, { rejectWithValue }) => {
    try {
      const modifiedOrder = await apiService.modifyOrder(orderId, orderData);
      return modifiedOrder;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to modify order');
    }
  }
);

// Trading slice
const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addSignal: (state, action: PayloadAction<TradingSignal>) => {
      state.signals.unshift(action.payload);
    },
    updateSignal: (state, action: PayloadAction<TradingSignal>) => {
      const index = state.signals.findIndex(signal => signal.id === action.payload.id);
      if (index !== -1) {
        state.signals[index] = action.payload;
      }
    },
    removeSignal: (state, action: PayloadAction<string>) => {
      state.signals = state.signals.filter(signal => signal.id !== action.payload);
    },
    addOrder: (state, action: PayloadAction<TradingOrder>) => {
      state.orders.unshift(action.payload);
      if (['PENDING', 'OPEN'].includes(action.payload.status)) {
        state.activeOrders.unshift(action.payload);
      } else {
        state.orderHistory.unshift(action.payload);
      }
    },
    updateOrder: (state, action: PayloadAction<TradingOrder>) => {
      const order = action.payload;
      
      // Update in orders array
      const orderIndex = state.orders.findIndex(o => o.id === order.id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = order;
      }
      
      // Update in active orders
      const activeIndex = state.activeOrders.findIndex(o => o.id === order.id);
      if (activeIndex !== -1) {
        if (['PENDING', 'OPEN'].includes(order.status)) {
          state.activeOrders[activeIndex] = order;
        } else {
          // Move to history
          state.activeOrders.splice(activeIndex, 1);
          state.orderHistory.unshift(order);
        }
      } else if (['PENDING', 'OPEN'].includes(order.status)) {
        // Add to active orders if not already there
        state.activeOrders.unshift(order);
      }
      
      // Update in order history
      const historyIndex = state.orderHistory.findIndex(o => o.id === order.id);
      if (historyIndex !== -1) {
        state.orderHistory[historyIndex] = order;
      }
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      state.orders = state.orders.filter(order => order.id !== orderId);
      state.activeOrders = state.activeOrders.filter(order => order.id !== orderId);
      state.orderHistory = state.orderHistory.filter(order => order.id !== orderId);
    },
    setSignals: (state, action: PayloadAction<TradingSignal[]>) => {
      state.signals = action.payload;
    },
    setOrders: (state, action: PayloadAction<TradingOrder[]>) => {
      state.orders = action.payload;
      state.activeOrders = action.payload.filter(order => 
        ['PENDING', 'OPEN'].includes(order.status)
      );
      state.orderHistory = action.payload.filter(order => 
        !['PENDING', 'OPEN'].includes(order.status)
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch signals
    builder
      .addCase(fetchSignals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSignals.fulfilled, (state, action) => {
        state.loading = false;
        state.signals = action.payload;
      })
      .addCase(fetchSignals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Execute signal
    builder
      .addCase(executeSignal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(executeSignal.fulfilled, (state, action) => {
        state.loading = false;
        // Update signal as executed if result contains signal info
        if (action.payload.signal_id) {
          const signalIndex = state.signals.findIndex(s => s.id === action.payload.signal_id);
          if (signalIndex !== -1) {
            state.signals[signalIndex].executed = true;
            if (action.payload.executed_price) {
              state.signals[signalIndex].executed_price = action.payload.executed_price;
            }
          }
        }
        // Add order if returned
        if (action.payload.order) {
          state.orders.unshift(action.payload.order);
          state.activeOrders.unshift(action.payload.order);
        }
      })
      .addCase(executeSignal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.activeOrders = action.payload.filter((order: TradingOrder) => 
          ['PENDING', 'OPEN'].includes(order.status)
        );
        state.orderHistory = action.payload.filter((order: TradingOrder) => 
          !['PENDING', 'OPEN'].includes(order.status)
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Place order
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        const order = action.payload;
        state.orders.unshift(order);
        if (['PENDING', 'OPEN'].includes(order.status)) {
          state.activeOrders.unshift(order);
        } else {
          state.orderHistory.unshift(order);
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const orderId = action.payload;
        
        // Update order status to CANCELLED
        const orderIndex = state.orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'CANCELLED';
        }
        
        // Move from active to history
        const activeIndex = state.activeOrders.findIndex(o => o.id === orderId);
        if (activeIndex !== -1) {
          const cancelledOrder = { ...state.activeOrders[activeIndex], status: 'CANCELLED' as const };
          state.activeOrders.splice(activeIndex, 1);
          state.orderHistory.unshift(cancelledOrder);
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Modify order
    builder
      .addCase(modifyOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(modifyOrder.fulfilled, (state, action) => {
        state.loading = false;
        const modifiedOrder = action.payload;
        
        // Update in all arrays
        const orderIndex = state.orders.findIndex(o => o.id === modifiedOrder.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = modifiedOrder;
        }
        
        const activeIndex = state.activeOrders.findIndex(o => o.id === modifiedOrder.id);
        if (activeIndex !== -1) {
          state.activeOrders[activeIndex] = modifiedOrder;
        }
      })
      .addCase(modifyOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearError,
  addSignal,
  updateSignal,
  removeSignal,
  addOrder,
  updateOrder,
  removeOrder,
  setSignals,
  setOrders,
} = tradingSlice.actions;

// Selectors
export const selectTrading = (state: any) => state.trading;
export const selectSignals = (state: any) => state.trading.signals;
export const selectOrders = (state: any) => state.trading.orders;
export const selectActiveOrders = (state: any) => state.trading.activeOrders;
export const selectOrderHistory = (state: any) => state.trading.orderHistory;
export const selectTradingLoading = (state: any) => state.trading.loading;
export const selectTradingError = (state: any) => state.trading.error;

export default tradingSlice.reducer;
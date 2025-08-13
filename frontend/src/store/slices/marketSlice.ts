import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MarketState, MarketData } from '../../types';
import apiService from '../../services/api';

const initialState: MarketState = {
  watchlist: [],
  prices: {},
  loading: false,
  error: null,
};

export const fetchWatchlist = createAsyncThunk(
  'market/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const watchlist = await apiService.getWatchlist();
      return watchlist;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'market/addToWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      await apiService.addToWatchlist(symbol);
      return symbol;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'market/removeFromWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      await apiService.removeFromWatchlist(symbol);
      return symbol;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePrice: (state, action: PayloadAction<{ symbol: string; data: MarketData }>) => {
      state.prices[action.payload.symbol] = action.payload.data;
    },
    updatePrices: (state, action: PayloadAction<Record<string, MarketData>>) => {
      state.prices = { ...state.prices, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.watchlist = action.payload;
      })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        if (!state.watchlist.includes(action.payload)) {
          state.watchlist.push(action.payload);
        }
      })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.watchlist = state.watchlist.filter(symbol => symbol !== action.payload);
      });
  },
});

export const { clearError, updatePrice, updatePrices } = marketSlice.actions;
export default marketSlice.reducer;
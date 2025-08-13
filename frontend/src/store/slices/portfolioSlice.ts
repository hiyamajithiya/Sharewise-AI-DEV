import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PortfolioState, Portfolio, Holding } from '../../types';
import apiService from '../../services/api';

const initialState: PortfolioState = {
  portfolio: null,
  holdings: [],
  totalValue: 0,
  todayPnl: 0,
  loading: false,
  error: null,
};

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const portfolio = await apiService.getPortfolio();
      return portfolio;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const fetchHoldings = createAsyncThunk(
  'portfolio/fetchHoldings',
  async (_, { rejectWithValue }) => {
    try {
      const holdings = await apiService.getHoldings();
      return holdings;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holdings');
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
    updateHoldingPrice: (state, action: PayloadAction<{ symbol: string; price: number }>) => {
      const holding = state.holdings.find(h => h.symbol === action.payload.symbol);
      if (holding) {
        holding.current_price = action.payload.price;
        holding.unrealized_pnl = (action.payload.price - holding.average_price) * holding.quantity;
      }
    },
    setTotalValue: (state, action: PayloadAction<number>) => {
      state.totalValue = action.payload;
    },
    setTodayPnl: (state, action: PayloadAction<number>) => {
      state.todayPnl = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolio = action.payload;
        state.totalValue = action.payload.total_value;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.holdings = action.payload;
      });
  },
});

export const { clearError, updateHoldingPrice, setTotalValue, setTodayPnl } = portfolioSlice.actions;
export default portfolioSlice.reducer;
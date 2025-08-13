import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { marketService } from '../../services/marketService';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastUpdate: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: string;
}

interface Index {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relevantSymbols: string[];
}

interface MarketState {
  watchlist: WatchlistItem[];
  indices: Index[];
  topGainers: MarketData[];
  topLosers: MarketData[];
  mostActive: MarketData[];
  news: NewsItem[];
  selectedSymbol: string | null;
  selectedSymbolData: MarketData | null;
  chartData: {
    symbol: string;
    timeframe: string;
    data: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  } | null;
  loading: boolean;
  error: string | null;
  isMarketOpen: boolean;
  marketHours: {
    open: string;
    close: string;
    timezone: string;
  } | null;
  lastUpdate: string | null;
}

const initialState: MarketState = {
  watchlist: [],
  indices: [],
  topGainers: [],
  topLosers: [],
  mostActive: [],
  news: [],
  selectedSymbol: null,
  selectedSymbolData: null,
  chartData: null,
  loading: false,
  error: null,
  isMarketOpen: false,
  marketHours: null,
  lastUpdate: null,
};

// Async thunks
export const fetchWatchlist = createAsyncThunk(
  'market/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getWatchlist();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const fetchIndices = createAsyncThunk(
  'market/fetchIndices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getIndices();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch indices');
    }
  }
);

export const fetchMarketMovers = createAsyncThunk(
  'market/fetchMarketMovers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getMarketMovers();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch market movers');
    }
  }
);

export const fetchNews = createAsyncThunk(
  'market/fetchNews',
  async (params?: { category?: string; symbols?: string[] }, { rejectWithValue }) => {
    try {
      const response = await marketService.getNews(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch news');
    }
  }
);

export const fetchSymbolData = createAsyncThunk(
  'market/fetchSymbolData',
  async (symbol: string, { rejectWithValue }) => {
    try {
      const response = await marketService.getSymbolData(symbol);
      return { symbol, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch symbol data');
    }
  }
);

export const fetchChartData = createAsyncThunk(
  'market/fetchChartData',
  async (params: {
    symbol: string;
    timeframe: '1m' | '5m' | '15m' | '1h' | '1d';
    period?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await marketService.getChartData(params);
      return { symbol: params.symbol, timeframe: params.timeframe, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chart data');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'market/addToWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      const response = await marketService.addToWatchlist(symbol);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'market/removeFromWatchlist',
  async (symbol: string, { rejectWithValue }) => {
    try {
      const response = await marketService.removeFromWatchlist(symbol);
      return { symbol, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  }
);

export const checkMarketStatus = createAsyncThunk(
  'market/checkMarketStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getMarketStatus();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check market status');
    }
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setSelectedSymbol: (state, action: PayloadAction<string>) => {
      state.selectedSymbol = action.payload;
    },
    clearSelectedSymbol: (state) => {
      state.selectedSymbol = null;
      state.selectedSymbolData = null;
      state.chartData = null;
    },
    updateMarketData: (state, action: PayloadAction<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      volume?: number;
    }>) => {
      const { symbol, price, change, changePercent, volume } = action.payload;
      
      // Update watchlist
      const watchlistItem = state.watchlist.find(item => item.symbol === symbol);
      if (watchlistItem) {
        watchlistItem.price = price;
        watchlistItem.change = change;
        watchlistItem.changePercent = changePercent;
        if (volume !== undefined) watchlistItem.volume = volume;
        watchlistItem.lastUpdate = new Date().toISOString();
      }
      
      // Update selected symbol data
      if (state.selectedSymbolData && state.selectedSymbolData.symbol === symbol) {
        state.selectedSymbolData.price = price;
        state.selectedSymbolData.change = change;
        state.selectedSymbolData.changePercent = changePercent;
        if (volume !== undefined) state.selectedSymbolData.volume = volume;
        state.selectedSymbolData.lastUpdate = new Date().toISOString();
      }
    },
    updateIndices: (state, action: PayloadAction<Index[]>) => {
      state.indices = action.payload;
      state.lastUpdate = new Date().toISOString();
    },
    setMarketStatus: (state, action: PayloadAction<boolean>) => {
      state.isMarketOpen = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    refreshMarketData: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.watchlist = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Indices
      .addCase(fetchIndices.fulfilled, (state, action) => {
        state.indices = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      // Fetch Market Movers
      .addCase(fetchMarketMovers.fulfilled, (state, action) => {
        state.topGainers = action.payload.top_gainers || [];
        state.topLosers = action.payload.top_losers || [];
        state.mostActive = action.payload.most_active || [];
      })
      // Fetch News
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.news = action.payload.results || action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Symbol Data
      .addCase(fetchSymbolData.fulfilled, (state, action) => {
        state.selectedSymbolData = action.payload;
      })
      .addCase(fetchSymbolData.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Chart Data
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.chartData = action.payload;
      })
      .addCase(fetchChartData.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Add to Watchlist
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        if (!state.watchlist.find(item => item.symbol === action.payload.symbol)) {
          state.watchlist.push(action.payload);
        }
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove from Watchlist
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.watchlist = state.watchlist.filter(item => item.symbol !== action.payload.symbol);
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Market Status
      .addCase(checkMarketStatus.fulfilled, (state, action) => {
        state.isMarketOpen = action.payload.is_market_open;
        state.marketHours = action.payload.market_hours;
      });
  },
});

export const {
  setSelectedSymbol,
  clearSelectedSymbol,
  updateMarketData,
  updateIndices,
  setMarketStatus,
  clearError,
  refreshMarketData,
} = marketSlice.actions;

export default marketSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { aiStudioService } from '../../services/aiStudioService';

interface MLModel {
  id: string;
  name: string;
  description: string;
  modelType: 'CLASSIFICATION' | 'REGRESSION' | 'TIME_SERIES';
  algorithm: string;
  status: 'DRAFT' | 'TRAINING' | 'COMPLETED' | 'FAILED' | 'PUBLISHED' | 'ARCHIVED';
  isPublished: boolean;
  performanceMetrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    totalReturn?: number;
  };
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

interface TrainingJob {
  id: string;
  modelId: string;
  jobName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  computeHours: number;
  errorMessage?: string;
  trainingMetrics?: {
    accuracy?: number;
    loss?: number;
    epochs?: number;
  };
}

interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  seller: {
    id: string;
    username: string;
    rating: number;
    totalModels: number;
  };
  monthlyPrice: number;
  performanceMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    winRate: number;
  };
  totalSubscribers: number;
  averageRating: number;
  isFeatured: boolean;
}

interface AIStudioDashboard {
  totalModels: number;
  activeModels: number;
  publishedModels: number;
  trainingJobsThisMonth: number;
  totalEarnings: number;
  computeHoursUsed: number;
  computeHoursRemaining: number;
}

interface AIStudioState {
  models: MLModel[];
  trainingJobs: TrainingJob[];
  marketplaceListings: MarketplaceListing[];
  mySubscriptions: MarketplaceListing[];
  dashboard: AIStudioDashboard | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  
  // Filters and pagination
  modelFilter: {
    status?: string;
    modelType?: string;
  };
  marketplaceFilter: {
    category?: string;
    minSharpeRatio?: number;
    maxPrice?: number;
    search?: string;
  };
}

const initialState: AIStudioState = {
  models: [],
  trainingJobs: [],
  marketplaceListings: [],
  mySubscriptions: [],
  dashboard: null,
  loading: false,
  error: null,
  lastUpdate: null,
  modelFilter: {},
  marketplaceFilter: {},
};

// Async thunks
export const fetchModels = createAsyncThunk(
  'aiStudio/fetchModels',
  async (params?: {
    status?: string;
    modelType?: string;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.getModels(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch models');
    }
  }
);

export const fetchTrainingJobs = createAsyncThunk(
  'aiStudio/fetchTrainingJobs',
  async (params?: {
    status?: string;
    modelId?: string;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.getTrainingJobs(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch training jobs');
    }
  }
);

export const fetchMarketplace = createAsyncThunk(
  'aiStudio/fetchMarketplace',
  async (params?: {
    category?: string;
    minSharpeRatio?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.getMarketplace(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch marketplace');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'aiStudio/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.getDashboard();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const createModel = createAsyncThunk(
  'aiStudio/createModel',
  async (modelData: {
    name: string;
    description: string;
    modelType: string;
    algorithm: string;
    features: string[];
    hyperparameters: Record<string, any>;
    trainingConfig: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.createModel(modelData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create model');
    }
  }
);

export const startTraining = createAsyncThunk(
  'aiStudio/startTraining',
  async (params: {
    modelId: string;
    jobName: string;
    priority?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.startTraining(params.modelId, {
        jobName: params.jobName,
        priority: params.priority,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start training');
    }
  }
);

export const cancelTraining = createAsyncThunk(
  'aiStudio/cancelTraining',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.cancelTraining(jobId);
      return { jobId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel training');
    }
  }
);

export const publishModel = createAsyncThunk(
  'aiStudio/publishModel',
  async (params: {
    modelId: string;
    listingData: {
      title: string;
      description: string;
      category: string;
      monthlyPrice: number;
      sampleSignals: any[];
    };
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.publishModel(params.modelId, params.listingData);
      return { modelId: params.modelId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish model');
    }
  }
);

export const subscribeToModel = createAsyncThunk(
  'aiStudio/subscribeToModel',
  async (params: {
    listingId: string;
    subscriptionType: string;
    autoRenew: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await aiStudioService.subscribeToModel(params.listingId, {
        subscriptionType: params.subscriptionType,
        autoRenew: params.autoRenew,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to subscribe to model');
    }
  }
);

const aiStudioSlice = createSlice({
  name: 'aiStudio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateModel: (state, action: PayloadAction<Partial<MLModel> & { id: string }>) => {
      const index = state.models.findIndex(model => model.id === action.payload.id);
      if (index !== -1) {
        state.models[index] = { ...state.models[index], ...action.payload };
      }
    },
    updateTrainingJob: (state, action: PayloadAction<Partial<TrainingJob> & { id: string }>) => {
      const index = state.trainingJobs.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.trainingJobs[index] = { ...state.trainingJobs[index], ...action.payload };
      }
    },
    addModel: (state, action: PayloadAction<MLModel>) => {
      state.models.unshift(action.payload);
    },
    addTrainingJob: (state, action: PayloadAction<TrainingJob>) => {
      state.trainingJobs.unshift(action.payload);
    },
    setModelFilter: (state, action: PayloadAction<Partial<typeof initialState.modelFilter>>) => {
      state.modelFilter = { ...state.modelFilter, ...action.payload };
    },
    setMarketplaceFilter: (state, action: PayloadAction<Partial<typeof initialState.marketplaceFilter>>) => {
      state.marketplaceFilter = { ...state.marketplaceFilter, ...action.payload };
    },
    clearModelFilter: (state) => {
      state.modelFilter = {};
    },
    clearMarketplaceFilter: (state) => {
      state.marketplaceFilter = {};
    },
    setLastUpdate: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Models
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload.results || action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Training Jobs
      .addCase(fetchTrainingJobs.fulfilled, (state, action) => {
        state.trainingJobs = action.payload.results || action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchTrainingJobs.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Marketplace
      .addCase(fetchMarketplace.fulfilled, (state, action) => {
        state.marketplaceListings = action.payload.results || action.payload;
      })
      .addCase(fetchMarketplace.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Dashboard
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload.summary || action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Create Model
      .addCase(createModel.pending, (state) => {
        state.loading = true;
      })
      .addCase(createModel.fulfilled, (state, action) => {
        state.loading = false;
        // The created model will be fetched in the next models refresh
      })
      .addCase(createModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Start Training
      .addCase(startTraining.pending, (state) => {
        state.loading = true;
      })
      .addCase(startTraining.fulfilled, (state, action) => {
        state.loading = false;
        // Update model status and add training job
        const modelIndex = state.models.findIndex(m => m.id === action.payload.model_id);
        if (modelIndex !== -1) {
          state.models[modelIndex].status = 'TRAINING';
        }
      })
      .addCase(startTraining.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel Training
      .addCase(cancelTraining.fulfilled, (state, action) => {
        const jobIndex = state.trainingJobs.findIndex(j => j.id === action.payload.jobId);
        if (jobIndex !== -1) {
          state.trainingJobs[jobIndex].status = 'CANCELLED';
        }
      })
      // Publish Model
      .addCase(publishModel.fulfilled, (state, action) => {
        const modelIndex = state.models.findIndex(m => m.id === action.payload.modelId);
        if (modelIndex !== -1) {
          state.models[modelIndex].isPublished = true;
          state.models[modelIndex].status = 'PUBLISHED';
        }
      })
      .addCase(publishModel.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Subscribe to Model
      .addCase(subscribeToModel.fulfilled, (state, action) => {
        // Update subscription status or refresh subscriptions
      })
      .addCase(subscribeToModel.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateModel,
  updateTrainingJob,
  addModel,
  addTrainingJob,
  setModelFilter,
  setMarketplaceFilter,
  clearModelFilter,
  clearMarketplaceFilter,
  setLastUpdate,
} = aiStudioSlice.actions;

export default aiStudioSlice.reducer;
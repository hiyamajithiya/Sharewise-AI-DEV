import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AIStudioState, MLModel, TrainingJob, StudioDashboard, MarketplaceModel, ModelLeasing, Feature } from '../../types';
import { apiService } from '../../services/api';

const initialState: AIStudioState = {
  dashboard: null,
  models: [],
  trainingJobs: [],
  marketplace: [],
  myLeases: [],
  availableFeatures: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchStudioDashboard = createAsyncThunk(
  'aiStudio/fetchStudioDashboard',
  async () => {
    const response = await apiService.getStudioDashboard();
    return response;
  }
);

export const fetchMLModels = createAsyncThunk(
  'aiStudio/fetchMLModels',
  async (params?: any) => {
    const response = await apiService.getMLModels(params);
    return response.results || response;
  }
);

export const createMLModel = createAsyncThunk(
  'aiStudio/createMLModel',
  async (modelData: any) => {
    const response = await apiService.createMLModel(modelData);
    return response;
  }
);

export const updateMLModel = createAsyncThunk(
  'aiStudio/updateMLModel',
  async ({ modelId, modelData }: { modelId: string; modelData: any }) => {
    const response = await apiService.updateMLModel(modelId, modelData);
    return response;
  }
);

export const deleteMLModel = createAsyncThunk(
  'aiStudio/deleteMLModel',
  async (modelId: string) => {
    await apiService.deleteMLModel(modelId);
    return modelId;
  }
);

export const trainModel = createAsyncThunk(
  'aiStudio/trainModel',
  async (modelId: string) => {
    const response = await apiService.trainModel(modelId);
    return response;
  }
);

export const publishModel = createAsyncThunk(
  'aiStudio/publishModel',
  async ({ modelId, publishData }: { modelId: string; publishData: any }) => {
    const response = await apiService.publishModel(modelId, publishData);
    return { modelId, ...response };
  }
);

export const unpublishModel = createAsyncThunk(
  'aiStudio/unpublishModel',
  async (modelId: string) => {
    const response = await apiService.unpublishModel(modelId);
    return { modelId, ...response };
  }
);

export const fetchTrainingJobs = createAsyncThunk(
  'aiStudio/fetchTrainingJobs',
  async () => {
    const response = await apiService.getTrainingJobs();
    return response.results || response;
  }
);

export const fetchAvailableFeatures = createAsyncThunk(
  'aiStudio/fetchAvailableFeatures',
  async () => {
    const response = await apiService.getAvailableFeatures();
    return response;
  }
);

export const fetchMarketplace = createAsyncThunk(
  'aiStudio/fetchMarketplace',
  async (params?: any) => {
    const response = await apiService.getMarketplace(params);
    return response.results || response;
  }
);

export const leaseModel = createAsyncThunk(
  'aiStudio/leaseModel',
  async (modelId: string) => {
    const response = await apiService.leaseModel(modelId);
    return response;
  }
);

export const fetchMyLeases = createAsyncThunk(
  'aiStudio/fetchMyLeases',
  async () => {
    const response = await apiService.getMyLeases();
    return response.results || response;
  }
);

const aiStudioSlice = createSlice({
  name: 'aiStudio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateTrainingJobProgress: (state, action: PayloadAction<{ jobId: string; progress: number; step: string }>) => {
      const job = state.trainingJobs.find(job => job.id === action.payload.jobId);
      if (job) {
        job.progress_percentage = action.payload.progress;
        job.current_step = action.payload.step;
      }
    },
    updateModelStatus: (state, action: PayloadAction<{ modelId: string; status: string }>) => {
      const model = state.models.find(model => model.id === action.payload.modelId);
      if (model) {
        model.status = action.payload.status as any;
      }
    },
  },
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(fetchStudioDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudioDashboard.fulfilled, (state, action: PayloadAction<StudioDashboard>) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchStudioDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard data';
      });

    // ML Models
    builder
      .addCase(fetchMLModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMLModels.fulfilled, (state, action: PayloadAction<MLModel[]>) => {
        state.loading = false;
        state.models = action.payload;
      })
      .addCase(fetchMLModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch models';
      });

    // Create Model
    builder
      .addCase(createMLModel.fulfilled, (state, action: PayloadAction<MLModel>) => {
        state.models.unshift(action.payload);
      })
      .addCase(createMLModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create model';
      });

    // Update Model
    builder
      .addCase(updateMLModel.fulfilled, (state, action: PayloadAction<MLModel>) => {
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = action.payload;
        }
      })
      .addCase(updateMLModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update model';
      });

    // Delete Model
    builder
      .addCase(deleteMLModel.fulfilled, (state, action: PayloadAction<string>) => {
        state.models = state.models.filter(model => model.id !== action.payload);
      })
      .addCase(deleteMLModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete model';
      });

    // Train Model
    builder
      .addCase(trainModel.fulfilled, (state, action) => {
        // Training started, update model status
        const model = state.models.find(m => m.id === action.meta.arg);
        if (model) {
          model.status = 'TRAINING';
        }
      })
      .addCase(trainModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to start training';
      });

    // Publish Model
    builder
      .addCase(publishModel.fulfilled, (state, action) => {
        const model = state.models.find(m => m.id === action.payload.modelId);
        if (model) {
          model.is_published = true;
          model.status = 'PUBLISHED';
        }
      })
      .addCase(publishModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to publish model';
      });

    // Unpublish Model
    builder
      .addCase(unpublishModel.fulfilled, (state, action) => {
        const model = state.models.find(m => m.id === action.payload.modelId);
        if (model) {
          model.is_published = false;
          model.status = 'COMPLETED';
        }
      })
      .addCase(unpublishModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to unpublish model';
      });

    // Training Jobs
    builder
      .addCase(fetchTrainingJobs.fulfilled, (state, action: PayloadAction<TrainingJob[]>) => {
        state.trainingJobs = action.payload;
      })
      .addCase(fetchTrainingJobs.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch training jobs';
      });

    // Available Features
    builder
      .addCase(fetchAvailableFeatures.fulfilled, (state, action: PayloadAction<{ features: Feature[] }>) => {
        state.availableFeatures = action.payload.features;
      })
      .addCase(fetchAvailableFeatures.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch available features';
      });

    // Marketplace
    builder
      .addCase(fetchMarketplace.fulfilled, (state, action: PayloadAction<MarketplaceModel[]>) => {
        state.marketplace = action.payload;
      })
      .addCase(fetchMarketplace.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch marketplace';
      });

    // Lease Model
    builder
      .addCase(leaseModel.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to lease model';
      });

    // My Leases
    builder
      .addCase(fetchMyLeases.fulfilled, (state, action: PayloadAction<ModelLeasing[]>) => {
        state.myLeases = action.payload;
      })
      .addCase(fetchMyLeases.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch leases';
      });
  },
});

export const { clearError, setLoading, updateTrainingJobProgress, updateModelStatus } = aiStudioSlice.actions;
export default aiStudioSlice.reducer;
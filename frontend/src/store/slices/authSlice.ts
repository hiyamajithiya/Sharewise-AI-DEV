import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, UserProfile, AuthTokens } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: AuthState = {
  user: null,
  profile: null,
  tokens: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ usernameOrEmail, password }: { usernameOrEmail: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.login(usernameOrEmail, password);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      return rejectWithValue({
        message: errorMessage,
        requiresVerification: error.response?.data?.requires_verification || false,
        email: error.response?.data?.email,
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    username: string;
    password: string;
    confirm_password: string;
    first_name: string;
    last_name: string;
  }, { rejectWithValue }) => {
    try {
      const result = await apiService.register(userData);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ userId, otpCode }: { userId: string; otpCode: string }, { rejectWithValue }) => {
    try {
      const result = await apiService.verifyEmail(userId, otpCode);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Verification failed');
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      const result = await apiService.resendVerification(email);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to resend verification');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await apiService.refreshToken();
      return tokens;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiService.getCurrentUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const updatedProfile = await apiService.updateUserProfile(profileData);
      return updatedProfile;
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          JSON.stringify(error.response?.data) || 
                          error.message || 
                          'Failed to update profile';
      return rejectWithValue(errorMessage);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.profile = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.access) {
          state.tokens = { access: action.payload.access, refresh: action.payload.refresh };
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as any;
        state.error = error?.message || action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.profile = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null;
        state.profile = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Update both profile and user data
        if (action.payload.user) {
          state.user = action.payload.user;
        } else {
          // If backend returns just the user object directly
          state.user = { ...state.user, ...action.payload };
        }
        state.profile = action.payload.profile || action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Email verification
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.access) {
          state.tokens = { access: action.payload.access, refresh: action.payload.refresh };
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Resend verification
    builder
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearError, clearAuth, setTokens, setUser, setProfile } = authSlice.actions;

// Selectors
export const selectAuth = (state: any) => state.auth;
export const selectUser = (state: any) => state.auth.user;
export const selectProfile = (state: any) => state.auth.profile;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: any) => state.auth.loading;
export const selectAuthError = (state: any) => state.auth.error;

export default authSlice.reducer;
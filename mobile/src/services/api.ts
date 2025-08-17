import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { clearAuth, setToken } from '../store/slices/authSlice';

const BASE_URL = 'https://api.sharewise.ai'; // Change to your actual API URL

interface ApiConfig {
  timeout: number;
  baseURL: string;
  headers: {
    'Content-Type': string;
    'Accept': string;
  };
}

const config: ApiConfig = {
  timeout: 30000, // 30 seconds
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create(config);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh, rate limiting, and security violations
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle rate limiting (429 status)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const rateLimitData = error.response.data;
          
          console.warn('Rate limit exceeded:', rateLimitData);
          
          // Create user-friendly error message
          const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment';
          const rateLimitError = new Error(
            rateLimitData.message || 
            `Too many requests. Please wait ${waitTime} before trying again.`
          );
          
          // Add rate limit context to error
          (rateLimitError as any).isRateLimit = true;
          (rateLimitError as any).retryAfter = retryAfter;
          (rateLimitError as any).rateLimitData = rateLimitData;
          
          // For mobile, we'll be more conservative with auto-retry to preserve battery/data
          if (retryAfter && parseInt(retryAfter) <= 5 && !originalRequest._retryAfterRateLimit) {
            originalRequest._retryAfterRateLimit = true;
            console.log(`Auto-retrying mobile request after ${retryAfter} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
            return this.api(originalRequest);
          }
          
          return Promise.reject(rateLimitError);
        }

        // Handle security violations (400 with security context)
        if (error.response?.status === 400 && error.response.data?.error === 'Security violation detected') {
          const securityData = error.response.data;
          
          console.warn('Security violation detected:', securityData);
          
          const securityError = new Error(
            securityData.message || 
            'Your request contains potentially harmful content and has been blocked.'
          );
          
          // Add security context to error
          (securityError as any).isSecurityViolation = true;
          (securityError as any).violationType = securityData.violation_type;
          (securityError as any).securityData = securityData;
          
          return Promise.reject(securityError);
        }

        // Handle blocked IP (403 from IP blocking middleware)
        if (error.response?.status === 403 && 
            (error.response.data?.error === 'Access denied' || 
             error.response.data?.message?.includes('IP address has been blocked'))) {
          const blockedError = new Error(
            'Access temporarily restricted due to suspicious activity. Please try again later.'
          );
          
          (blockedError as any).isIPBlocked = true;
          (blockedError as any).blockedData = error.response.data;
          
          return Promise.reject(blockedError);
        }

        // Handle token refresh (401 status)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        // Handle server errors with user-friendly messages
        if (error.response?.status >= 500) {
          const serverError = new Error(
            'Server is temporarily unavailable. Please try again in a few moments.'
          );
          (serverError as any).isServerError = true;
          (serverError as any).originalError = error;
          
          return Promise.reject(serverError);
        }

        // Handle network errors (no response)
        if (!error.response) {
          const networkError = new Error(
            'Network connection failed. Please check your internet connection and try again.'
          );
          (networkError as any).isNetworkError = true;
          (networkError as any).originalError = error;
          
          return Promise.reject(networkError);
        }

        return Promise.reject(error);
      }
    );
  }

  private async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshTokenPromise;
      return newToken;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${BASE_URL}/api/users/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access: newToken } = response.data;
      
      // Store new token
      await AsyncStorage.setItem('auth_token', newToken);
      store.dispatch(setToken(newToken));

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  private async logout() {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      store.dispatch(clearAuth());
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Generic API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // Health monitoring methods
  async checkServerHealth(): Promise<any> {
    try {
      const response = await this.api.get('/api/health/', { timeout: 5000 });
      return { 
        isHealthy: response.status === 200 && response.data.status === 'healthy',
        data: response.data 
      };
    } catch (error) {
      console.warn('Mobile health check failed:', error);
      return { 
        isHealthy: false, 
        error: (error as Error).message 
      };
    }
  }

  async getDetailedHealth(): Promise<any> {
    const response = await this.api.get('/api/health/detailed/');
    return response.data;
  }

  async getSystemStatus(): Promise<any> {
    const response = await this.api.get('/api/health/infrastructure/');
    return response.data;
  }

  // Network status check (legacy method, kept for compatibility)
  async checkConnection(): Promise<boolean> {
    const healthCheck = await this.checkServerHealth();
    return healthCheck.isHealthy;
  }

  // Utility method to handle errors with mobile-friendly messages
  handleApiError(error: any): string {
    if (error.isRateLimit) {
      return error.message;
    }
    
    if (error.isSecurityViolation) {
      return 'Request blocked for security reasons. Please check your input.';
    }
    
    if (error.isIPBlocked) {
      return 'Access temporarily restricted. Please try again later.';
    }
    
    if (error.isServerError) {
      return 'Server temporarily unavailable. Please try again.';
    }
    
    if (error.isNetworkError) {
      return 'Network connection failed. Please check your internet connection.';
    }
    
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    
    if (error.response?.status === 403) {
      return 'Access denied.';
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  // Upload file with progress
  async uploadFile(
    url: string,
    file: any,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

export const apiService = new ApiService();
export default apiService;
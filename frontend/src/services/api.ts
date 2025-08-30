import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthTokens } from '../types';
import { MockAuthService } from './mockAuth';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;
  private tokens: AuthTokens | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.tokens?.access) {
          config.headers.Authorization = `Bearer ${this.tokens.access}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh, rate limiting, and security violations
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
          
          // Optionally auto-retry after specified time (for non-user-initiated requests)
          if (retryAfter && parseInt(retryAfter) <= 10 && !originalRequest._retryAfterRateLimit) {
            originalRequest._retryAfterRateLimit = true;
            console.log(`Auto-retrying request after ${retryAfter} seconds...`);
            
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
            'Your request contains potentially harmful content and has been blocked for security reasons.'
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
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
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

        return Promise.reject(error);
      }
    );
  }

  private loadTokensFromStorage(): void {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    this.tokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private clearTokensFromStorage(): void {
    this.tokens = null;
    localStorage.removeItem('auth_tokens');
  }

  // Authentication methods
  async login(usernameOrEmail: string, password: string): Promise<any> {
    try {
      const response = await this.api.post('/users/login/', {
        username: usernameOrEmail,
        password,
      });
      
      if (response.data.access) {
        const tokens: AuthTokens = {
          access: response.data.access,
          refresh: response.data.refresh,
        };
        this.saveTokensToStorage(tokens);
      }
      
      return response.data;
    } catch (error: any) {
      // If backend is not available or returns network error, use mock auth
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend not available, using mock authentication');
        const mockResponse = await MockAuthService.login(usernameOrEmail, password);
        
        if (mockResponse.access) {
          const tokens: AuthTokens = {
            access: mockResponse.access,
            refresh: mockResponse.refresh,
          };
          this.saveTokensToStorage(tokens);
        }
        
        return mockResponse;
      }
      
      // Re-throw other errors (like authentication failures)
      throw error;
    }
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    confirm_password: string;
    first_name: string;
    last_name: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/users/register/', userData);
      return response.data;
    } catch (error: any) {
      // If backend is not available, use mock auth
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend not available, using mock registration');
        return await MockAuthService.register(userData);
      }
      
      throw error;
    }
  }

  async verifyEmail(userId: string, otpCode: string): Promise<any> {
    try {
      const response = await this.api.post('/users/verify-email/', {
        user_id: userId,
        otp_code: otpCode,
      });
      
      if (response.data.access) {
        const tokens: AuthTokens = {
          access: response.data.access,
          refresh: response.data.refresh,
        };
        this.saveTokensToStorage(tokens);
      }
      
      return response.data;
    } catch (error: any) {
      // If backend is not available, use mock auth
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend not available, using mock email verification');
        const mockResponse = await MockAuthService.verifyEmail(userId, otpCode);
        
        if (mockResponse.access) {
          const tokens: AuthTokens = {
            access: mockResponse.access,
            refresh: mockResponse.refresh,
          };
          this.saveTokensToStorage(tokens);
        }
        
        return mockResponse;
      }
      
      throw error;
    }
  }

  async resendVerification(email: string): Promise<any> {
    const response = await this.api.post('/users/resend-verification/', {
      email,
    });
    return response.data;
  }

  async refreshToken(): Promise<AuthTokens> {
    if (!this.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/users/token/refresh/', {
      refresh: this.tokens.refresh,
    });

    const tokens: AuthTokens = response.data;
    this.saveTokensToStorage(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens?.refresh) {
        await this.api.post('/users/logout/', {
          refresh_token: this.tokens.refresh,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokensFromStorage();
    }
  }

  // User methods
  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/users/profile/');
    return response.data;
  }

  async updateUserProfile(profileData: any): Promise<any> {
    const response = await this.api.patch('/users/profile/', profileData);
    return response.data;
  }

  // Admin User Management methods
  async getAllUsers(): Promise<any> {
    const response = await this.api.get('/users/admin/all-users/');
    return response.data;
  }

  async createUser(userData: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role: string;
    subscription_tier: string;
    password: string;
  }): Promise<any> {
    const response = await this.api.post('/users/admin/create-user/', {
      email: userData.email,
      username: userData.email, // Use email as username
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone_number: userData.phone_number,
      role: userData.role,
      subscription_tier: userData.subscription_tier,
      password: userData.password,
    });
    return response.data;
  }

  // Trading signals methods
  async getSignals(params?: any): Promise<any> {
    const response = await this.api.get('/trading/signals/', { params });
    return response.data;
  }

  async createSignal(signalData: any): Promise<any> {
    const response = await this.api.post('/trading/signals/', signalData);
    return response.data;
  }

  async executeSignal(signalId: string): Promise<any> {
    const response = await this.api.post(`/trading/signals/${signalId}/execute/`);
    return response.data;
  }

  // Trading orders methods
  async getOrders(params?: any): Promise<any> {
    const response = await this.api.get('/trading/orders/', { params });
    return response.data;
  }

  async placeOrder(orderData: any): Promise<any> {
    const response = await this.api.post('/trading/orders/', orderData);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<any> {
    const response = await this.api.post(`/trading/orders/${orderId}/cancel/`);
    return response.data;
  }

  async modifyOrder(orderId: string, orderData: any): Promise<any> {
    const response = await this.api.patch(`/trading/orders/${orderId}/`, orderData);
    return response.data;
  }

  // Portfolio methods
  async getPortfolio(): Promise<any> {
    const response = await this.api.get('/portfolio/');
    return response.data;
  }

  async getHoldings(): Promise<any> {
    const response = await this.api.get('/portfolio/holdings/');
    return response.data;
  }

  async getPortfolioHistory(params?: any): Promise<any> {
    const response = await this.api.get('/portfolio/history/', { params });
    return response.data;
  }

  // Strategies methods
  async getStrategies(params?: any): Promise<any> {
    const response = await this.api.get('/strategies/', { params });
    return response.data;
  }

  async createStrategy(strategyData: any): Promise<any> {
    const response = await this.api.post('/strategies/', strategyData);
    return response.data;
  }

  async updateStrategy(strategyId: string, strategyData: any): Promise<any> {
    const response = await this.api.patch(`/strategies/${strategyId}/`, strategyData);
    return response.data;
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    await this.api.delete(`/strategies/${strategyId}/`);
  }

  async backtestStrategy(strategyId: string, params: any): Promise<any> {
    const response = await this.api.post(`/strategies/${strategyId}/backtest/`, params);
    return response.data;
  }

  // Market data methods
  async getMarketData(symbol: string, timeframe: string = '1d'): Promise<any> {
    const response = await this.api.get(`/market/data/${symbol}/`, {
      params: { timeframe },
    });
    return response.data;
  }

  async getWatchlist(): Promise<any> {
    const response = await this.api.get('/market/watchlist/');
    return response.data;
  }

  async addToWatchlist(symbol: string): Promise<any> {
    const response = await this.api.post('/market/watchlist/', { symbol });
    return response.data;
  }

  async removeFromWatchlist(symbol: string): Promise<void> {
    await this.api.delete(`/market/watchlist/${symbol}/`);
  }

  // Notifications methods
  async getNotifications(params?: any): Promise<any> {
    const response = await this.api.get('/notifications/', { params });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await this.api.patch(`/notifications/${notificationId}/`, {
      is_read: true,
    });
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<any> {
    const response = await this.api.post('/notifications/mark_all_read/');
    return response.data;
  }

  // Broker methods
  async getBrokerAccounts(): Promise<any> {
    const response = await this.api.get('/brokers/accounts/');
    return response.data;
  }

  async connectBroker(brokerName: string, credentials: any): Promise<any> {
    const response = await this.api.post(`/brokers/connect/${brokerName}/`, credentials);
    return response.data;
  }

  async disconnectBroker(accountId: string): Promise<void> {
    await this.api.delete(`/brokers/accounts/${accountId}/`);
  }

  // AI Studio methods
  async getStudioDashboard(): Promise<any> {
    const response = await this.api.get('/ai-studio/dashboard/');
    return response.data;
  }

  async getMLModels(params?: any): Promise<any> {
    const response = await this.api.get('/ai-studio/models/', { params });
    return response.data;
  }

  async createMLModel(modelData: any): Promise<any> {
    const response = await this.api.post('/ai-studio/models/', modelData);
    return response.data;
  }

  async updateMLModel(modelId: string, modelData: any): Promise<any> {
    const response = await this.api.patch(`/ai-studio/models/${modelId}/`, modelData);
    return response.data;
  }

  async deleteMLModel(modelId: string): Promise<void> {
    await this.api.delete(`/ai-studio/models/${modelId}/`);
  }

  async trainModel(modelId: string): Promise<any> {
    const response = await this.api.post(`/ai-studio/models/${modelId}/train/`);
    return response.data;
  }

  async publishModel(modelId: string, publishData: any): Promise<any> {
    const response = await this.api.post(`/ai-studio/models/${modelId}/publish/`, publishData);
    return response.data;
  }

  async unpublishModel(modelId: string): Promise<any> {
    const response = await this.api.post(`/ai-studio/models/${modelId}/unpublish/`);
    return response.data;
  }

  async getModelPerformance(modelId: string): Promise<any> {
    const response = await this.api.get(`/ai-studio/models/${modelId}/performance/`);
    return response.data;
  }

  async getTrainingJobs(): Promise<any> {
    const response = await this.api.get('/ai-studio/training-jobs/');
    return response.data;
  }

  async getTrainingJobDetail(jobId: string): Promise<any> {
    const response = await this.api.get(`/ai-studio/training-job/${jobId}/`);
    return response.data;
  }

  async getAvailableFeatures(): Promise<any> {
    const response = await this.api.get('/ai-studio/features/');
    return response.data;
  }

  async getMarketplace(params?: any): Promise<any> {
    const response = await this.api.get('/ai-studio/marketplace/', { params });
    return response.data;
  }

  async leaseModel(modelId: string): Promise<any> {
    const response = await this.api.post(`/ai-studio/lease/${modelId}/`);
    return response.data;
  }

  async getMyLeases(): Promise<any> {
    const response = await this.api.get('/ai-studio/my-leases/');
    return response.data;
  }

  async createModelReview(reviewData: any): Promise<any> {
    const response = await this.api.post('/ai-studio/reviews/', reviewData);
    return response.data;
  }

  async getModelReviews(params?: any): Promise<any> {
    const response = await this.api.get('/ai-studio/reviews/', { params });
    return response.data;
  }

  // SEBI Compliance methods
  async getComplianceDashboard(): Promise<any> {
    const response = await this.api.get('/compliance/dashboard/');
    return response.data;
  }

  async getInvestorProfile(): Promise<any> {
    const response = await this.api.get('/compliance/investor-profile/');
    return response.data;
  }

  async updateInvestorProfile(profileData: any): Promise<any> {
    const response = await this.api.patch('/compliance/investor-profile/', profileData);
    return response.data;
  }

  async uploadKYCDocument(documentType: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('document_type', documentType);

    const response = await this.api.post('/compliance/kyc-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getKYCDocuments(): Promise<any> {
    const response = await this.api.get('/compliance/kyc-documents/');
    return response.data;
  }

  async getTradingAlerts(params?: any): Promise<any> {
    const response = await this.api.get('/compliance/trading-alerts/', { params });
    return response.data;
  }

  async resolveTradingAlert(alertId: string, resolution: string): Promise<any> {
    const response = await this.api.patch(`/compliance/trading-alerts/${alertId}/`, {
      status: 'RESOLVED',
      resolution_notes: resolution
    });
    return response.data;
  }

  async getRegulatoryReports(params?: any): Promise<any> {
    const response = await this.api.get('/compliance/regulatory-reports/', { params });
    return response.data;
  }

  async downloadRegulatoryReport(reportId: string): Promise<Blob> {
    const response = await this.api.get(`/compliance/regulatory-reports/${reportId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getRiskManagement(): Promise<any> {
    const response = await this.api.get('/compliance/risk-management/');
    return response.data;
  }

  async updateRiskManagement(riskData: any): Promise<any> {
    const response = await this.api.patch('/compliance/risk-management/', riskData);
    return response.data;
  }

  async getGrievances(params?: any): Promise<any> {
    const response = await this.api.get('/compliance/grievances/', { params });
    return response.data;
  }

  async createGrievance(grievanceData: FormData): Promise<any> {
    const response = await this.api.post('/compliance/grievances/', grievanceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getRiskDisclosure(investmentType: string): Promise<any> {
    const response = await this.api.get(`/compliance/risk-disclosure/${investmentType}/`);
    return response.data;
  }

  async getSuitabilityAssessment(investmentAmount: number, investmentType: string): Promise<any> {
    const response = await this.api.post('/compliance/suitability-assessment/', {
      investment_amount: investmentAmount,
      investment_type: investmentType
    });
    return response.data;
  }

  async getComplianceStatus(): Promise<any> {
    const response = await this.api.get('/compliance/status/');
    return response.data;
  }

  async getLegalDisclosures(): Promise<any> {
    const response = await this.api.get('/compliance/legal-disclosures/');
    return response.data;
  }

  async acknowledgeDisclosure(disclosureType: string): Promise<any> {
    const response = await this.api.post('/compliance/acknowledge-disclosure/', {
      disclosure_type: disclosureType
    });
    return response.data;
  }

  async validatePreTradeCompliance(tradeData: any): Promise<any> {
    const response = await this.api.post('/compliance/pre-trade-validation/', tradeData);
    return response.data;
  }

  // Utility methods
  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Generic GET method
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(endpoint, { params });
    return response.data;
  }

  // Generic POST method
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(endpoint, data);
    return response.data;
  }

  // Generic PUT method
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(endpoint, data);
    return response.data;
  }

  // Generic PATCH method
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(endpoint, data);
    return response.data;
  }

  // Generic DELETE method
  async delete(endpoint: string): Promise<void> {
    await this.api.delete(endpoint);
  }

  // Health monitoring methods
  async checkServerHealth(): Promise<any> {
    try {
      const response = await this.api.get('/health/', { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.warn('Health check failed:', error);
      return { status: 'unhealthy', error: (error as Error).message };
    }
  }

  async getDetailedHealth(): Promise<any> {
    const response = await this.api.get('/health/detailed/');
    return response.data;
  }

  async getSystemMetrics(): Promise<any> {
    const response = await this.api.get('/metrics/');
    return response.data;
  }

  async getSecurityStatus(): Promise<any> {
    const response = await this.api.get('/security/monitoring/');
    return response.data;
  }

  // Utility method to handle errors with user-friendly messages
  handleApiError(error: any): string {
    if (error.isRateLimit) {
      return error.message;
    }
    
    if (error.isSecurityViolation) {
      return 'Your request was blocked for security reasons. Please check your input and try again.';
    }
    
    if (error.isIPBlocked) {
      return 'Access temporarily restricted. Please try again later.';
    }
    
    if (error.isServerError) {
      return 'Server is temporarily unavailable. Please try again in a few moments.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.tokens?.access;
  }

  // Get current tokens
  getTokens(): AuthTokens | null {
    return this.tokens;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthTokens, 
  TradingMonitorData, 
  SupportCenterData,
  DashboardData,
  PortfolioStats,
  Holding,
  TradingSignal,
  MarketOverview,
  AdminDashboardData,
  SystemHealth,
  UserActivity,
  UserSettings,
  SystemSettings,
  UserProfile,
  NotificationSettings,
  SecuritySettings,
  SubscriptionSettings,
  BillingSettings,
  ThemeSettings,
  BillingRecord,
  PaymentMethod,
  AdvancedTradingData,
  AdvancedTradingStrategy,
  StrategyType,
  RiskMetric,
  PortfolioRisk,
  StrategyConfiguration,
  StrategyDeployment,
  QuickDeployConfig,
  MarketData,
  OrderBook,
  PortfolioOptimization,
  AllocationItem,
  PerformancePoint,
  CorrelationMatrix,
  // Additional types for new API methods
  PortfolioData,
  PortfolioHolding,
  PortfolioPerformance,
  TradingStrategyInfo,
  TradingStrategyPerformance,
  AIModel,
  ModelPrediction,
  ModelPerformance,
  AnalyticsData,
  AnalyticsOverview,
  AnalyticsPerformance,
  AnalyticsRiskMetrics,
  TradingActivity,
  SectorAnalysis,
  UserInsights,
  CorrelationData,
  CustomTool,
  ToolResult,
  QuickTip,
  BacktestResult
} from '../types';

// API Configuration: prefer env, fallback to localhost:8000 for dev
const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:8000/api';

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

  // Safety wrapper to handle API responses and prevent runtime errors
  private safeApiResponse<T = any>(response: any, fallback: T): T {
    try {
      if (!response) return fallback;
      if (response.data !== undefined) return response.data;
      return response;
    } catch (error) {
      console.warn('API response parsing error:', error);
      return fallback;
    }
  }

  // Helper method for safe array responses
  private safeArrayResponse<T = any>(response: any): T[] {
    const data = this.safeApiResponse(response, { results: [] });
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return (data as any).results || (data as any).data || [];
    }
    return [];
  }

  // Helper method for safe object responses
  private safeObjectResponse<T = any>(response: any, defaultObject: T): T {
    const data = this.safeApiResponse(response, defaultObject);
    return typeof data === 'object' && data !== null ? data : defaultObject;
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
        //console.log('Backend not available, using mock authentication');
        // Mock auth disabled
        throw error;
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
      // No mock authentication fallback - backend is required
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
        //console.log('Backend not available, using mock email verification');
        // Mock auth disabled
        throw error;
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
    const response = await this.api.patch('/users/profile/update/', profileData);
    return response.data;
  }

  // Admin User Management methods
  async getAllUsers(): Promise<any> {
    const response = await this.api.get('/users/admin/all-users/');
    return response.data;
  }

  async createUser(userData: {
    email: string;
    username?: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role: string;
    subscription_tier: string;
    password: string;
  }): Promise<any> {
    const response = await this.api.post('/users/admin/create-user/', {
      email: userData.email,
      // Allow passing an explicit username; fall back to email when not provided
      username: userData.username || userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone_number: userData.phone_number,
      role: userData.role,
      subscription_tier: userData.subscription_tier,
      password: userData.password,
    });
    return response.data;
  }

  // Update user - Admin only
  async updateUser(userId: string, userData: {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    role?: string;
    subscription_tier?: string;
    is_active?: boolean;
  }): Promise<any> {
    const response = await this.api.patch(`/users/admin/update-user/${userId}/`, userData);
    return response.data;
  }

  // Delete user - Admin only
  async deleteUser(userId: string): Promise<any> {
    const response = await this.api.delete(`/users/admin/delete-user/${userId}/`);
    return response.data;
  }
  // Trading signals methods
  async getSignals(params?: any): Promise<any> {
    const response = await this.api.get('/trading/signals/', { params });
    return this.safeObjectResponse(response.data, { results: [], count: 0 });
  }

  async createSignal(signalData: any): Promise<any> {
    const response = await this.api.post('/trading/signals/', signalData);
    return this.safeObjectResponse(response.data, { id: null, status: 'error' });
  }

  async executeSignal(signalId: string): Promise<any> {
    const response = await this.api.post(`/trading/signals/${signalId}/execute/`);
    return this.safeObjectResponse(response.data, { success: false, message: 'Execution failed' });
  }

  // Trading orders methods
  async getOrders(params?: any): Promise<any> {
    const response = await this.api.get('/trading/orders/', { params });
    return this.safeObjectResponse(response.data, { results: [], count: 0 });
  }

  async placeOrder(orderData: any): Promise<any> {
    const response = await this.api.post('/trading/orders/', orderData);
    return this.safeObjectResponse(response.data, { id: null, status: 'failed', message: 'Order placement failed' });
  }

  async cancelOrder(orderId: string): Promise<any> {
    const response = await this.api.post(`/trading/orders/${orderId}/cancel/`);
    return this.safeObjectResponse(response.data, { success: false, message: 'Order cancellation failed' });
  }

  async modifyOrder(orderId: string, orderData: any): Promise<any> {
    const response = await this.api.patch(`/trading/orders/${orderId}/`, orderData);
    return this.safeObjectResponse(response.data, { success: false, message: 'Order modification failed' });
  }

  // Portfolio methods - using trading app endpoints
  async getPortfolio(): Promise<any> {
    const response = await this.api.get('/trading/portfolio/overview/');
    return response.data;
  }

  async getHoldings(): Promise<any> {
    const response = await this.api.get('/trading/portfolio/positions/');
    return response.data;
  }

  async getPortfolioHistory(params?: any): Promise<any> {
    const response = await this.api.get('/trading/reports/trade-history/', { params });
    return response.data;
  }

  // Legacy strategies methods - removed to avoid duplicates with new comprehensive methods

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

  // Legacy getModelPerformance removed to avoid duplicate with new comprehensive method

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

  // Trading Monitor methods
  async getTradingMonitorData(): Promise<TradingMonitorData> {
    const response = await this.api.get('/trading/monitor/dashboard/');
    return response.data;
  }

  async getSystemMetricsData(): Promise<any> {
    const response = await this.api.get('/trading/monitor/system-metrics/');
    return response.data;
  }

  async getMonitorActiveStrategies(): Promise<any> {
    const response = await this.api.get('/trading/monitor/active-strategies/');
    return response.data;
  }

  async getSystemAlerts(): Promise<any> {
    const response = await this.api.get('/trading/monitor/alerts/');
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<any> {
    const response = await this.api.patch(`/trading/monitor/alerts/${alertId}/resolve/`);
    return response.data;
  }

  // Support Center methods
  async getSupportCenterData(): Promise<SupportCenterData> {
    const response = await this.api.get('/support/dashboard/');
    return response.data;
  }

  async getSupportMetrics(): Promise<any> {
    const response = await this.api.get('/support/metrics/');
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

  // Dashboard API methods - using existing trading endpoints
  async getDashboardData(): Promise<DashboardData> {
    return this.get('/trading/dashboard/');
  }

  async getPortfolioStats(): Promise<PortfolioStats> {
    return this.get('/trading/portfolio/overview/');
  }

  async getTopHoldings(limit: number = 5): Promise<Holding[]> {
    return this.get(`/trading/portfolio/positions/?limit=${limit}`);
  }

  async getRecentSignals(limit: number = 5): Promise<TradingSignal[]> {
    return this.get(`/trading/signals/?limit=${limit}&ordering=-created_at`);
  }

  async getMarketOverview(): Promise<MarketOverview> {
    return this.get('/market-data/overview/');
  }

  // Role-specific dashboard methods - using trading automation endpoints
  async getAdminDashboardData(): Promise<AdminDashboardData> {
    return this.get('/trading/automation/dashboard/');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.get('/trading/automation/health/');
  }

  async getUserActivity(limit: number = 10): Promise<UserActivity[]> {
    return this.get(`/trading/automation/stats/?limit=${limit}`);
  }

  // Dashboard refresh methods - using existing endpoints
  async refreshDashboardData(): Promise<DashboardData> {
    // Use existing portfolio sync endpoint instead
    return this.post('/trading/portfolio/sync/', {});
  }

  async refreshPortfolioData(): Promise<PortfolioStats> {
    return this.post('/trading/portfolio/sync/', {});
  }

  // Settings API methods
  async getUserSettings(): Promise<UserSettings> {
    return this.get('/settings/user/');
  }

  async updateUserSettings(profileData: Partial<UserProfile>): Promise<UserProfile> {
    return this.patch('/settings/user/profile/', profileData);
  }

  async updateNotificationSettings(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.patch('/settings/user/notifications/', notifications);
  }

  async updateSecuritySettings(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
    return this.patch('/settings/user/security/', security);
  }

  async updateThemeSettings(theme: Partial<ThemeSettings>): Promise<ThemeSettings> {
    return this.patch('/settings/user/theme/', theme);
  }

  async getSubscriptionSettings(): Promise<SubscriptionSettings> {
    return this.get('/settings/user/subscription/');
  }

  async getBillingSettings(): Promise<BillingSettings> {
    return this.get('/settings/user/billing/');
  }

  async getBillingHistory(): Promise<BillingRecord[]> {
    return this.get('/settings/user/billing/history/');
  }

  async updatePaymentMethod(paymentData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.post('/settings/user/billing/payment-method/', paymentData);
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await this.api.get(`/settings/user/billing/invoice/${invoiceId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // System settings (Admin only)
  async getSystemSettings(): Promise<SystemSettings> {
    return this.get('/settings/system/');
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.patch('/settings/system/', settings);
  }

  // Subscription management
  async upgradeSubscription(tier: 'ELITE'): Promise<{ checkout_url: string }> {
    return this.post('/settings/user/subscription/upgrade/', { tier });
  }

  async cancelSubscription(): Promise<{ status: string }> {
    return this.post('/settings/user/subscription/cancel/', {});
  }

  // Security operations
  async enableTwoFactor(): Promise<{ qr_code: string; backup_codes: string[] }> {
    return this.post('/settings/user/security/2fa/enable/', {});
  }

  async disableTwoFactor(code: string): Promise<{ status: string }> {
    return this.post('/settings/user/security/2fa/disable/', { code });
  }

  async generateApiKey(name: string, permissions: string[]): Promise<{ key: string; key_id: string }> {
    return this.post('/settings/user/security/api-keys/', { name, permissions });
  }

  async revokeApiKey(keyId: string): Promise<{ status: string }> {
    await this.delete(`/settings/user/security/api-keys/${keyId}/`);
    return { status: 'revoked' };
  }

  // Settings backup and restore
  async exportSettings(): Promise<Blob> {
    const response = await this.api.get('/settings/user/export/', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importSettings(settingsFile: File): Promise<{ status: string; imported_count: number }> {
    const formData = new FormData();
    formData.append('settings_file', settingsFile);
    
    const response = await this.api.post('/settings/user/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async resetSettingsToDefault(): Promise<UserSettings> {
    return this.post('/settings/user/reset/', {});
  }

  // Advanced Trading API Methods
  async getAdvancedTradingData(): Promise<AdvancedTradingData> {
    return this.get('/trading/advanced/');
  }

  async getActiveStrategies(): Promise<AdvancedTradingStrategy[]> {
    return this.get('/trading/strategies/active/');
  }

  async getStrategyTypes(): Promise<StrategyType[]> {
    return this.get('/trading/strategies/types/');
  }

  async getRiskMetrics(): Promise<RiskMetric[]> {
    return this.get('/trading/risk/metrics/');
  }

  async getPortfolioRisk(): Promise<PortfolioRisk> {
    return this.get('/trading/portfolio/risk/');
  }

  async deployStrategy(config: {
    strategyType: string;
    configuration: StrategyConfiguration;
  }): Promise<StrategyDeployment> {
    return this.post('/trading/strategies/deploy/', config);
  }

  async quickDeployStrategy(config: QuickDeployConfig): Promise<StrategyDeployment> {
    return this.post('/trading/strategies/quick-deploy/', config);
  }

  async updateStrategyStatus(
    strategyId: number, 
    action: 'start' | 'pause' | 'stop'
  ): Promise<AdvancedTradingStrategy> {
    return this.patch(`/trading/strategies/${strategyId}/status/`, { action });
  }

  async removeStrategy(strategyId: number): Promise<{ status: string }> {
    await this.delete(`/trading/strategies/${strategyId}/`);
    return { status: 'removed' };
  }

  async getAdvancedTradingStrategyDetails(strategyId: number): Promise<AdvancedTradingStrategy> {
    return this.get(`/trading/strategies/${strategyId}/`);
  }

  async updateStrategyConfiguration(
    strategyId: number, 
    configuration: Partial<StrategyConfiguration>
  ): Promise<AdvancedTradingStrategy> {
    return this.patch(`/trading/strategies/${strategyId}/config/`, configuration);
  }

  async getMarketDataAdvanced(symbols?: string[]): Promise<MarketData[]> {
    const params = symbols ? { symbols: symbols.join(',') } : {};
    return this.get('/trading/market-data/', params);
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    return this.get(`/trading/order-book/${symbol}/`);
  }

  async getPortfolioOptimization(): Promise<PortfolioOptimization> {
    return this.get('/trading/portfolio/optimization/');
  }

  async optimizePortfolio(preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    targetReturn?: number;
    constraints?: string[];
  }): Promise<PortfolioOptimization> {
    return this.post('/trading/portfolio/optimize/', preferences);
  }

  async rebalancePortfolio(allocations: AllocationItem[]): Promise<{ status: string; orders: any[] }> {
    return this.post('/trading/portfolio/rebalance/', { allocations });
  }

  async getStrategyPerformance(
    strategyId: number, 
    timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M'
  ): Promise<PerformancePoint[]> {
    return this.get(`/trading/strategies/${strategyId}/performance/`, { timeframe });
  }

  async getStrategyBacktest(
    strategyType: string,
    configuration: StrategyConfiguration,
    backtestPeriod: { start: string; end: string }
  ): Promise<{
    returns: PerformancePoint[];
    metrics: {
      totalReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      averageTrade: number;
    };
  }> {
    return this.post('/trading/strategies/backtest/', {
      strategy_type: strategyType,
      configuration,
      backtest_period: backtestPeriod
    });
  }

  // Real-time data subscription endpoints
  async subscribeToRealTimeUpdates(subscriptions: {
    strategies?: boolean;
    riskMetrics?: boolean;
    marketData?: boolean;
    portfolio?: boolean;
  }): Promise<{ websocket_url: string; token: string }> {
    return this.post('/trading/realtime/subscribe/', subscriptions);
  }

  async unsubscribeFromRealTimeUpdates(): Promise<{ status: string }> {
    return this.post('/trading/realtime/unsubscribe/', {});
  }

  // Risk management endpoints
  async updateRiskLimits(limits: {
    maxPositionSize?: number;
    dailyLossLimit?: number;
    sectorConcentration?: number;
    leverageRatio?: number;
  }): Promise<PortfolioRisk> {
    return this.patch('/trading/risk/limits/', limits);
  }

  async triggerRiskCheck(): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    violations: string[];
    recommendations: string[];
  }> {
    return this.post('/trading/risk/check/', {});
  }

  // Advanced charts and analytics
  async getAdvancedChartData(
    symbol: string, 
    timeframe: string, 
    indicators?: string[]
  ): Promise<{
    ohlcv: { timestamp: string; open: number; high: number; low: number; close: number; volume: number }[];
    indicators: { [key: string]: number[] };
  }> {
    return this.get(`/trading/charts/${symbol}/`, { timeframe, indicators: indicators?.join(',') });
  }

  async getVolumeProfile(symbol: string, period: string): Promise<{
    priceVolume: { price: number; volume: number }[];
    poc: number; // Point of Control
    vah: number; // Value Area High
    val: number; // Value Area Low
  }> {
    return this.get(`/trading/volume-profile/${symbol}/`, { period });
  }

  async getMarketScanner(criteria: {
    filters: string[];
    sortBy: string;
    limit?: number;
  }): Promise<MarketData[]> {
    return this.post('/trading/scanner/', criteria);
  }

  async getCorrelationMatrix(symbols: string[]): Promise<CorrelationMatrix> {
    return this.post('/trading/correlation/', { symbols });
  }

  // Portfolio API Methods - using trading app endpoints
  async getPortfolioData(): Promise<PortfolioData> {
    return this.get('/trading/portfolio/overview/');
  }

  async getPortfolioHoldings(): Promise<PortfolioHolding[]> {
    return this.get('/trading/portfolio/positions/');
  }

  async getPortfolioPerformance(period: string = '1M'): Promise<PortfolioPerformance> {
    return this.get('/trading/reports/performance/', { period });
  }

  async updateHolding(holdingId: string, data: Partial<PortfolioHolding>): Promise<PortfolioHolding> {
    return this.patch(`/trading/portfolio/positions/${holdingId}/`, data);
  }

  async sellHolding(holdingId: string, quantity: number): Promise<{ status: string; orderId: string }> {
    return this.post(`/trading/orders/`, { 
      action: 'SELL',
      quantity: quantity,
      holding_id: holdingId
    });
  }

  // Strategies API Methods - using trading app endpoints
  async getTradingStrategies(filters?: {
    type?: string;
    status?: string;
    riskProfile?: string;
    minRating?: number;
  }): Promise<TradingStrategyInfo[]> {
    return this.get('/trading/strategies/', filters);
  }

  async getMyStrategies(): Promise<TradingStrategyInfo[]> {
    // Since backend doesn't have 'my' endpoint, filter by user on frontend or use regular strategies
    return this.get('/trading/strategies/');
  }

  async getStrategyDetails(strategyId: string): Promise<TradingStrategyInfo> {
    return this.get(`/trading/strategies/${strategyId}/`);
  }

  async createStrategy(strategy: Partial<TradingStrategyInfo>): Promise<TradingStrategyInfo> {
    return this.post('/trading/strategies/', strategy);
  }

  async updateTradingStrategy(strategyId: string, updates: Partial<TradingStrategyInfo>): Promise<TradingStrategyInfo> {
    return this.patch(`/trading/strategies/${strategyId}/`, updates);
  }

  async deleteStrategy(strategyId: string): Promise<{ status: string }> {
    await this.delete(`/strategies/${strategyId}/`);
    return { status: 'deleted' };
  }

  async followStrategy(strategyId: string): Promise<{ status: string }> {
    return this.post(`/strategies/${strategyId}/follow/`, {});
  }

  async unfollowStrategy(strategyId: string): Promise<{ status: string }> {
    return this.post(`/strategies/${strategyId}/unfollow/`, {});
  }

  async backtestStrategy(strategyId: string, parameters: {
    startDate: string;
    endDate: string;
    initialCapital: number;
  }): Promise<BacktestResult> {
    return this.post(`/strategies/${strategyId}/backtest/`, parameters);
  }

  // AI Studio API Methods
  async getAIModels(): Promise<AIModel[]> {
    return this.get('/ai-studio/models/');
  }

  async getAIModelDetails(modelId: string): Promise<AIModel> {
    return this.get(`/ai-studio/models/${modelId}/`);
  }

  async createAIModel(model: Partial<AIModel>): Promise<AIModel> {
    return this.post('/ai-studio/models/', model);
  }

  async trainAIModel(modelId: string, parameters: {
    trainingData: string;
    features: string[];
    algorithm: string;
    hyperparameters: { [key: string]: any };
  }): Promise<{ status: string; taskId: string }> {
    return this.post(`/ai-studio/models/${modelId}/train/`, parameters);
  }

  async getModelPredictions(modelId: string, symbols?: string[]): Promise<ModelPrediction[]> {
    const params = symbols ? { symbols: symbols.join(',') } : {};
    return this.get(`/ai-studio/models/${modelId}/predictions/`, params);
  }

  async generatePrediction(modelId: string, symbol: string, timeframe: string): Promise<ModelPrediction> {
    return this.post(`/ai-studio/models/${modelId}/predict/`, { symbol, timeframe });
  }

  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    return this.get(`/ai-studio/models/${modelId}/performance/`);
  }

  async deployAIModel(modelId: string): Promise<{ status: string; deploymentId: string }> {
    return this.post(`/ai-studio/models/${modelId}/deploy/`, {});
  }

  // Analytics API Methods
  async getAnalyticsData(timeframe: string = '1M'): Promise<AnalyticsData> {
    return this.get('/analytics/overview/', { timeframe });
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return this.get('/analytics/overview/summary/');
  }

  async getAnalyticsPerformance(period: string = '1M'): Promise<AnalyticsPerformance> {
    return this.get('/analytics/performance/', { period });
  }

  async getAnalyticsRiskMetrics(): Promise<AnalyticsRiskMetrics> {
    return this.get('/analytics/risk-metrics/');
  }

  async getTradingActivity(period: string = '1M'): Promise<TradingActivity> {
    return this.get('/analytics/trading-activity/', { period });
  }

  async getSectorAnalysis(): Promise<SectorAnalysis[]> {
    return this.get('/analytics/sector-analysis/');
  }

  async getUserInsights(): Promise<UserInsights> {
    return this.get('/analytics/user-insights/');
  }

  async getCorrelationAnalysis(symbols: string[]): Promise<CorrelationData> {
    return this.post('/analytics/correlation/', { symbols });
  }

  // Custom Tools API Methods
  async getCustomTools(category?: string): Promise<CustomTool[]> {
    const params = category ? { category } : {};
    return this.get('/tools/', params);
  }

  async getCustomToolDetails(toolId: string): Promise<CustomTool> {
    return this.get(`/tools/${toolId}/`);
  }

  async createCustomTool(tool: Partial<CustomTool>): Promise<CustomTool> {
    return this.post('/tools/', tool);
  }

  async updateCustomTool(toolId: string, updates: Partial<CustomTool>): Promise<CustomTool> {
    return this.patch(`/tools/${toolId}/`, updates);
  }

  async deleteCustomTool(toolId: string): Promise<{ status: string }> {
    await this.delete(`/tools/${toolId}/`);
    return { status: 'deleted' };
  }

  async executeCustomTool(toolId: string, parameters: { [key: string]: any }): Promise<ToolResult> {
    return this.post(`/tools/${toolId}/execute/`, { parameters });
  }

  async getToolResults(toolId: string, limit: number = 10): Promise<ToolResult[]> {
    return this.get(`/tools/${toolId}/results/`, { limit });
  }

  // Quick Tips API Methods
  async getQuickTips(userRole?: string, category?: string): Promise<QuickTip[]> {
    const params: any = {};
    if (userRole) params.userRole = userRole;
    if (category) params.category = category;
    return this.get('/tips/', params);
  }

  async getPersonalizedTips(): Promise<QuickTip[]> {
    return this.get('/tips/personalized/');
  }

  async markTipAsHelpful(tipId: string): Promise<{ status: string }> {
    return this.post(`/tips/${tipId}/helpful/`, {});
  }

  async markTipAsViewed(tipId: string): Promise<{ status: string }> {
    return this.post(`/tips/${tipId}/viewed/`, {});
  }

  async executeTipAction(tipId: string, actionType: string): Promise<{ status: string; result?: any }> {
    return this.post(`/tips/${tipId}/execute/`, { actionType });
  }

  // Test custom API endpoint
  async testCustomEndpoint(testConfig: {
    endpoint: string;
    method: string;
    headers?: any;
    data?: any;
  }): Promise<any> {
    try {
      const { endpoint, method, headers = {}, data } = testConfig;
      
      switch (method.toUpperCase()) {
        case 'GET':
          return await this.get(endpoint);
        case 'POST':
          return await this.post(endpoint, data || {});
        case 'PUT':
          return await this.put(endpoint, data || {});
        case 'DELETE':
          return await this.delete(endpoint);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error: any) {
      // Return a structured error response
      return {
        success: false,
        error: error.message || 'API test failed',
        status: error.response?.status || 500,
        data: error.response?.data || null
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

// Type definitions for ShareWise AI Trading Platform

// Trading Monitor Types
export interface SystemMetrics {
  totalUsers: number;
  activeTraders: number;
  totalVolume: string;
  systemHealth: number;
  refreshedAt: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  users: number;
  performance: number;
  status: 'active' | 'warning' | 'error' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TradingMonitorData {
  systemMetrics: SystemMetrics;
  activeStrategies: TradingStrategy[];
  recentAlerts: SystemAlert[];
}

// Support Center Types
export interface SupportMetrics {
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
  satisfaction: number;
  refreshedAt: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  user: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'escalated' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  category: string;
  description?: string;
}

export interface SupportChannel {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
  isActive: boolean;
  lastActivity?: string;
}

export interface SupportCenterData {
  supportMetrics: SupportMetrics;
  recentTickets: SupportTicket[];
  supportChannels: SupportChannel[];
}

// Sales Analytics Types
export interface SalesMetrics {
  revenue: number;
  revenueGrowth: number;
  totalLeads: number;
  leadsGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  avgDealSize: number;
  dealSizeGrowth: number;
  refreshedAt: string;
}

export interface SalesRepPerformance {
  id: string;
  name: string;
  avatar: string;
  role: string;
  revenue: number;
  deals: number;
  conversionRate: number;
  target: number;
  performance: number;
  email?: string;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  leads: number;
  deals: number;
  conversionRate?: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  value: number;
  tier: 'Enterprise' | 'Professional' | 'Basic';
  deals: number;
  lastActivity?: string;
  industry?: string;
}

export interface LeadSource {
  id: string;
  source: string;
  count: number;
  conversion: number;
  color: string;
  cost?: number;
  roi?: number;
}

export interface SalesAnalyticsData {
  salesMetrics: SalesMetrics;
  salesTeamPerformance: SalesRepPerformance[];
  monthlyTrends: MonthlyTrend[];
  topCustomers: TopCustomer[];
  leadSources: LeadSource[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'SALES' | 'SUPPORT' | 'SUPER_ADMIN';
  subscription_tier: 'PRO' | 'ELITE';
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user: string;
  pan_number?: string;
  aadhar_number?: string;
  risk_tolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  max_daily_loss: number;
  preferred_brokers: string[];
  trading_preferences: Record<string, any>;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradingSignal {
  id: string;
  timestamp: string;
  symbol: string;
  strategy_name: string;
  signal_type: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  confidence_score: number;
  entry_price: number;
  target_price?: number;
  stop_loss?: number;
  valid_until?: string;
  backtest_result: Record<string, any>;
  executed: boolean;
  executed_price?: number;
  user: string;
  created_by_strategy_id?: string;
  market_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_valid?: boolean;
  risk_reward_ratio?: number;
}

export interface TradingOrder {
  id: string;
  signal?: string;
  user: string;
  broker_order_id?: string;
  symbol: string;
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL_M';
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  trigger_price?: number;
  status: 'PENDING' | 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED';
  filled_quantity: number;
  average_price?: number;
  order_timestamp: string;
  exchange_timestamp?: string;
  rejection_reason?: string;
  fees: number;
  taxes: number;
  created_at: string;
  updated_at: string;
  total_value?: number;
  is_executed?: boolean;
}

export interface Portfolio {
  id: string;
  user: string;
  name: string;
  total_value: number;
  available_cash: number;
  invested_amount: number;
  unrealized_pnl: number;
  realized_pnl: number;
  created_at: string;
  updated_at: string;
  holdings: Holding[];
}

export interface Holding {
  id: string;
  portfolio: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price?: number;
  last_price_update?: string;
  unrealized_pnl: number;
  created_at: string;
  updated_at: string;
}

export interface Strategy {
  id: string;
  user: string;
  name: string;
  description?: string;
  strategy_type: 'TECHNICAL' | 'FUNDAMENTAL' | 'HYBRID' | 'ML';
  parameters: Record<string, any>;
  entry_conditions: Record<string, any>;
  exit_conditions: Record<string, any>;
  risk_management: Record<string, any>;
  is_active: boolean;
  is_public: boolean;
  backtest_results: Record<string, any>;
  live_performance: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MarketData {
  id: string;
  symbol: string;
  timestamp: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  timeframe: string;
  technical_indicators: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user: string;
  title: string;
  message: string;
  notification_type: 'SIGNAL' | 'ORDER' | 'PORTFOLIO' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  is_read: boolean;
  delivery_methods: string[];
  delivered_at?: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface TradingState {
  signals: TradingSignal[];
  orders: TradingOrder[];
  activeOrders: TradingOrder[];
  orderHistory: TradingOrder[];
  loading: boolean;
  error: string | null;
}

export interface PortfolioState {
  portfolio: Portfolio | null;
  holdings: Holding[];
  totalValue: number;
  todayPnl: number;
  loading: boolean;
  error: string | null;
}

export interface MarketState {
  watchlist: string[];
  prices: Record<string, MarketData>;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  trading: TradingState;
  portfolio: PortfolioState;
  market: MarketState;
}

// API Response types
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  non_field_errors?: string[];
  [key: string]: any;
}

// Chart data types
export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LineData {
  time: string;
  value: number;
}

// Trading specific types
export interface OrderRequest {
  signal_id?: string;
  symbol: string;
  order_type: TradingOrder['order_type'];
  transaction_type: TradingOrder['transaction_type'];
  quantity: number;
  price?: number;
  trigger_price?: number;
}

export interface SignalFilter {
  symbol?: string;
  strategy_name?: string;
  signal_type?: TradingSignal['signal_type'];
  executed?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface PerformanceMetrics {
  total_return: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  max_drawdown: number;
  sharpe_ratio: number;
  calmar_ratio: number;
  total_trades: number;
}

// AI Studio types
export interface MLModel {
  id: string;
  user: string;
  name: string;
  description: string;
  model_type: 'CLASSIFICATION' | 'REGRESSION' | 'CLUSTERING';
  target_variable: string;
  features: string[];
  training_parameters: Record<string, any>;
  training_period_days: number;
  validation_split: number;
  status: 'DRAFT' | 'TRAINING' | 'COMPLETED' | 'FAILED' | 'PUBLISHED' | 'ARCHIVED';
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  auc_roc?: number;
  total_return?: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  max_drawdown?: number;
  win_rate?: number;
  training_results?: Record<string, any>;
  backtest_results?: Record<string, any>;
  feature_importance?: Record<string, any>;
  is_published: boolean;
  monthly_lease_price?: number;
  total_leases: number;
  total_earnings: number;
  model_file_path?: string;
  training_started_at?: string;
  training_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingJob {
  id: string;
  model: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  celery_task_id?: string;
  current_step?: string;
  progress_percentage: number;
  error_message?: string;
  result_data?: Record<string, any>;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ModelLeasing {
  id: string;
  lessee: string;
  model: string;
  lease_price: number;
  platform_commission: number;
  creator_earnings: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface ModelReview {
  id: string;
  reviewer: string;
  model: string;
  rating: number;
  comment?: string;
  performance_verified: boolean;
  would_recommend: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  name: string;
  display_name: string;
  category: string;
  description: string;
}

export interface StudioDashboard {
  total_models: number;
  published_models: number;
  training_models: number;
  completed_models: number;
  total_earnings: number;
  active_leases: number;
  recent_models: MLModel[];
  recent_training_jobs: TrainingJob[];
}

export interface MarketplaceModel {
  id: string;
  name: string;
  description: string;
  model_type: string;
  creator_username: string;
  monthly_lease_price: number;
  total_leases: number;
  average_rating?: number;
  total_return?: number;
  sharpe_ratio?: number;
  win_rate?: number;
  max_drawdown?: number;
  created_at: string;
}

export interface AIStudioState {
  dashboard: StudioDashboard | null;
  models: MLModel[];
  trainingJobs: TrainingJob[];
  marketplace: MarketplaceModel[];
  myLeases: ModelLeasing[];
  availableFeatures: Feature[];
  loading: boolean;
  error: string | null;
}

// SEBI Compliance Types
export interface InvestorProfile {
  id: string;
  user: string;
  pan_number: string;
  aadhaar_number?: string;
  category: 'INDIVIDUAL' | 'HUF' | 'COMPANY' | 'PARTNERSHIP' | 'TRUST' | 'FPI' | 'NRI';
  mobile_number: string;
  email_verified: boolean;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  annual_income: string;
  net_worth?: number;
  source_of_funds: string;
  trading_experience: number;
  risk_profile: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  investment_objectives: string;
  kyc_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  kyc_completion_date?: string;
  last_kyc_update?: string;
  is_us_person: boolean;
  tax_residency: string;
  created_at: string;
  updated_at: string;
}

export interface KYCDocument {
  id: string;
  user: string;
  document_type: 'PAN' | 'AADHAAR' | 'PASSPORT' | 'DL' | 'VOTER_ID' | 'BANK_STMT' | 'INCOME' | 'ADDRESS' | 'PHOTO' | 'SIGNATURE';
  document_number: string;
  document_file?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  verified_by?: string;
  verification_date?: string;
  expiry_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TradingAlert {
  id: string;
  user: string;
  alert_type: 'POSITION_LIMIT' | 'DAILY_LOSS' | 'UNUSUAL_ACTIVITY' | 'RAPID_TRADING' | 'LARGE_ORDER' | 'CIRCUIT_BREAKER' | 'KYC_EXPIRED' | 'REGULATORY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  trigger_value?: number;
  threshold_value?: number;
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolved_by?: string;
  resolution_notes?: string;
  triggered_at: string;
  resolved_at?: string;
}

export interface RiskManagement {
  id: string;
  user: string;
  max_position_size: number;
  max_daily_loss: number;
  max_monthly_loss: number;
  max_leverage_equity: number;
  max_leverage_fno: number;
  max_orders_per_day: number;
  max_turnover_per_day: number;
  enable_circuit_breaker: boolean;
  circuit_breaker_percentage: number;
  cool_off_period_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface InvestorGrievance {
  id: string;
  complainant: string;
  grievance_type: 'TRADING_ISSUE' | 'SETTLEMENT_DELAY' | 'UNAUTHORIZED_TRADE' | 'SYSTEM_ISSUE' | 'ADVISORY_COMPLAINT' | 'BILLING_ISSUE' | 'KYC_ISSUE' | 'OTHER';
  subject: string;
  description: string;
  supporting_documents: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  assigned_to?: string;
  resolution_notes?: string;
  expected_resolution_date: string;
  actual_resolution_date?: string;
  scores_reference?: string;
  escalated_to_sebi: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryReport {
  id: string;
  report_type: 'DAILY_TRADES' | 'MONTHLY_CLIENT' | 'QUARTERLY_COMPLIANCE' | 'ANNUAL_RETURN' | 'INCIDENT_REPORT' | 'AML_REPORT';
  report_period_start: string;
  report_period_end: string;
  report_data: Record<string, any>;
  report_file?: string;
  status: 'DRAFT' | 'GENERATED' | 'SUBMITTED' | 'ACKNOWLEDGED';
  generated_by?: string;
  submission_reference?: string;
  generated_at?: string;
  submitted_at?: string;
  created_at: string;
}

export interface ComplianceChecklist {
  id: string;
  date: string;
  kyc_verification_completed: boolean;
  risk_limits_monitored: boolean;
  unusual_activity_checked: boolean;
  system_alerts_reviewed: boolean;
  client_complaints_addressed: boolean;
  regulatory_updates_reviewed: boolean;
  trade_data_verified: boolean;
  client_data_backed_up: boolean;
  audit_logs_generated: boolean;
  daily_reports_generated: boolean;
  exception_reports_reviewed: boolean;
  compliance_officer_signoff: boolean;
  signed_by?: string;
  sign_off_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LegalDisclaimer {
  title: string;
  content: string;
  acknowledgment_required: boolean;
  effective_date: string;
  last_updated: string;
  version: string;
  regulatory_basis?: string;
}

export interface RiskDisclosure {
  investment_type: string;
  disclosure: {
    title: string;
    key_risks: string[];
    regulatory_warning: string;
    minimum_knowledge_required: string;
    personal_recommendation?: string;
    experience_warning?: string;
  };
}

export interface SuitabilityAssessment {
  suitable: boolean;
  suitability_score: number;
  warnings: string[];
  recommendations: string[];
  restrictions: string[];
  overall_rating: 'SUITABLE' | 'SUITABLE_WITH_CAUTION' | 'MARGINALLY_SUITABLE' | 'NOT_SUITABLE';
}

export interface ComplianceStatus {
  timestamp: string;
  overall_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNDER_REVIEW' | 'ERROR';
  checks_performed: string[];
  issues_found: string[];
  warnings: string[];
  recommendations: string[];
  compliance_score: number;
}

export interface ComplianceDashboard {
  timestamp: string;
  overall_compliance: {
    status: string;
    score: number;
    last_check?: string;
  };
  daily_checklist: {
    exists: boolean;
    completion_percentage: number;
    signed_off: boolean;
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
    high: number;
  };
  kyc_status: {
    total_profiles: number;
    verified: number;
    pending: number;
    expired: number;
    completion_rate: number;
  };
  reports: {
    total: number;
    submitted: number;
    pending: number;
  };
  quick_stats: {
    active_investors: number;
    recent_trades: number;
    pending_grievances: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'SIGNAL' | 'ALERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  is_read: boolean;
  user: string;
  related_object_type?: string;
  related_object_id?: string;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export interface ComplianceState {
  investorProfile: InvestorProfile | null;
  kycDocuments: KYCDocument[];
  tradingAlerts: TradingAlert[];
  riskManagement: RiskManagement | null;
  grievances: InvestorGrievance[];
  reports: RegulatoryReport[];
  complianceStatus: ComplianceStatus | null;
  dashboard: ComplianceDashboard | null;
  legalDisclosures: Record<string, LegalDisclaimer>;
  loading: boolean;
  error: string | null;
}

// Dashboard Types
export interface DashboardData {
  portfolioStats: PortfolioStats;
  topHoldings: Holding[];
  recentSignals: TradingSignal[];
  systemMetrics?: SystemMetrics;
  userMetrics?: UserMetrics;
  marketOverview?: MarketOverview;
}

export interface PortfolioStats {
  totalValue: number;
  todayPnl: number;
  todayPnlPercent: number;
  totalPnl: number;
  totalPnlPercent: number;
  allocatedCapital: number;
  availableFunds: number;
  activePositions: number;
  currency: string;
}

export interface UserMetrics {
  login_streak: number;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
  favorite_instruments: string[];
  risk_score: number;
  portfolio_growth: number;
}

export interface MarketOverview {
  indices: MarketIndex[];
  trending_stocks: TrendingStock[];
  market_status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';
  market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface MarketIndex {
  name: string;
  symbol: string;
  current_value: number;
  change: number;
  change_percent: number;
  volume: number;
}

export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
  volume: number;
  market_cap: number;
}

// Role-specific dashboard data
export interface AdminDashboardData extends DashboardData {
  systemMetrics: SystemMetrics;
  userActivity: UserActivity[];
  systemHealth: SystemHealth;
}

export interface UserActivity {
  id: string;
  user_id: string;
  username: string;
  action: string;
  timestamp: string;
  ip_address?: string;
}

export interface SystemHealth {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  database_connections: number;
  redis_status: 'HEALTHY' | 'WARNING' | 'ERROR';
  api_response_time: number;
  uptime: string;
}

export interface SupportDashboardData extends DashboardData {
  supportMetrics: SupportMetrics;
  recentTickets: SupportTicket[];
  ticketsByPriority: { priority: string; count: number }[];
}

export interface SalesDashboardData extends DashboardData {
  salesMetrics: SalesMetrics;
  salesTargets: SalesTarget[];
  leadSources: LeadSource[];
  recentDeals: Deal[];
}

export interface SalesTarget {
  period: string;
  target: number;
  achieved: number;
  percentage: number;
}

export interface Deal {
  id: string;
  client_name: string;
  amount: number;
  stage: string;
  probability: number;
  expected_close: string;
}

// Settings Types
export interface UserSettings {
  id: string;
  user_id: string;
  profile: UserProfile;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  security: SecuritySettings;
  subscription: SubscriptionSettings;
  billing: BillingSettings;
  theme: ThemeSettings;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  timezone: string;
  language: string;
  currency: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  location?: string;
}

export interface UserPreferences {
  dashboard_layout: 'compact' | 'expanded' | 'custom';
  default_view: 'dashboard' | 'portfolio' | 'trading' | 'analytics';
  auto_refresh_interval: number; // in seconds
  data_retention_days: number;
  export_format: 'csv' | 'excel' | 'pdf';
  chart_type: 'line' | 'candlestick' | 'bar';
  show_advanced_features: boolean;
  portfolio_grouping: 'sector' | 'asset_type' | 'performance';
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  price_alerts: boolean;
  portfolio_updates: boolean;
  news_alerts: boolean;
  system_maintenance: boolean;
  marketing_emails: boolean;
  weekly_reports: boolean;
  monthly_statements: boolean;
  trade_confirmations: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number; // in minutes
  allowed_ip_addresses: string[];
  api_access_enabled: boolean;
  api_keys: ApiKey[];
  password_last_changed: string;
  security_questions_set: boolean;
  biometric_enabled: boolean;
  trusted_devices: TrustedDevice[];
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  created_at: string;
  last_used: string;
  expires_at?: string;
  is_active: boolean;
}

export interface TrustedDevice {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  last_access: string;
  is_current: boolean;
}

export interface SubscriptionSettings {
  tier: 'BASIC' | 'PRO' | 'ELITE';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  features: SubscriptionFeature[];
  usage_limits: UsageLimits;
  upgrade_available: boolean;
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  usage?: number;
}

export interface UsageLimits {
  max_strategies: number;
  max_signals: number;
  max_api_calls: number;
  max_portfolios: number;
  storage_limit_gb: number;
  current_usage: {
    strategies: number;
    signals: number;
    api_calls: number;
    portfolios: number;
    storage_used_gb: number;
  };
}

export interface BillingSettings {
  payment_method: PaymentMethod;
  billing_address: BillingAddress;
  billing_history: BillingRecord[];
  next_billing_date: string;
  billing_cycle: 'monthly' | 'yearly';
  auto_pay_enabled: boolean;
  tax_id?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'upi' | 'wallet';
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  card_brand?: string;
  bank_name?: string;
  upi_id?: string;
  is_default: boolean;
  is_verified: boolean;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  company?: string;
  tax_id?: string;
}

export interface BillingRecord {
  id: string;
  invoice_number: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  pdf_url?: string;
  payment_method: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  accent_color: string;
  font_size: 'small' | 'medium' | 'large';
  sidebar_collapsed: boolean;
  animations_enabled: boolean;
  high_contrast: boolean;
  custom_css?: string;
}

export interface SystemSettings {
  general: GeneralSettings;
  security: SystemSecuritySettings;
  email: EmailSettings;
  integrations: IntegrationSettings;
  maintenance: MaintenanceSettings;
  backup: BackupSettings;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  default_timezone: string;
  default_currency: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  demo_mode: boolean;
  max_users: number;
  session_timeout: number;
}

export interface SystemSecuritySettings {
  password_policy: PasswordPolicy;
  login_attempts: number;
  lockout_duration: number;
  require_2fa: boolean;
  allowed_domains: string[];
  ip_whitelist: string[];
  audit_logs_retention: number;
  encryption_enabled: boolean;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  expiry_days: number;
  history_count: number;
}

export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string;
  use_tls: boolean;
  from_email: string;
  from_name: string;
  template_settings: EmailTemplateSettings;
}

export interface EmailTemplateSettings {
  welcome_email: boolean;
  password_reset: boolean;
  trade_confirmations: boolean;
  price_alerts: boolean;
  weekly_reports: boolean;
  system_notifications: boolean;
}

export interface IntegrationSettings {
  broker_integrations: BrokerIntegration[];
  market_data_providers: MarketDataProvider[];
  webhook_settings: WebhookSettings;
  api_rate_limits: ApiRateLimit[];
}

export interface BrokerIntegration {
  id: string;
  name: string;
  provider: string;
  is_enabled: boolean;
  api_credentials: Record<string, any>;
  supported_features: string[];
  last_sync: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface MarketDataProvider {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  data_types: string[];
  refresh_interval: number;
  api_key?: string;
}

export interface WebhookSettings {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  retry_attempts: number;
  timeout_seconds: number;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret?: string;
}

export interface ApiRateLimit {
  endpoint: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
}

export interface MaintenanceSettings {
  scheduled_maintenance: ScheduledMaintenance[];
  backup_schedule: BackupSchedule;
  log_retention_days: number;
  cleanup_schedule: string;
}

export interface ScheduledMaintenance {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affected_services: string[];
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention_days: number;
  include_user_data: boolean;
  include_system_data: boolean;
}

export interface BackupSettings {
  auto_backup: boolean;
  backup_location: 'local' | 'cloud' | 'both';
  encryption_enabled: boolean;
  last_backup: string;
  backup_history: BackupRecord[];
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  size_mb: number;
  status: 'success' | 'failed' | 'in_progress';
  file_path?: string;
}

// Advanced Trading Types
export interface AdvancedTradingStrategy {
  id: number;
  name: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  pnl: number;
  trades: number;
  winRate: number;
  capital?: number;
  timeframe?: string;
  instruments?: string[];
  maxDrawdown?: number;
  dailyLossLimit?: number;
  positionSize?: number;
  enableStopLoss?: boolean;
  deployedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  expectedReturn?: number;
  volatility?: number;
  drawdownHistory?: number[];
  performanceHistory?: PerformancePoint[];
}

export interface PerformancePoint {
  timestamp: string;
  pnl: number;
  trades: number;
  winRate: number;
  drawdown: number;
}

export interface StrategyType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'momentum' | 'mean_reversion' | 'arbitrage' | 'custom';
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  timeframe: string[];
  instruments: string[];
  minCapital: number;
  features: string[];
  isActive: boolean;
}

export interface RiskMetric {
  title: string;
  value: string;
  subtitle: string;
  color: 'primary' | 'success' | 'error' | 'warning' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  percentage?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface StrategyConfiguration {
  capital: string;
  timeframe: string;
  instruments: string;
  maxDrawdown: string;
  dailyLossLimit: string;
  positionSize: string;
  enableStopLoss: boolean;
  stopLossPercent?: string;
  takeProfitPercent?: string;
  riskRewardRatio?: string;
  maxPositions?: number;
  entryConditions?: EntryCondition[];
  exitConditions?: ExitCondition[];
}

export interface EntryCondition {
  id: string;
  type: 'technical_indicator' | 'price_action' | 'volume' | 'custom';
  indicator?: string;
  comparison: 'greater_than' | 'less_than' | 'equals' | 'crosses_above' | 'crosses_below';
  value: number;
  timeframe?: string;
}

export interface ExitCondition {
  id: string;
  type: 'stop_loss' | 'take_profit' | 'time' | 'technical' | 'custom';
  value: number;
  percentage?: boolean;
  timeframe?: string;
}

export interface QuickDeployConfig {
  strategyTemplate: string;
  capital: string;
  enableRisk: boolean;
  riskLevel?: 'conservative' | 'moderate' | 'aggressive';
  autoRebalance?: boolean;
  notificationsEnabled?: boolean;
}

export interface PortfolioRisk {
  portfolioHeat: number;
  maxPositionSize: number;
  dailyLossLimit: number;
  sectorConcentration: number;
  leverageRatio: number;
  var95: number; // Value at Risk 95%
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  correlation: number;
  exposures: SectorExposure[];
}

export interface SectorExposure {
  sector: string;
  exposure: number;
  limit: number;
  risk: 'low' | 'medium' | 'high';
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  pe?: number;
  timestamp: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  timestamp: string;
}

export interface PortfolioOptimization {
  recommendations: OptimizationRecommendation[];
  currentAllocation: AllocationItem[];
  optimizedAllocation: AllocationItem[];
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  correlationMatrix: CorrelationMatrix;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'rebalance' | 'add_position' | 'reduce_position' | 'close_position';
  symbol: string;
  currentWeight: number;
  recommendedWeight: number;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
}

export interface AllocationItem {
  symbol: string;
  weight: number;
  value: number;
  quantity: number;
  sector: string;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface AdvancedTradingData {
  activeStrategies: AdvancedTradingStrategy[];
  strategyTypes: StrategyType[];
  riskMetrics: RiskMetric[];
  portfolioRisk: PortfolioRisk;
  marketData: MarketData[];
  orderBooks: { [symbol: string]: OrderBook };
  portfolioOptimization: PortfolioOptimization;
  lastUpdated: string;
}

export interface StrategyDeployment {
  id: string;
  strategyId: string;
  strategyName: string;
  configuration: StrategyConfiguration;
  status: 'pending' | 'deploying' | 'active' | 'failed';
  deployedAt?: string;
  error?: string;
  progress?: number;
}

// Portfolio Types
export interface PortfolioData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  investedAmount: number;
  cashBalance: number;
  availableMargin?: number;
  usedMargin?: number;
  marginUtilization?: number;
  lastUpdated: string;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string;
  exchange: string;
  holdingType: 'equity' | 'derivative' | 'mutual_fund' | 'bond' | 'etf';
  lastTradeDate: string;
}

export interface PortfolioPerformance {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  returns: number;
  benchmark?: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  dataPoints: PerformanceDataPoint[];
}

export interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

// Strategies Page Types
export interface TradingStrategyInfo {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'algorithmic' | 'copy_trading' | 'ai_generated';
  status: 'active' | 'inactive' | 'backtesting' | 'paper_trading';
  performance: TradingStrategyPerformance;
  riskProfile: 'low' | 'medium' | 'high';
  minimumCapital: number;
  timeframe: string;
  instruments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  followers: number;
  rating: number;
  tags: string[];
}

export interface TradingStrategyPerformance {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTradeReturn: number;
  bestTrade: number;
  worstTrade: number;
}

// AI Studio Types
export interface AIModel {
  id: string;
  name: string;
  type: 'price_prediction' | 'sentiment_analysis' | 'pattern_recognition' | 'risk_assessment' | 'portfolio_optimization';
  status: 'training' | 'ready' | 'deployed' | 'error';
  accuracy: number;
  confidence: number;
  trainingProgress: number;
  lastTrained: string;
  predictions: ModelPrediction[];
  parameters: ModelParameters;
  performance: ModelPerformance;
}

export interface ModelPrediction {
  id: string;
  symbol: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  createdAt: string;
  actualOutcome?: number;
  accuracy?: number;
}

export interface ModelParameters {
  algorithm: string;
  features: string[];
  trainingPeriod: string;
  validationSplit: number;
  hyperparameters: { [key: string]: any };
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mae: number;
  rmse: number;
  backtestResults: BacktestResult[];
}

export interface BacktestResult {
  period: string;
  returns: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
}

// Analytics Types
export interface AnalyticsData {
  overview: AnalyticsOverview;
  performance: AnalyticsPerformance;
  riskMetrics: AnalyticsRiskMetrics;
  tradingActivity: TradingActivity;
  sectorAnalysis: SectorAnalysis[];
  correlationMatrix: CorrelationData;
  userInsights: UserInsights;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  totalVolume: number;
  profitableUsers: number;
  averageReturn: number;
  topPerformers: TopPerformer[];
}

export interface AnalyticsPerformance {
  periodicReturns: PeriodicReturn[];
  benchmarkComparison: BenchmarkData;
  riskAdjustedReturns: RiskAdjustedReturn[];
}

export interface AnalyticsRiskMetrics {
  portfolioVaR: number;
  expectedShortfall: number;
  beta: number;
  alpha: number;
  treynorRatio: number;
  informationRatio: number;
  trackingError: number;
}

export interface TradingActivity {
  dailyVolume: VolumeData[];
  instrumentBreakdown: InstrumentData[];
  orderFlow: OrderFlowData[];
  executionQuality: ExecutionMetrics;
}

export interface SectorAnalysis {
  sector: string;
  allocation: number;
  performance: number;
  risk: number;
  momentum: number;
}

export interface CorrelationData {
  symbols: string[];
  matrix: number[][];
  heatmapData: HeatmapPoint[];
}

export interface HeatmapPoint {
  x: string;
  y: string;
  value: number;
}

export interface UserInsights {
  behaviorPatterns: BehaviorPattern[];
  recommendations: Recommendation[];
  alerts: InsightAlert[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  suggestion: string;
}

export interface Recommendation {
  id: string;
  type: 'rebalance' | 'new_opportunity' | 'risk_warning' | 'performance_tip';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface InsightAlert {
  id: string;
  type: 'warning' | 'opportunity' | 'milestone';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Custom Tools Types
export interface CustomTool {
  id: string;
  name: string;
  description: string;
  type: 'screener' | 'calculator' | 'analyzer' | 'monitor' | 'alerts';
  category: 'technical' | 'fundamental' | 'risk' | 'portfolio' | 'market';
  parameters: ToolParameter[];
  results: ToolResult[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
  isPremium: boolean;
}

export interface ToolParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'multiselect' | 'date' | 'daterange';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: ToolOption[];
  validation?: ParameterValidation;
}

export interface ToolOption {
  value: any;
  label: string;
  description?: string;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface ToolResult {
  id: string;
  timestamp: string;
  parameters: { [key: string]: any };
  data: any;
  metadata: ToolResultMetadata;
}

export interface ToolResultMetadata {
  executionTime: number;
  dataPoints: number;
  accuracy?: number;
  confidence?: number;
  source: string;
}

// Quick Tips Types
export interface QuickTip {
  id: string;
  title: string;
  content: string;
  type: 'strategy' | 'risk' | 'technical' | 'fundamental' | 'market' | 'portfolio';
  category: 'beginner' | 'intermediate' | 'advanced';
  priority: number;
  isPersonalized: boolean;
  userRoles: ('BASIC' | 'PRO' | 'ELITE' | 'ADMIN' | 'STAFF')[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  helpfulCount: number;
  relatedSymbols?: string[];
  actionable?: boolean;
  action?: TipAction;
}

export interface TipAction {
  type: 'navigate' | 'execute' | 'alert' | 'learn_more';
  target: string;
  label: string;
  parameters?: { [key: string]: any };
}

// Supporting Types
export interface TopPerformer {
  userId: string;
  username: string;
  returns: number;
  sharpeRatio: number;
  risk: string;
}

export interface PeriodicReturn {
  period: string;
  returns: number;
  benchmark: number;
  outperformance: number;
}

export interface BenchmarkData {
  name: string;
  returns: number;
  correlation: number;
  beta: number;
  alpha: number;
}

export interface RiskAdjustedReturn {
  metric: string;
  value: number;
  benchmark: number;
  percentile: number;
}

export interface VolumeData {
  date: string;
  volume: number;
  value: number;
  trades: number;
}

export interface InstrumentData {
  instrument: string;
  volume: number;
  percentage: number;
  avgPrice: number;
}

export interface OrderFlowData {
  time: string;
  buyVolume: number;
  sellVolume: number;
  netFlow: number;
  price: number;
}

export interface ExecutionMetrics {
  avgSlippage: number;
  fillRate: number;
  avgExecutionTime: number;
  priceImprovement: number;
}
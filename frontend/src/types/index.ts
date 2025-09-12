// Type definitions for ShareWise AI Trading Platform

export * from "./user";
export * from "./auth";


export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'USER' | 'SALES' | 'SUPPORT' | 'SUPER_ADMIN';
  subscription_tier: 'BASIC' | 'PRO' | 'ENTERPRISE';
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
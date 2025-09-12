// User and Profile types


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

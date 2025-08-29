// Mock Authentication Service for Demo Purposes
export interface MockUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_tier: 'PRO' | 'ELITE';
  is_verified: boolean;
}

export interface MockAuthResponse {
  access: string;
  refresh: string;
  user: MockUser;
}

// Demo users with different subscription tiers
const DEMO_USERS: Record<string, { password: string; user: MockUser }> = {
  'demo@pro.com': {
    password: 'demo123',
    user: {
      id: '2',
      username: 'pro_user',
      email: 'demo@pro.com',
      first_name: 'Pro',
      last_name: 'User',
      subscription_tier: 'PRO',
      is_verified: true,
    }
  },
  'demo@elite.com': {
    password: 'demo123',
    user: {
      id: '3',
      username: 'elite_user',
      email: 'demo@elite.com',
      first_name: 'Elite',
      last_name: 'User',
      subscription_tier: 'ELITE',
      is_verified: true,
    }
  },
  // Also support username login
  'pro_user': {
    password: 'demo123',
    user: {
      id: '2',
      username: 'pro_user',
      email: 'demo@pro.com',
      first_name: 'Pro',
      last_name: 'User',
      subscription_tier: 'PRO',
      is_verified: true,
    }
  },
  'elite_user': {
    password: 'demo123',
    user: {
      id: '3',
      username: 'elite_user',
      email: 'demo@elite.com',
      first_name: 'Elite',
      last_name: 'User',
      subscription_tier: 'ELITE',
      is_verified: true,
    }
  }
};

export class MockAuthService {
  static async login(usernameOrEmail: string, password: string): Promise<MockAuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userRecord = DEMO_USERS[usernameOrEmail.toLowerCase()];
    
    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid credentials. Try demo@pro.com or demo@elite.com with password: demo123');
    }
    
    // Generate mock tokens
    const mockTokens = {
      access: `mock_access_token_${userRecord.user.id}_${Date.now()}`,
      refresh: `mock_refresh_token_${userRecord.user.id}_${Date.now()}`
    };
    
    return {
      ...mockTokens,
      user: userRecord.user
    };
  }
  
  static async register(userData: any): Promise<{ message: string; user_id: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if email already exists
    if (DEMO_USERS[userData.email.toLowerCase()]) {
      throw new Error('Email already exists');
    }
    
    return {
      message: 'Registration successful. Please check your email for verification.',
      user_id: `new_user_${Date.now()}`
    };
  }
  
  static async verifyEmail(userId: string, otpCode: string): Promise<MockAuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Accept any 6-digit OTP for demo
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      throw new Error('Invalid OTP code. Please enter a 6-digit code.');
    }
    
    // Return pro user for verification demo
    const mockUser = DEMO_USERS['demo@pro.com'];
    const mockTokens = {
      access: `mock_access_token_verified_${Date.now()}`,
      refresh: `mock_refresh_token_verified_${Date.now()}`
    };
    
    return {
      ...mockTokens,
      user: mockUser.user
    };
  }
  
  static getDemoCredentials(): Array<{ email: string; username: string; password: string; tier: string }> {
    return [
      { email: 'demo@pro.com', username: 'pro_user', password: 'demo123', tier: 'Pro' },
      { email: 'demo@elite.com', username: 'elite_user', password: 'demo123', tier: 'Elite' }
    ];
  }
}
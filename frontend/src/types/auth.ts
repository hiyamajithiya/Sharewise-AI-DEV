import { User, UserProfile } from "./user";

// Auth-specific types

export interface LoginErrorPayload {
  message: string;
  requiresVerification?: boolean;
  email?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

import axios from 'axios';
import { AuthTokens, LoginResponse, User, UserProfile } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('auth_tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

export const login = async (usernameOrEmail: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/users/login/', {
      username: usernameOrEmail,
      password: password
    });

    const { user, tokens } = response.data;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    return { user, tokens };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (userData: {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
}): Promise<LoginResponse> => {
  const response = await api.post('/users/register/', userData);
  return response.data;
};

export const verifyEmail = async (userId: string, otpCode: string): Promise<any> => {
  const response = await api.post('/users/verify-email/', { user_id: userId, otp_code: otpCode });
  return response.data;
};

export const resendVerification = async (email: string): Promise<any> => {
  const response = await api.post('/users/resend-verification/', { email });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/users/logout/');
  localStorage.removeItem('auth_tokens');
};

export const refreshToken = async (): Promise<AuthTokens> => {
  const tokens = localStorage.getItem('auth_tokens');
  if (!tokens) throw new Error('No refresh token found');
  
  const { refresh } = JSON.parse(tokens);
  const response = await api.post('/users/token/refresh/', { refresh });
  const newTokens = response.data;
  
  localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
  return newTokens;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/profile/');
  return response.data;
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch('/users/profile/update/', profileData);
  return response.data;
};

const apiService = {
  login,
  register,
  verifyEmail,
  resendVerification,
  logout,
  refreshToken,
  getCurrentUser,
  updateUserProfile,
};

export default apiService;

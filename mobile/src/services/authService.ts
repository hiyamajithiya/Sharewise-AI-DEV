import { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNativeBiometrics } from 'react-native-biometrics';
import apiService from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    subscriptionTier: string;
    isVerified: boolean;
  };
  token: string;
  refreshToken: string;
}

interface VerifyEmailData {
  email: string;
  otp: string;
}

class AuthService {
  private biometrics: ReactNativeBiometrics;

  constructor() {
    this.biometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  async login(credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/api/users/login/', credentials);
    
    if (response.data.token) {
      await this.storeTokens(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  async register(userData: RegisterData): Promise<AxiosResponse> {
    return apiService.post('/api/users/register/', userData);
  }

  async verifyEmail(data: VerifyEmailData): Promise<AxiosResponse> {
    const response = await apiService.post('/api/users/verify-email/', data);
    
    if (response.data.token) {
      await this.storeTokens(response.data.token, response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<AxiosResponse> {
    try {
      const response = await apiService.post('/api/users/logout/');
      await this.clearTokens();
      await this.clearBiometricData();
      return response;
    } catch (error) {
      // Even if logout fails on server, clear local data
      await this.clearTokens();
      await this.clearBiometricData();
      throw error;
    }
  }

  async refreshToken(): Promise<AxiosResponse> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post('/api/users/token/refresh/', {
      refresh: refreshToken,
    });

    if (response.data.access) {
      await AsyncStorage.setItem('auth_token', response.data.access);
    }

    return response;
  }

  async forgotPassword(email: string): Promise<AxiosResponse> {
    return apiService.post('/api/users/forgot-password/', { email });
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<AxiosResponse> {
    return apiService.post('/api/users/reset-password/', data);
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse> {
    return apiService.post('/api/users/change-password/', data);
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    phoneNumber?: string;
  }): Promise<AxiosResponse> {
    return apiService.patch('/api/users/profile/', data);
  }

  async getProfile(): Promise<AxiosResponse> {
    return apiService.get('/api/users/profile/');
  }

  // Biometric authentication methods
  async checkBiometricSupport(): Promise<{
    available: boolean;
    biometryType?: string;
    error?: string;
  }> {
    try {
      const { available, biometryType } = await this.biometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  }

  async enableBiometricAuth(): Promise<boolean> {
    try {
      const { available } = await this.biometrics.isSensorAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Create biometric keys
      const { keysExist } = await this.biometrics.keysExist();
      if (!keysExist) {
        await this.biometrics.createKeys();
      }

      // Store biometric preference
      await AsyncStorage.setItem('biometric_enabled', 'true');

      return true;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  async disableBiometricAuth(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_enabled', 'false');
      await this.biometrics.deleteKeys();
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const isEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (isEnabled !== 'true') {
        return false;
      }

      const { success } = await this.biometrics.simplePrompt({
        promptMessage: 'Authenticate to access ShareWise AI',
        cancelButtonText: 'Cancel',
      });

      return success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  // Token management
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['auth_token', accessToken],
        ['refresh_token', refreshToken],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private async clearBiometricData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('biometric_enabled');
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return !!token;
    } catch {
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  // Session management
  async extendSession(): Promise<AxiosResponse> {
    return apiService.post('/api/users/extend-session/');
  }

  async validateSession(): Promise<AxiosResponse> {
    return apiService.get('/api/users/validate-session/');
  }
}

export const authService = new AuthService();
export default authService;
/**
 * Enhanced Error Handling Utilities for ShareWise AI Mobile App
 * Provides user-friendly error messages and handles various error types
 */

import { apiService } from '../services/api';

export interface EnhancedError extends Error {
  isRateLimit?: boolean;
  isSecurityViolation?: boolean;
  isIPBlocked?: boolean;
  isServerError?: boolean;
  isNetworkError?: boolean;
  retryAfter?: string;
  violationType?: string;
  rateLimitData?: any;
  securityData?: any;
  blockedData?: any;
}

export class ErrorHandler {
  /**
   * Get user-friendly error message for mobile
   */
  static getUserMessage(error: EnhancedError): string {
    return apiService.handleApiError(error);
  }

  /**
   * Determine if error is recoverable (user can retry)
   */
  static isRecoverable(error: EnhancedError): boolean {
    return !!(
      error.isRateLimit || 
      error.isServerError || 
      error.isNetworkError ||
      (error as any).response?.status >= 500
    );
  }

  /**
   * Get retry delay in seconds (mobile-optimized)
   */
  static getRetryDelay(error: EnhancedError): number {
    if (error.isRateLimit && error.retryAfter) {
      // Cap at 30 seconds for mobile to avoid long waits
      return Math.min(parseInt(error.retryAfter), 30);
    }
    
    if (error.isServerError) {
      return 15; // Shorter retry for mobile (15 seconds)
    }
    
    if (error.isNetworkError) {
      return 3; // Quick retry for network issues (3 seconds)
    }
    
    return 0;
  }

  /**
   * Determine if error should be reported to crash analytics
   */
  static shouldReport(error: EnhancedError): boolean {
    // Report security violations, server errors, and unexpected errors
    return !!(
      error.isSecurityViolation || 
      error.isServerError || 
      error.isIPBlocked ||
      (!error.isRateLimit && !error.isNetworkError)
    );
  }

  /**
   * Get error category for mobile analytics
   */
  static getErrorCategory(error: EnhancedError): string {
    if (error.isRateLimit) return 'rate_limit';
    if (error.isSecurityViolation) return 'security_violation';
    if (error.isIPBlocked) return 'ip_blocked';
    if (error.isServerError) return 'server_error';
    if (error.isNetworkError) return 'network_error';
    if ((error as any).response?.status === 401) return 'authentication';
    if ((error as any).response?.status === 403) return 'authorization';
    if ((error as any).response?.status === 404) return 'not_found';
    if ((error as any).response?.status >= 400 && (error as any).response?.status < 500) return 'client_error';
    return 'unknown';
  }

  /**
   * Handle error with mobile-optimized retry logic
   */
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2, // Fewer retries for mobile to preserve battery
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: EnhancedError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as EnhancedError;
        
        // Don't retry non-recoverable errors
        if (!this.isRecoverable(lastError)) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Mobile-optimized delay calculation
        const retryDelay = this.getRetryDelay(lastError) * 1000 || 
          Math.min(baseDelay * Math.pow(1.5, attempt - 1), 10000); // Cap at 10 seconds
        
        console.log(`Mobile retry in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if device is likely on a metered connection
   */
  static isMeteredConnection(): boolean {
    // This would integrate with React Native NetInfo
    // For now, return false as default
    return false;
  }

  /**
   * Get battery-aware retry strategy
   */
  static getBatteryAwareRetries(): number {
    // This would integrate with React Native battery status
    // For now, return conservative default
    return 2;
  }
}

// Export types for TypeScript users
export type { EnhancedError };

// Export helper functions
export const {
  getUserMessage,
  isRecoverable,
  getRetryDelay,
  shouldReport,
  getErrorCategory,
  handleWithRetry
} = ErrorHandler;
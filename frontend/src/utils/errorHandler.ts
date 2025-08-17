/**
 * Enhanced Error Handling Utilities for ShareWise AI Frontend
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
   * Get user-friendly error message
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
   * Get retry delay in seconds
   */
  static getRetryDelay(error: EnhancedError): number {
    if (error.isRateLimit && error.retryAfter) {
      return parseInt(error.retryAfter);
    }
    
    if (error.isServerError) {
      return 30; // 30 seconds for server errors
    }
    
    if (error.isNetworkError) {
      return 5; // 5 seconds for network errors
    }
    
    return 0;
  }

  /**
   * Determine if error should be logged to monitoring service
   */
  static shouldLog(error: EnhancedError): boolean {
    // Log security violations and server errors
    return !!(error.isSecurityViolation || error.isServerError || error.isIPBlocked);
  }

  /**
   * Get error category for analytics
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
   * Handle error with automatic retry logic
   */
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
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
        
        // Calculate delay with exponential backoff
        const retryDelay = this.getRetryDelay(lastError) * 1000 || (baseDelay * Math.pow(2, attempt - 1));
        
        console.log(`Retrying operation in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError!;
  }
}

// Export types for TypeScript users
export type { EnhancedError };

// Export helper functions
export const {
  getUserMessage,
  isRecoverable,
  getRetryDelay,
  shouldLog,
  getErrorCategory,
  handleWithRetry
} = ErrorHandler;
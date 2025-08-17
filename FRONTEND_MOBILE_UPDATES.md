# Frontend & Mobile App Updates Required

## Summary of Backend Changes Made Today

1. **Security Middleware System** - Enhanced rate limiting, input validation, security headers
2. **Health Check Endpoints** - New monitoring endpoints for system health
3. **Enhanced Session Security** - Improved CSRF protection and session management
4. **Redis Integration** - Advanced caching and session storage
5. **Comprehensive Audit System** - Security violation tracking and monitoring

## Required Frontend Updates

### 1. Health Check Integration (Optional but Recommended)

Add health monitoring to the frontend API service:

```typescript
// Add to frontend/src/services/api.ts

// Health check methods
async checkServerHealth(): Promise<any> {
  const response = await this.api.get('/health/');
  return response.data;
}

async getSystemMetrics(): Promise<any> {
  const response = await this.api.get('/metrics/');
  return response.data;
}

async getSecurityStatus(): Promise<any> {
  const response = await this.api.get('/security/monitoring/');
  return response.data;
}
```

### 2. Enhanced Error Handling for Rate Limiting

Update error handling to properly display rate limit messages:

```typescript
// In frontend/src/services/api.ts - Update response interceptor

this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limiting (429 status)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const rateLimitData = error.response.data;
      
      // Show user-friendly rate limit message
      console.warn('Rate limit exceeded:', rateLimitData);
      
      // Optionally retry after the specified time
      if (retryAfter && !originalRequest._retryAfterRateLimit) {
        originalRequest._retryAfterRateLimit = true;
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        return this.api(originalRequest);
      }
      
      throw new Error(rateLimitData.message || 'Too many requests. Please try again later.');
    }

    // Handle security violations (400 with security violation)
    if (error.response?.status === 400 && error.response.data?.error === 'Security violation detected') {
      throw new Error('Request blocked for security reasons. Please check your input.');
    }

    // Existing 401 handling...
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ... existing refresh token logic
    }

    return Promise.reject(error);
  }
);
```

### 3. Security Headers Compatibility

Frontend is already compatible with security headers. No changes needed as the headers are handled by the browser.

### 4. Session Management Enhancement (Optional)

Add session monitoring to detect when backend invalidates sessions:

```typescript
// Add to frontend/src/services/api.ts

async validateSession(): Promise<boolean> {
  try {
    await this.getCurrentUser();
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      this.logout();
      return false;
    }
    return true;
  }
}
```

## Required Mobile App Updates

### 1. Health Check Integration

Add to mobile/src/services/api.ts:

```typescript
// Health monitoring methods
async checkServerHealth(): Promise<boolean> {
  try {
    const response = await this.get('/api/health/', { timeout: 5000 });
    return response.status === 200 && response.data.status === 'healthy';
  } catch {
    return false;
  }
}

async getSystemStatus(): Promise<any> {
  const response = await this.get('/api/health/detailed/');
  return response.data;
}
```

### 2. Enhanced Network Error Handling

Update mobile/src/services/api.ts response interceptor:

```typescript
// Enhanced response interceptor for mobile
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      
      // Show user notification about rate limiting
      // Could integrate with your notification system
      console.warn('Rate limit exceeded. Retry after:', retryAfter);
      
      throw new Error('Too many requests. Please wait before trying again.');
    }

    // Handle security violations
    if (error.response?.status === 400 && 
        error.response.data?.violation_type) {
      throw new Error('Request blocked for security reasons.');
    }

    // Existing token refresh logic...
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ... existing code
    }

    return Promise.reject(error);
  }
);
```

### 3. Background App State Handling

Add session validation when app returns from background:

```typescript
// Add to mobile app lifecycle handling
import { AppState } from 'react-native';

class ApiService {
  // ... existing code ...

  setupAppStateHandling() {
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // Validate session when app becomes active
        const isHealthy = await this.checkServerHealth();
        if (!isHealthy) {
          // Handle server unavailability
          console.warn('Server health check failed');
        }
      }
    });
  }
}
```

## Configuration Updates

### Environment Variables

#### Frontend (.env)
```bash
# Already correctly configured
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
```

#### Mobile (environment config)
```typescript
// mobile/src/config/environment.ts
export const API_CONFIG = {
  // Update for production
  BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://api.sharewise.ai',
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  TIMEOUT: 30000,
};
```

## Security Considerations

### 1. Rate Limiting Awareness
- Both apps should inform users about rate limits
- Implement retry logic with exponential backoff
- Cache frequently accessed data to reduce API calls

### 2. Input Validation
- Frontend validation should complement backend validation
- Sanitize user inputs before sending to backend
- Display clear error messages for validation failures

### 3. Session Security
- Implement automatic logout on security violations
- Monitor session validity more frequently
- Clear sensitive data on app backgrounding (mobile)

## Testing Required

### Frontend Testing
1. Test rate limiting behavior with rapid API calls
2. Verify error handling for security violations
3. Test session timeout scenarios
4. Verify health check integration

### Mobile Testing
1. Test background/foreground app transitions
2. Verify network error handling
3. Test rate limiting with mobile-specific scenarios
4. Test security violation responses

## Implementation Priority

### High Priority (Immediate)
1. ✅ **Already Compatible** - Authentication, basic API calls
2. Enhanced error handling for rate limiting
3. Security violation error handling

### Medium Priority (Next Release)
1. Health check integration
2. Session monitoring improvements
3. Background app state handling (mobile)

### Low Priority (Future Enhancement)
1. Advanced metrics monitoring
2. Real-time security status
3. Performance monitoring integration

## Migration Notes

### No Breaking Changes
- All existing API endpoints remain unchanged
- Authentication flow is identical
- No database migrations required for frontend/mobile

### Backward Compatibility
- Old frontend/mobile versions will continue to work
- New security features enhance but don't break existing functionality
- Rate limiting is graceful with proper error responses

## Implementation Steps

1. **Phase 1**: Update error handling for rate limiting and security violations
2. **Phase 2**: Add health check integration
3. **Phase 3**: Implement session monitoring enhancements
4. **Phase 4**: Add performance and security monitoring

The backend infrastructure improvements are designed to be fully backward compatible. Frontend and mobile apps will continue to work without any updates, but implementing the suggested enhancements will provide better user experience and monitoring capabilities.
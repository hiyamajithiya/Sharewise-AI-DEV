# ShareWise AI - API Documentation

This document provides a comprehensive overview of all available API endpoints in the ShareWise AI trading platform.

## Base URL
```
Local Development: http://localhost:8000/api/
Production: https://your-domain.com/api/
```

## Authentication
All protected endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Reference

### 🔐 Authentication & Users (`/auth/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| POST | `/auth/register/` | Register new user | None |
| POST | `/auth/verify-email/` | Verify email address | None |
| POST | `/auth/resend-verification/` | Resend verification email | None |
| POST | `/auth/login/` | User login | None |
| POST | `/auth/logout/` | User logout | Required |
| POST | `/auth/token/refresh/` | Refresh JWT token | Required |
| GET | `/auth/profile/` | Get user profile | Required |
| PUT | `/auth/profile/update/` | Update user profile | Required |
| GET | `/auth/roles/` | Get user roles | Required |
| POST | `/auth/roles/test/` | Test role permissions | Required |
| GET | `/auth/system/info/` | Get system info | Required |

**Admin Only Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/admin/all-users/` | Get all users |
| POST | `/auth/admin/create-user/` | Create new user |

### 📈 Trading (`/trading/`)

#### Core Trading
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/trading/signals/` | List trading signals | Required |
| POST | `/trading/signals/` | Create trading signal | Required |
| GET | `/trading/signals/{id}/` | Get signal details | Required |
| GET | `/trading/orders/` | List trading orders | Required |
| POST | `/trading/orders/` | Create trading order | Required |
| GET | `/trading/orders/{id}/` | Get order details | Required |
| GET | `/trading/dashboard/` | Trading dashboard | Required |
| GET | `/trading/performance/` | Performance metrics | Required |

#### F&O Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trading/fo-instruments/` | F&O instruments |
| GET | `/trading/option-chain/{symbol}/` | Option chain data |
| GET | `/trading/futures-chain/{symbol}/` | Futures chain data |
| POST | `/trading/margin-calculator/` | Calculate margin |
| GET | `/trading/fo-positions/` | F&O positions |
| GET | `/trading/underlyings/` | Underlying assets |
| GET | `/trading/expiry-dates/{symbol}/` | Expiry dates |

#### Trading Automation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trading/strategies/` | Trading strategies |
| POST | `/trading/strategies/` | Create strategy |
| GET | `/trading/automation/dashboard/` | Automation dashboard |
| GET | `/trading/automation/stats/` | Automation statistics |
| POST | `/trading/automation/process-signal/` | Process trading signal |

#### Market Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trading/market/generate-signals/` | Generate market signals |
| POST | `/trading/market/generate-signal/` | Generate single signal |
| GET | `/trading/market/sentiment/` | Market sentiment |
| GET | `/trading/market/analysis/{symbol}/` | Market data analysis |
| GET | `/trading/market/popular-symbols/` | Popular symbols |
| POST | `/trading/market/backtest/` | Backtest strategy |

#### Reports & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trading/reports/performance/` | Performance report |
| GET | `/trading/reports/strategy/{id}/` | Strategy performance |
| GET | `/trading/reports/portfolio-analytics/` | Portfolio analytics |
| GET | `/trading/reports/monthly-performance/` | Monthly performance |
| GET | `/trading/reports/trade-history/` | Trade history export |
| GET | `/trading/reports/risk-analysis/` | Risk analysis |

#### Subscription & Limits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trading/subscription/status/` | Subscription status |
| GET | `/trading/subscription/usage-analytics/` | Usage analytics |
| POST | `/trading/subscription/check-limit/` | Check usage limits |
| POST | `/trading/subscription/simulate-upgrade/` | Simulate upgrade |

### 📊 Market Data (`/market-data/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/market-data/quote/{symbol}/` | Live quote | Required |
| POST | `/market-data/quotes/bulk/` | Bulk quotes | Required |
| GET | `/market-data/option-chain/{symbol}/` | Option chain | Required |
| POST | `/market-data/subscribe/` | Subscribe to symbols | Required |
| GET | `/market-data/search/` | Search symbols | Required |
| GET | `/market-data/market-status/` | Market status | Required |

**ViewSets:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/market-data/api-config/` | NSE API configuration |
| GET/POST | `/market-data/subscriptions/` | Data subscriptions |
| GET/POST | `/market-data/live-data/` | Live market data |
| GET/POST | `/market-data/websocket-connections/` | WebSocket connections |

### 🤖 AI Studio (`/ai-studio/`)

#### Core AI Features
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/ai-studio/dashboard/` | AI Studio dashboard | Required |
| GET | `/ai-studio/features/` | Available features | Required |
| GET | `/ai-studio/system/status/` | System status | Required |

**ViewSets:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/ai-studio/models/` | ML models |
| GET/POST/PUT/DELETE | `/ai-studio/reviews/` | Model reviews |

#### Training & Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-studio/training-jobs/` | Training jobs |
| GET | `/ai-studio/training-jobs/{id}/` | Job details |
| GET | `/ai-studio/training-jobs/{id}/progress/` | Training progress |
| POST | `/ai-studio/training-jobs/{id}/cancel/` | Cancel training |
| POST | `/ai-studio/celery/train/{id}/` | Start Celery training |

#### F&O AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-studio/fno/strategies/` | F&O strategies |
| GET | `/ai-studio/fno/instruments/` | F&O instruments |
| GET | `/ai-studio/fno/model-types/` | F&O model types |
| POST | `/ai-studio/fno/create-model/` | Create F&O model |
| GET | `/ai-studio/fno/performance-metrics/` | Performance metrics |
| POST | `/ai-studio/fno/backtest/{id}/` | Backtest strategy |

#### Model Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-studio/models/{id}/test/` | Test model |
| POST | `/ai-studio/models/{id}/deploy/` | Deploy model |
| POST | `/ai-studio/models/{id}/predict/` | Predict with model |
| GET | `/ai-studio/models/{id}/monitor/` | Monitor model |
| GET | `/ai-studio/models/{id}/health/` | Model health |

#### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-studio/marketplace/` | Model marketplace |
| POST | `/ai-studio/marketplace/lease/{id}/` | Lease model |
| GET | `/ai-studio/my-leases/` | My model leases |

### 💼 Portfolio Management (`/portfolios/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/portfolios/` | Get portfolio | Required |
| GET | `/portfolios/holdings/` | Get holdings | Required |
| GET | `/portfolios/history/` | Portfolio history | Required |

### 🏦 Broker Integration (`/brokers/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/brokers/accounts/` | Broker accounts | Required |
| POST | `/brokers/accounts/` | Add broker account | Required |
| GET | `/brokers/accounts/{id}/` | Account details | Required |
| POST | `/brokers/test-connection/` | Test connection | Required |
| GET | `/brokers/dashboard/` | Broker dashboard | Required |
| GET | `/brokers/supported-brokers/` | Supported brokers | Required |
| GET | `/brokers/portfolio/aggregated/` | Aggregated portfolio | Required |

### 📋 Audit & Compliance (`/audit/api/`)

**ViewSets:**
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET/POST | `/audit/api/events/` | Audit events | Admin |
| GET/POST | `/audit/api/data-access/` | Data access logs | Admin |
| GET/POST | `/audit/api/security/` | Security events | Admin |
| GET/POST | `/audit/api/compliance/` | Compliance reports | Admin |
| GET/POST | `/audit/api/configuration/` | Audit configuration | Admin |

### 🛠 System Configuration (`/system-config/`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|---------------|
| GET | `/system-config/health/` | Health check | None |
| GET | `/system-config/health/detailed/` | Detailed health check | Admin |
| GET | `/system-config/health/redis/` | Redis health check | Admin |
| GET | `/system-config/health/celery/` | Celery health check | Admin |
| GET | `/system-config/health/infrastructure/` | Infrastructure health | Admin |
| GET | `/system-config/security/monitoring/` | Security monitoring | Admin |
| GET | `/system-config/metrics/` | System metrics | Admin |
| POST | `/system-config/admin/clear-cache/` | Clear Redis cache | Admin |

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

- **Authentication endpoints**: 5 requests per 5 minutes
- **Trading endpoints**: 100 requests per minute
- **Market data endpoints**: 200 requests per minute
- **AI Studio endpoints**: 10 requests per minute

## WebSocket Endpoints

- **Trading Signals**: `ws://localhost:8000/ws/trading/signals/`
- **Market Data**: `ws://localhost:8000/ws/market-data/live/`
- **Portfolio Updates**: `ws://localhost:8000/ws/portfolios/updates/`

## SDK and Libraries

- **Python SDK**: Available for backend integration
- **JavaScript SDK**: Available for frontend integration
- **API Client Libraries**: Support for multiple programming languages

---

For detailed examples and interactive API testing, visit the Swagger UI at:
**http://localhost:8000/api/schema/swagger-ui/**
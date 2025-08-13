# ShareWise AI - System Architecture

## High-Level Architecture

ShareWise AI follows a microservices-inspired modular monolith architecture with clear separation of concerns and scalable design patterns.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile PWA    │    │  Admin Portal   │
│     (React)     │    │     (React)     │    │     (React)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │      Load Balancer      │
                    │       (Nginx)           │
                    └─────────────┬───────────┘
                                  │
          ┌───────────────────────────────────────────────────────┐
          │                Django Backend                         │
          ├─────────────────┬─────────────────┬─────────────────┤
          │   REST API      │   WebSockets    │   Admin Panel   │
          │     (DRF)       │   (Channels)    │    (Django)     │
          └─────────────────┴─────────────────┴─────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────────────┐
          │                       │                               │
    ┌─────────────┐    ┌─────────────────┐              ┌─────────────┐
    │ PostgreSQL  │    │ Redis (Cache +  │              │   Celery    │
    │  Database   │    │ Session Store)  │              │ (Background │
    └─────────────┘    └─────────────────┘              │   Tasks)    │
                                                         └─────────────┘
                                  │
          ┌───────────────────────────────────────────────────────┐
          │              External Integrations                    │
          ├─────────────┬─────────────┬─────────────┬─────────────┤
          │   Zerodha   │  AngelOne   │   Upstox    │   Market    │
          │    API      │     API     │    API      │  Data APIs  │
          └─────────────┴─────────────┴─────────────┴─────────────┘
```

## Backend Architecture (Django)

### Application Structure

```
backend/
├── config/                     # Django project settings
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py            # Common settings
│   │   ├── development.py     # Dev environment
│   │   ├── production.py      # Prod environment
│   │   └── testing.py         # Test environment
│   ├── urls.py                # Root URL configuration
│   ├── wsgi.py               # WSGI application
│   └── asgi.py               # ASGI application (WebSockets)
├── apps/                      # Django applications
│   ├── __init__.py
│   ├── authentication/        # JWT, OAuth2, 2FA
│   ├── users/                # User management
│   ├── brokers/              # Broker integrations
│   ├── trading/              # Trading engine
│   ├── strategies/           # Strategy management
│   ├── portfolios/           # Portfolio tracking
│   ├── analytics/            # Market analysis & ML
│   ├── notifications/        # Alerts system
│   ├── subscriptions/        # SaaS billing
│   └── admin_portal/         # Admin interfaces
├── core/                     # Shared utilities
│   ├── __init__.py
│   ├── exceptions.py         # Custom exceptions
│   ├── permissions.py        # Custom permissions
│   ├── utils.py             # Utility functions
│   ├── mixins.py            # Model/View mixins
│   └── validators.py        # Custom validators
├── requirements/             # Dependencies
│   ├── base.txt             # Common requirements
│   ├── development.txt      # Dev requirements
│   └── production.txt       # Prod requirements
└── tests/                   # Test suites
    ├── __init__.py
    ├── conftest.py         # pytest configuration
    ├── factories.py        # Test data factories
    └── integration/        # Integration tests
```

### Key Design Patterns

#### 1. Repository Pattern
```python
# Example: TradingSignalRepository
class TradingSignalRepository:
    def __init__(self):
        self.model = TradingSignal
    
    def create_signal(self, signal_data: dict) -> TradingSignal:
        return self.model.objects.create(**signal_data)
    
    def get_user_signals(self, user_id: UUID, limit: int = 100) -> QuerySet:
        return self.model.objects.filter(
            user_id=user_id
        ).order_by('-timestamp')[:limit]
    
    def get_pending_signals(self) -> QuerySet:
        return self.model.objects.filter(
            executed=False,
            valid_until__gt=timezone.now()
        )
```

#### 2. Service Layer Pattern
```python
# Example: TradingService
class TradingService:
    def __init__(self):
        self.signal_repo = TradingSignalRepository()
        self.order_service = OrderService()
        self.portfolio_service = PortfolioService()
    
    def process_signal(self, signal_id: UUID) -> Dict:
        signal = self.signal_repo.get_by_id(signal_id)
        
        # Validate signal
        if not self._validate_signal(signal):
            return {'status': 'invalid', 'reason': 'Signal validation failed'}
        
        # Check risk limits
        if not self._check_risk_limits(signal):
            return {'status': 'rejected', 'reason': 'Risk limits exceeded'}
        
        # Execute trade
        order_result = self.order_service.place_order(signal)
        
        # Update portfolio
        if order_result['status'] == 'success':
            self.portfolio_service.update_holdings(signal.user_id, signal)
        
        return order_result
```

#### 3. Factory Pattern for Broker APIs
```python
class BrokerAPIFactory:
    @staticmethod
    def get_broker_api(broker_name: str) -> BaseBrokerAPI:
        broker_apis = {
            'zerodha': ZerodhaAPI,
            'angelone': AngelOneAPI,
            'upstox': UpstoxAPI,
        }
        
        if broker_name not in broker_apis:
            raise ValueError(f"Unsupported broker: {broker_name}")
        
        return broker_apis[broker_name]()
```

## Frontend Architecture (React)

### Component Structure

```
frontend/src/
├── components/               # Reusable UI components
│   ├── common/              # Generic components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── Chart/
│   ├── trading/             # Trading-specific components
│   │   ├── SignalCard/
│   │   ├── OrderForm/
│   │   └── PortfolioSummary/
│   └── admin/               # Admin components
├── pages/                   # Page components
│   ├── Dashboard/
│   ├── Trading/
│   ├── Portfolio/
│   ├── Strategies/
│   └── Settings/
├── hooks/                   # Custom React hooks
│   ├── useAuth.js
│   ├── useWebSocket.js
│   ├── useApi.js
│   └── useLocalStorage.js
├── services/                # API services
│   ├── api.js              # Axios configuration
│   ├── authService.js      # Authentication
│   ├── tradingService.js   # Trading operations
│   └── portfolioService.js # Portfolio operations
├── store/                   # State management
│   ├── index.js            # Store configuration
│   ├── authSlice.js        # Authentication state
│   ├── tradingSlice.js     # Trading state
│   └── portfolioSlice.js   # Portfolio state
├── utils/                   # Utility functions
│   ├── formatters.js       # Data formatting
│   ├── validators.js       # Form validation
│   └── constants.js        # App constants
└── styles/                  # Global styles
    ├── globals.css
    ├── variables.css
    └── components.css
```

### State Management Architecture

```javascript
// Redux Toolkit structure
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trading: tradingSlice.reducer,
    portfolio: portfolioSlice.reducer,
    notifications: notificationsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(websocketMiddleware),
});
```

## Real-time Communication

### WebSocket Architecture

```python
# Django Channels consumer
class TradingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.room_group_name = f"user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def send_signal_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'signal_update',
            'data': event['data']
        }))
```

## Background Tasks (Celery)

### Task Organization

```python
# Celery task structure
@app.task(bind=True, max_retries=3)
def process_market_data(self, symbol, timeframe):
    try:
        # Fetch market data
        market_data = fetch_market_data(symbol, timeframe)
        
        # Process technical indicators
        indicators = calculate_technical_indicators(market_data)
        
        # Store in database
        store_market_data(symbol, market_data, indicators)
        
        # Trigger strategy evaluation
        evaluate_strategies_for_symbol.delay(symbol)
        
    except Exception as exc:
        self.retry(countdown=60, exc=exc)

@app.task
def evaluate_strategies_for_symbol(symbol):
    # Get all active strategies
    strategies = Strategy.objects.filter(is_active=True)
    
    for strategy in strategies:
        # Evaluate strategy conditions
        signals = strategy_engine.evaluate(strategy, symbol)
        
        for signal in signals:
            # Create trading signal
            create_trading_signal.delay(signal.to_dict())

@app.task
def execute_pending_orders():
    # Get pending orders
    pending_orders = Order.objects.filter(status='PENDING')
    
    for order in pending_orders:
        # Execute order via broker API
        broker_api = BrokerAPIFactory.get_broker_api(order.broker_name)
        result = broker_api.place_order(order)
        
        # Update order status
        order.update_from_broker_response(result)
```

## Security Architecture

### Authentication Flow

1. **User Login** → JWT Token Generation
2. **Token Validation** → Every API request
3. **Broker OAuth** → Secure token storage
4. **2FA Integration** → TOTP/SMS verification

### Data Protection

```python
# Encryption utilities
class DataEncryption:
    @staticmethod
    def encrypt_broker_token(token: str, user_id: UUID) -> str:
        # Use Fernet encryption with user-specific key
        key = derive_key_from_user_id(user_id)
        f = Fernet(key)
        return f.encrypt(token.encode()).decode()
    
    @staticmethod
    def decrypt_broker_token(encrypted_token: str, user_id: UUID) -> str:
        key = derive_key_from_user_id(user_id)
        f = Fernet(key)
        return f.decrypt(encrypted_token.encode()).decode()
```

## Monitoring & Observability

### Health Checks

```python
# Health check endpoints
class HealthCheckView(APIView):
    def get(self, request):
        checks = {
            'database': self.check_database(),
            'redis': self.check_redis(),
            'celery': self.check_celery(),
            'broker_apis': self.check_broker_apis(),
        }
        
        status = 'healthy' if all(checks.values()) else 'unhealthy'
        return Response({'status': status, 'checks': checks})
```

### Performance Monitoring

- **Database Query Optimization**: Django Debug Toolbar in development
- **API Response Times**: Custom middleware for logging
- **Memory Usage**: Regular monitoring of Django processes
- **Celery Queue Monitoring**: Redis-based queue length monitoring

## Scalability Considerations

1. **Database**: Read replicas for analytics queries
2. **Caching**: Redis for frequently accessed data
3. **Background Tasks**: Celery horizontal scaling
4. **API Rate Limiting**: Django REST Framework throttling
5. **CDN**: Static asset delivery optimization
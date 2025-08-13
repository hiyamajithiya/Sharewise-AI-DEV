# ShareWise AI - Database Schema

## Database Design Overview

The ShareWise AI platform uses PostgreSQL as the primary database with a multi-tenant SaaS architecture. The schema is designed to support multiple user roles, broker integrations, and comprehensive trading data management.

## Core Tables

### 1. User Management

#### users_customuser
```sql
CREATE TABLE users_customuser (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    phone_number VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    role VARCHAR(20) DEFAULT 'USER',  -- USER, SALES, SUPPORT, SUPER_ADMIN
    subscription_tier VARCHAR(20) DEFAULT 'FREE',  -- FREE, PRO, ELITE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### users_userprofile
```sql
CREATE TABLE users_userprofile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    risk_tolerance VARCHAR(20) DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH
    max_daily_loss DECIMAL(12,2) DEFAULT 10000.00,
    preferred_brokers JSONB DEFAULT '[]',
    trading_preferences JSONB DEFAULT '{}',
    kyc_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Broker Integration

#### brokers_broker
```sql
CREATE TABLE brokers_broker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,  -- Zerodha, AngelOne, Upstox
    display_name VARCHAR(100),
    api_base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    supported_segments JSONB DEFAULT '[]',  -- EQ, FO, CD, etc.
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### brokers_userbrokeraccount
```sql
CREATE TABLE brokers_userbrokeraccount (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    broker_id UUID REFERENCES brokers_broker(id) ON DELETE CASCADE,
    broker_user_id VARCHAR(100),
    api_key VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, broker_id)
);
```

### 3. Trading Signals (Based on AI_Signal_Log_Structure.docx)

#### trading_signal
```sql
CREATE TABLE trading_signal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    symbol VARCHAR(50) NOT NULL,  -- NIFTY, RELIANCE, etc.
    strategy_name VARCHAR(100) NOT NULL,
    signal_type VARCHAR(10) NOT NULL,  -- BUY, SELL, SHORT, COVER
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    entry_price DECIMAL(12,2) NOT NULL,
    target_price DECIMAL(12,2),
    stop_loss DECIMAL(12,2),
    valid_until TIMESTAMP WITH TIME ZONE,
    backtest_result JSONB DEFAULT '{}',  -- win-rate, avg_return, etc.
    executed BOOLEAN DEFAULT FALSE,
    executed_price DECIMAL(12,2),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    created_by_strategy_id UUID,  -- References to strategy that generated this
    market_data JSONB DEFAULT '{}',  -- Technical indicators, news sentiment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Trading Execution

#### trading_order
```sql
CREATE TABLE trading_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID REFERENCES trading_signal(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    broker_account_id UUID REFERENCES brokers_userbrokeraccount(id) ON DELETE CASCADE,
    broker_order_id VARCHAR(100),
    symbol VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL,  -- MARKET, LIMIT, SL, SL-M
    transaction_type VARCHAR(10) NOT NULL,  -- BUY, SELL
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2),
    trigger_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, OPEN, COMPLETE, CANCELLED, REJECTED
    filled_quantity INTEGER DEFAULT 0,
    average_price DECIMAL(12,2),
    order_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exchange_timestamp TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    fees DECIMAL(10,2) DEFAULT 0.00,
    taxes DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Portfolio Management

#### portfolios_portfolio
```sql
CREATE TABLE portfolios_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'Default Portfolio',
    total_value DECIMAL(15,2) DEFAULT 0.00,
    available_cash DECIMAL(15,2) DEFAULT 0.00,
    invested_amount DECIMAL(15,2) DEFAULT 0.00,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
    realized_pnl DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### portfolios_holding
```sql
CREATE TABLE portfolios_holding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios_portfolio(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    average_price DECIMAL(12,2) NOT NULL,
    current_price DECIMAL(12,2),
    last_price_update TIMESTAMP WITH TIME ZONE,
    unrealized_pnl DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);
```

### 6. Strategy Management

#### strategies_strategy
```sql
CREATE TABLE strategies_strategy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    strategy_type VARCHAR(50),  -- TECHNICAL, FUNDAMENTAL, HYBRID, ML
    parameters JSONB DEFAULT '{}',
    entry_conditions JSONB DEFAULT '{}',
    exit_conditions JSONB DEFAULT '{}',
    risk_management JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    backtest_results JSONB DEFAULT '{}',
    live_performance JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Market Data

#### analytics_marketdata
```sql
CREATE TABLE analytics_marketdata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open_price DECIMAL(12,2),
    high_price DECIMAL(12,2),
    low_price DECIMAL(12,2),
    close_price DECIMAL(12,2),
    volume BIGINT,
    timeframe VARCHAR(10),  -- 1m, 5m, 15m, 1h, 1d
    technical_indicators JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timestamp, timeframe)
);
```

### 8. Notifications & Alerts

#### notifications_notification
```sql
CREATE TABLE notifications_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),  -- SIGNAL, ORDER, PORTFOLIO, SYSTEM
    priority VARCHAR(10) DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, URGENT
    is_read BOOLEAN DEFAULT FALSE,
    delivery_methods JSONB DEFAULT '[]',  -- email, sms, push, in_app
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. AI Model Studio

#### ai_studio_mlmodel
```sql
CREATE TABLE ai_studio_mlmodel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL,  -- CLASSIFICATION, REGRESSION, TIME_SERIES
    algorithm VARCHAR(50),  -- RANDOM_FOREST, XGBOOST, LSTM, etc.
    target_variable VARCHAR(100),
    features JSONB DEFAULT '[]',
    hyperparameters JSONB DEFAULT '{}',
    training_config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'DRAFT',  -- DRAFT, TRAINING, COMPLETED, FAILED, PUBLISHED, ARCHIVED
    file_path VARCHAR(500),
    model_size BIGINT,
    performance_metrics JSONB DEFAULT '{}',
    backtest_results JSONB DEFAULT '{}',
    feature_importance JSONB DEFAULT '{}',
    shap_values JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    total_downloads INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ai_studio_trainingjob
```sql
CREATE TABLE ai_studio_trainingjob (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_studio_mlmodel(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    job_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    progress INTEGER DEFAULT 0,  -- 0-100
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    compute_hours DECIMAL(8,4) DEFAULT 0.0000,
    error_message TEXT,
    logs JSONB DEFAULT '[]',
    training_metrics JSONB DEFAULT '{}',
    validation_metrics JSONB DEFAULT '{}',
    resource_usage JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ai_studio_modellease
```sql
CREATE TABLE ai_studio_modellease (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_studio_mlmodel(id) ON DELETE CASCADE,
    lessor_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    lessee_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    lease_type VARCHAR(30) DEFAULT 'MONTHLY',  -- MONTHLY, QUARTERLY, ANNUAL
    price DECIMAL(10,2) NOT NULL,
    performance_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT FALSE,
    usage_stats JSONB DEFAULT '{}',
    total_signals_generated INTEGER DEFAULT 0,
    total_profit_shared DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ai_studio_modelreview
```sql
CREATE TABLE ai_studio_modelreview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_studio_mlmodel(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_id, reviewer_id)
);
```

#### ai_studio_computeusage
```sql
CREATE TABLE ai_studio_computeusage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    training_job_id UUID REFERENCES ai_studio_trainingjob(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    compute_hours DECIMAL(8,4) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    resource_type VARCHAR(50),  -- CPU, GPU, TPU
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, usage_date, training_job_id)
);
```

### 10. Strategy Marketplace

#### ai_studio_marketplacelisting
```sql
CREATE TABLE ai_studio_marketplacelisting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ai_studio_mlmodel(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),  -- MOMENTUM, MEAN_REVERSION, ARBITRAGE, etc.
    asset_classes JSONB DEFAULT '[]',  -- EQUITY, FX, CRYPTO, etc.
    pricing_model VARCHAR(30) DEFAULT 'FIXED',  -- FIXED, PERFORMANCE_BASED, TIERED
    monthly_price DECIMAL(10,2),
    performance_fee_rate DECIMAL(5,2),
    minimum_subscription_period INTEGER DEFAULT 1,  -- months
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    total_subscribers INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(12,2) DEFAULT 0.00,
    sample_signals JSONB DEFAULT '[]',
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. SaaS Management

#### subscriptions_subscription
```sql
CREATE TABLE subscriptions_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_customuser(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    amount DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    features JSONB DEFAULT '{}',
    usage_limits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes and Performance

```sql
-- Performance indexes
CREATE INDEX idx_trading_signal_user_timestamp ON trading_signal(user_id, timestamp DESC);
CREATE INDEX idx_trading_signal_symbol_timestamp ON trading_signal(symbol, timestamp DESC);
CREATE INDEX idx_trading_order_user_status ON trading_order(user_id, status);
CREATE INDEX idx_marketdata_symbol_timeframe_timestamp ON analytics_marketdata(symbol, timeframe, timestamp DESC);
CREATE INDEX idx_notifications_user_created ON notifications_notification(user_id, created_at DESC);

-- AI Studio indexes
CREATE INDEX idx_mlmodel_user_status ON ai_studio_mlmodel(user_id, status);
CREATE INDEX idx_mlmodel_published ON ai_studio_mlmodel(is_published, published_at DESC);
CREATE INDEX idx_trainingjob_user_status ON ai_studio_trainingjob(user_id, status);
CREATE INDEX idx_trainingjob_model_created ON ai_studio_trainingjob(model_id, created_at DESC);
CREATE INDEX idx_modellease_lessee_active ON ai_studio_modellease(lessee_id, is_active);
CREATE INDEX idx_marketplacelisting_active_featured ON ai_studio_marketplacelisting(is_active, is_featured);
CREATE INDEX idx_computeusage_user_date ON ai_studio_computeusage(user_id, usage_date DESC);

-- Unique constraints
CREATE UNIQUE INDEX idx_unique_active_subscription ON subscriptions_subscription(user_id) 
WHERE is_active = TRUE;
```

## Data Relationships

1. **User → Broker Accounts**: One-to-many relationship
2. **User → Trading Signals**: One-to-many relationship  
3. **Signal → Orders**: One-to-many relationship
4. **User → Portfolio**: One-to-many relationship
5. **Portfolio → Holdings**: One-to-many relationship
6. **User → Strategies**: One-to-many relationship
7. **Strategy → Signals**: One-to-many relationship
8. **User → ML Models**: One-to-many relationship
9. **ML Model → Training Jobs**: One-to-many relationship
10. **ML Model → Model Leases**: One-to-many relationship
11. **ML Model → Model Reviews**: One-to-many relationship
12. **User → Compute Usage**: One-to-many relationship
13. **ML Model → Marketplace Listing**: One-to-one relationship

## Data Retention Policy

- **Market Data**: Keep 5 years of historical data
- **Trading Signals**: Keep all signals with archive after 2 years
- **Orders**: Keep all order data permanently for compliance
- **Notifications**: Archive after 6 months
- **Audit Logs**: Keep permanently for regulatory compliance
- **ML Models**: Keep published models permanently, archive draft models after 1 year
- **Training Jobs**: Keep completed jobs for 2 years, failed jobs for 6 months
- **Model Performance Data**: Keep all performance metrics permanently
- **Compute Usage**: Keep all usage data permanently for billing compliance
- **Marketplace Reviews**: Keep all reviews permanently

## Backup Strategy

- **Daily**: Automated PostgreSQL backups
- **Weekly**: Full database backup with point-in-time recovery
- **Monthly**: Archive backups to cloud storage
- **Real-time**: WAL-E for continuous archiving
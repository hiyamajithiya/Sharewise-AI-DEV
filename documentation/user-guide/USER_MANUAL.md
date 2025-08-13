# ShareWise AI - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Broker Integration](#broker-integration)
4. [Trading Dashboard](#trading-dashboard)
5. [AI Model Studio](#ai-model-studio)
6. [Strategy Marketplace](#strategy-marketplace)
7. [Strategy Management](#strategy-management)
8. [Portfolio Tracking](#portfolio-tracking)
9. [Risk Management](#risk-management)
10. [Notifications & Alerts](#notifications--alerts)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 13+ or Android 8+
- **Internet**: Stable internet connection required for real-time trading

### First Login
1. Visit the ShareWise AI platform
2. Enter your registered email and password
3. Complete 2FA verification (if enabled)
4. You'll be redirected to the main dashboard

---

## Account Setup

### Profile Configuration
1. **Navigate to Settings** → **Profile**
2. **Complete Required Information**:
   - PAN Number (required for trading)
   - Phone Number (for SMS alerts)
   - Risk Tolerance Level (Conservative, Moderate, Aggressive)

### KYC Verification
1. **Upload Documents**:
   - PAN Card (clear, readable image)
   - Aadhaar Card or Passport
   - Bank Statement (last 3 months)
2. **Verification Process**: 24-48 hours
3. **Status Updates**: Check email for verification status

### Subscription Management
1. **View Current Plan**: Settings → Subscription
2. **Upgrade Plans**:
   - **Free**: ₹0/month - Basic dashboard, 3 pre-built strategies, 10 AI training hours
   - **Pro**: ₹2,999/month - AI Model Studio access, 100 training hours, marketplace publishing
   - **Elite**: ₹9,999/month - Advanced AI features, 500 training hours, priority support, custom integrations

---

## Broker Integration

### Supported Brokers
- **Zerodha** (Kite Connect)
- **Angel One** (SmartAPI) 
- **Upstox** (Developer API)

### Connecting Your Broker Account

#### Zerodha Setup
1. **Navigate to**: Settings → Broker Accounts
2. **Click**: "Connect Zerodha"
3. **Login**: Use your Zerodha credentials
4. **Authorize**: Grant trading permissions
5. **Verify**: Account will show as "Connected"

#### Angel One Setup
1. **Prerequisites**: Enable API trading in Angel One account
2. **Connect**: Follow similar OAuth flow
3. **API Key**: System automatically manages tokens

#### Upstox Setup
1. **Enable API**: Contact Upstox support first
2. **Connect**: Through platform interface
3. **Verification**: Real-time balance sync confirms connection

### Managing Multiple Brokers
- **Primary Broker**: Set your preferred broker for new trades
- **Backup Brokers**: System can failover if primary is down
- **Balance Sync**: Real-time synchronization across all accounts

---

## Trading Dashboard

### Dashboard Overview
The main trading dashboard provides:
- **Live Portfolio Value**
- **Today's P&L**
- **Active Positions**
- **Recent Signals**
- **Market Overview**

### Market Watch
1. **Add Symbols**: Click "+" to add stocks to watchlist
2. **Real-time Prices**: Live price updates every second
3. **Quick Actions**: Buy/Sell buttons for instant trading
4. **Technical Indicators**: RSI, MACD, EMA overlays

### Signal Feed
- **Live Signals**: AI-generated buy/sell recommendations
- **Signal Details**:
  - Entry Price
  - Target Price  
  - Stop Loss
  - Confidence Score (0-100%)
  - Strategy Name
- **One-Click Trading**: Execute signals instantly

### Order Management
1. **Active Orders**: View pending/partially filled orders
2. **Order History**: Complete trade history with filters
3. **Modify Orders**: Change price/quantity of pending orders
4. **Cancel Orders**: Cancel pending orders instantly

---

## AI Model Studio

### Overview
The AI Model Studio is a powerful platform that allows users to create, train, and deploy custom machine learning models for algorithmic trading. Build your own AI strategies using advanced ML algorithms and deploy them for automated trading.

### Getting Started with AI Studio

#### Access Requirements
- **Pro Subscription or higher** required for AI Studio access
- **Minimum data history**: 6 months required for model training
- **Computing resources**: Training jobs may take 1-6 hours depending on model complexity

#### Studio Dashboard
Navigate to **AI Studio** from the main menu to access:
- **Model Performance Overview**: Real-time metrics of your deployed models
- **Training Queue**: Current and completed training jobs
- **Recent Activity**: Latest model updates and marketplace interactions
- **Resource Usage**: Current computing credits and limits

### Creating ML Models

#### Model Types Available
1. **Classification Models**:
   - Predict buy/sell/hold signals
   - Multi-class signal strength (Strong Buy, Buy, Hold, Sell, Strong Sell)
   - Market regime classification (Bull, Bear, Sideways)

2. **Regression Models**:
   - Price prediction models
   - Volatility forecasting
   - Returns estimation

3. **Time Series Models**:
   - LSTM networks for sequential data
   - ARIMA variants
   - Prophet-based forecasting

4. **Ensemble Models**:
   - Random Forest classifiers
   - Gradient Boosting models
   - Voting classifiers

#### Data Sources and Features
**Available Data**:
- **OHLC Price Data**: Historical price information
- **Volume Data**: Trading volume patterns
- **Technical Indicators**: RSI, MACD, Bollinger Bands, etc.
- **Market Microstructure**: Bid-ask spreads, order book data
- **News Sentiment**: AI-processed news sentiment scores
- **Economic Indicators**: GDP, inflation, interest rates

**Feature Engineering**:
- **Automatic Feature Generation**: System creates technical indicators
- **Custom Features**: Define your own calculated fields
- **Feature Selection**: AI-powered feature importance ranking
- **Lag Variables**: Include historical values as predictors

#### Model Training Process
1. **Data Selection**:
   - Choose symbols and date range
   - Select relevant features
   - Set training/validation/test splits

2. **Model Configuration**:
   - Choose model type and hyperparameters
   - Set cross-validation strategy
   - Define evaluation metrics

3. **Training Job Submission**:
   - Jobs processed in background using Celery
   - Receive notifications on completion
   - Monitor progress in real-time

4. **Model Evaluation**:
   - Comprehensive performance metrics
   - Out-of-sample backtesting results
   - Feature importance analysis

### Model Performance Metrics

#### Classification Metrics
- **Accuracy**: Overall prediction correctness
- **Precision**: True positive rate
- **Recall**: Sensitivity to positive signals
- **F1-Score**: Balanced precision-recall measure
- **ROC-AUC**: Area under ROC curve
- **Confusion Matrix**: Detailed prediction breakdown

#### Financial Metrics
- **Sharpe Ratio**: Risk-adjusted returns
- **Sortino Ratio**: Downside deviation adjusted returns
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Calmar Ratio**: Return vs maximum drawdown
- **Information Ratio**: Excess return vs tracking error
- **Alpha/Beta**: Market-adjusted performance

#### Advanced Analytics
- **Walk-Forward Analysis**: Rolling window backtesting
- **Monte Carlo Simulation**: Risk scenario testing
- **Stress Testing**: Performance under extreme conditions
- **Regime Analysis**: Performance across different market conditions

### Explainable AI (XAI)

#### Understanding Model Decisions
The platform provides **SHAP (SHapley Additive exPlanations)** integration to help you understand:

1. **Feature Importance**: Which features drive predictions most
2. **Individual Predictions**: Why the model made specific predictions
3. **Model Behavior**: How the model responds to different inputs
4. **Feature Interactions**: How features work together

#### XAI Dashboard Features
- **SHAP Summary Plots**: Global feature importance
- **SHAP Waterfall Charts**: Individual prediction explanations
- **Partial Dependence Plots**: Feature-response relationships
- **SHAP Force Plots**: Interactive prediction breakdowns

### Model Management

#### Model Lifecycle
1. **Draft**: Model in development
2. **Training**: Currently being trained
3. **Completed**: Training finished successfully
4. **Failed**: Training encountered errors
5. **Published**: Available in marketplace
6. **Archived**: Retired models

#### Version Control
- **Model Versioning**: Track all model iterations
- **Performance Comparison**: Compare across versions
- **Rollback Capability**: Revert to previous versions
- **Change Logs**: Detailed modification history

#### Model Deployment
- **Paper Trading**: Test with virtual money first
- **Live Trading**: Deploy to real trading account
- **Risk Controls**: Automatic position sizing and risk management
- **Performance Monitoring**: Real-time tracking of live performance

### Computing Resources

#### Training Credits
- **Free Tier**: 10 training hours/month
- **Pro Tier**: 100 training hours/month
- **Elite Tier**: 500 training hours/month
- **Additional Credits**: Purchase extra hours as needed

#### Resource Management
- **Queue Priority**: Higher tiers get priority processing
- **Parallel Training**: Run multiple jobs simultaneously
- **Resource Optimization**: Automatic hyperparameter tuning
- **Cost Estimation**: Predict training costs before submission

---

## Strategy Marketplace

### Overview
The Strategy Marketplace allows users to publish, share, and monetize their AI models and trading strategies. Discover proven strategies from other traders or earn passive income by leasing your successful models.

### Publishing Models

#### Requirements for Publishing
- **Model Performance**: Minimum 6-month backtesting period
- **Out-of-sample Results**: Validated on unseen data
- **Risk Metrics**: Maximum drawdown < 20%
- **Sharpe Ratio**: Minimum 1.5 required
- **Model Documentation**: Comprehensive description required

#### Publishing Process
1. **Model Review**: Internal validation by our team
2. **Performance Verification**: Independent backtesting
3. **Documentation Check**: Ensure complete information
4. **Approval**: Model listed in marketplace
5. **Monitoring**: Ongoing performance tracking

#### Listing Information
- **Strategy Description**: Detailed explanation of approach
- **Performance Metrics**: Historical returns and risk stats
- **Asset Classes**: Supported symbols and markets
- **Subscription Tiers**: Pricing for different access levels
- **Sample Predictions**: Recent signal examples

### Discovering Models

#### Search and Filter Options
- **Performance Filters**: Sharpe ratio, returns, drawdown
- **Asset Class**: Equity, FX, crypto, commodities
- **Strategy Type**: Momentum, mean reversion, arbitrage
- **Time Horizon**: Intraday, swing, position trading
- **Risk Level**: Conservative, moderate, aggressive

#### Model Evaluation Tools
- **Detailed Analytics**: Comprehensive performance breakdown
- **Risk Analysis**: Drawdown periods, volatility analysis
- **Correlation Analysis**: How model correlates with market/other strategies
- **Sample Signals**: Recent predictions and outcomes
- **User Reviews**: Ratings and feedback from subscribers

### Leasing Models

#### Subscription Types
1. **Signal Only**: Receive buy/sell signals
2. **Strategy Copy**: Auto-copy trades to your account
3. **Model Access**: Use model in your own analysis
4. **Full License**: Commercial use rights

#### Pricing Models
- **Fixed Monthly**: Set monthly subscription fee
- **Performance Fee**: Percentage of profits generated
- **Tiered Pricing**: Different features at different price points
- **Revenue Sharing**: Split profits with model creator

#### Risk Management
- **Position Limits**: Maximum exposure per model
- **Correlation Limits**: Avoid over-concentration
- **Stop Loss Protection**: Automatic risk controls
- **Performance Monitoring**: Real-time tracking

### Revenue Generation

#### Earning Models
1. **Subscription Revenue**: Monthly fees from users
2. **Performance Fees**: Percentage of user profits
3. **One-time Licensing**: Sell model licenses
4. **Consultation**: Advisory services

#### Payment System
- **Automatic Payments**: Monthly subscription processing
- **Revenue Sharing**: 70% to creator, 30% platform fee
- **Payment Methods**: Bank transfer, UPI, crypto
- **Tax Documentation**: Automated 1099/tax forms

#### Success Tips
- **Clear Documentation**: Explain your strategy clearly
- **Consistent Performance**: Maintain steady returns
- **Risk Management**: Keep drawdowns minimal
- **User Support**: Respond to subscriber questions
- **Regular Updates**: Keep models current and relevant

### Marketplace Features

#### Rating System
- **5-Star Ratings**: User feedback on models
- **Detailed Reviews**: Written feedback and experiences
- **Verified Subscribers**: Only paying users can review
- **Response System**: Creators can respond to reviews

#### Community Features
- **Discussion Forums**: Strategy discussions and Q&A
- **Creator Profiles**: Background and track record
- **Following System**: Follow favorite creators
- **Notifications**: Updates on followed models

#### Quality Assurance
- **Performance Monitoring**: Continuous tracking of live results
- **Fraud Detection**: Identify curve-fitted or overfitted models
- **Quality Scores**: Algorithmic assessment of model quality
- **Compliance Checks**: Ensure regulatory compliance

---

## Strategy Management

### Pre-built Strategies
**Available Strategies**:
- **RSI Divergence**: Based on RSI overbought/oversold levels
- **MACD Crossover**: Signal line and histogram crossovers
- **Moving Average Trends**: EMA/SMA based trend following
- **Breakout Scanner**: Support/resistance breakouts
- **Mean Reversion**: Statistical mean reversion patterns

### Using Pre-built Strategies
1. **Browse Strategies**: Trading → Strategies
2. **View Performance**: Historical returns, win rate, drawdown
3. **Activate Strategy**: Toggle switch to enable/disable
4. **Customize Parameters**: Adjust RSI levels, MA periods, etc.

### Custom Strategy Builder
1. **Create New Strategy**: Click "Build Custom Strategy"
2. **Entry Conditions**:
   - Technical indicators (RSI, MACD, Bollinger Bands)
   - Price conditions (above/below MA)
   - Volume conditions (above average volume)
3. **Exit Conditions**:
   - Target profit percentage
   - Stop loss percentage
   - Time-based exits
4. **Position Sizing**: Fixed amount or percentage-based
5. **Backtest Strategy**: Test on historical data before going live

### Strategy Performance Metrics
- **Total Return**: Overall strategy performance
- **Win Rate**: Percentage of profitable trades
- **Average Win/Loss**: Average profit per winning/losing trade
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted returns
- **Calmar Ratio**: Return vs maximum drawdown

---

## Portfolio Tracking

### Portfolio Overview
- **Total Value**: Current portfolio worth
- **Available Cash**: Funds available for trading
- **Invested Amount**: Total money deployed
- **Unrealized P&L**: Paper gains/losses on open positions
- **Realized P&L**: Actual profits/losses from closed trades

### Holdings View
- **Current Positions**: All stocks you own
- **Quantity**: Number of shares held
- **Average Price**: Your average buying price
- **Current Price**: Real-time market price
- **P&L**: Profit/loss on each position
- **Allocation**: Percentage of portfolio per stock

### Performance Analytics
1. **Returns Chart**: Portfolio growth over time
2. **Sector Allocation**: Breakdown by industry sectors
3. **Top Performers**: Best and worst performing stocks
4. **Risk Metrics**: Portfolio volatility and beta

### Transaction History
- **Complete Trade Log**: All buy/sell transactions
- **Filter Options**: By date, symbol, strategy
- **Export Data**: Download CSV for tax reporting
- **Brokerage Summary**: Total fees and taxes paid

---

## Risk Management

### Setting Risk Limits
1. **Daily Loss Limit**: Maximum loss per day (₹ amount)
2. **Position Concentration**: Max % of portfolio per stock
3. **Maximum Positions**: Total number of concurrent positions
4. **Sector Limits**: Maximum exposure per sector

### Automatic Risk Controls
- **Stop Loss Orders**: Automatic exit if losses exceed limit
- **Profit Booking**: Take profits at predetermined levels
- **Position Sizing**: Kelly criterion-based position sizing
- **Correlation Limits**: Avoid over-concentration in correlated stocks

### Risk Monitoring Dashboard
- **Current Risk Exposure**: Real-time risk metrics
- **Risk-Reward Ratios**: For each active position
- **Portfolio Heat Map**: Visual risk concentration
- **Stress Testing**: Portfolio performance in different market scenarios

### Emergency Controls
- **Panic Button**: Close all positions immediately
- **Disable Trading**: Stop all automated trading
- **Reduce Positions**: Partially close high-risk positions

---

## Notifications & Alerts

### Alert Types
- **Trading Signals**: New buy/sell recommendations
- **Order Updates**: Order fills, rejections, modifications  
- **Risk Alerts**: Stop loss hits, limit breaches
- **System Notifications**: Maintenance, updates
- **Market Alerts**: Significant market events

### Delivery Methods
1. **In-App Notifications**: Real-time dashboard alerts
2. **Email**: Detailed notifications with charts
3. **SMS**: Critical alerts for urgent actions
4. **Push Notifications**: Mobile app notifications

### Customizing Alerts
1. **Alert Preferences**: Settings → Notifications
2. **Priority Levels**: 
   - Low: In-app only
   - Medium: In-app + email
   - High: All channels
   - Urgent: Immediate SMS + call
3. **Schedule Settings**: Quiet hours, weekend preferences
4. **Filter by Strategy**: Get alerts only for specific strategies

### Smart Alert Features
- **Intelligent Filtering**: Reduce noise, focus on important alerts
- **Consolidation**: Group similar alerts to avoid spam
- **Learning System**: Adapts based on your interaction patterns
- **Snooze Options**: Temporary alert disabling

---

## Advanced Features

### AI-Powered Insights
- **Market Sentiment**: AI analysis of news and social media
- **Earnings Predictions**: ML models for earnings surprises
- **Technical Pattern Recognition**: Automatic chart pattern detection
- **Risk Anomaly Detection**: Unusual portfolio risk patterns

### Backtesting Engine
1. **Historical Testing**: Test strategies on past data
2. **Walk-Forward Analysis**: Rolling strategy optimization
3. **Monte Carlo Simulation**: Risk scenario analysis
4. **Paper Trading**: Practice with real-time data, virtual money

### API Integration
- **Personal API**: Access your data programmatically
- **Webhook Support**: Get real-time updates via webhooks
- **Custom Integrations**: Connect with third-party tools
- **Data Export**: Bulk data download capabilities

### Mobile App Features
- **Native iOS/Android Apps**: Full-featured mobile trading
- **Offline Capabilities**: View portfolios without internet
- **Biometric Login**: Face ID/fingerprint authentication
- **Quick Trade**: Instant order placement

---

## Troubleshooting

### Common Issues

#### Login Problems
**Issue**: Cannot log in to account
**Solutions**:
1. Check email/password spelling
2. Reset password using "Forgot Password"
3. Clear browser cache and cookies
4. Try different browser/incognito mode
5. Contact support if 2FA issues

#### Broker Connection Issues
**Issue**: Broker account shows disconnected
**Solutions**:
1. Re-authorize broker account in settings
2. Check broker account status directly
3. Verify API trading is enabled with broker
4. Contact broker support for API issues

#### Order Execution Problems
**Issue**: Orders not getting executed
**Solutions**:
1. Check available balance in broker account
2. Verify market hours (9:15 AM - 3:30 PM)
3. Check if stock is in trade-to-trade segment
4. Ensure position limits not exceeded

#### Data Feed Issues  
**Issue**: Prices not updating
**Solutions**:
1. Refresh browser page
2. Check internet connection
3. Try different browser
4. Check system status page

### Error Messages

#### "Insufficient Funds"
- **Cause**: Not enough cash in broker account
- **Solution**: Add funds to your broker account or reduce position size

#### "Order Rejected by Exchange"
- **Cause**: Exchange rejected the order (price limits, halt, etc.)
- **Solution**: Check stock status, modify price, or try later

#### "Daily Risk Limit Exceeded"
- **Cause**: Today's losses exceeded your daily limit
- **Solution**: Wait until next trading day or increase limit in settings

#### "Strategy Limit Reached"
- **Cause**: Maximum number of active strategies for your plan
- **Solution**: Deactivate unused strategies or upgrade plan

#### "Training Credits Exhausted"
- **Cause**: Monthly AI training hours limit reached
- **Solution**: Wait for next billing cycle or purchase additional credits

#### "Model Training Failed"
- **Cause**: Insufficient data, invalid parameters, or system error
- **Solution**: Check data quality, adjust parameters, or contact support

#### "Publishing Requirements Not Met"
- **Cause**: Model doesn't meet minimum performance criteria
- **Solution**: Improve model performance or extend backtesting period

### Getting Help

#### Support Channels
1. **In-App Chat**: Click chat icon (bottom right)
2. **Email Support**: support@sharewise.ai
3. **Phone Support**: +91-XXXX-XXXXX (business hours)
4. **Knowledge Base**: help.sharewise.ai

#### Support Hours
- **Chat/Email**: 24/7 automated + business hours human
- **Phone**: Mon-Fri 9 AM - 6 PM IST
- **Emergency**: Critical trading issues only

#### Before Contacting Support
1. **Screenshot**: Capture any error messages
2. **Account Info**: Have your user ID ready
3. **Browser Info**: Note browser type and version
4. **Steps**: List steps to reproduce the issue

---

## Legal & Compliance

### SEBI Compliance
- All algorithmic strategies require broker approval
- Maximum 25% of turnover through algo trading
- Audit trail maintained for all trades
- Real-time risk monitoring mandatory

### Data Privacy
- Personal data encrypted and secured
- Trading data never shared with third parties
- GDPR and Indian privacy law compliant
- Optional data deletion available

### Risk Disclaimers
- Past performance doesn't guarantee future results
- Trading involves substantial risk of loss
- Use only risk capital you can afford to lose
- Consult financial advisor for investment decisions

---

*This manual is updated regularly. Current version: v2.0 - Last updated: January 2025*
*New in v2.0: AI Model Studio, Strategy Marketplace, Advanced ML capabilities*
# ShareWise AI Trading Platform 📈

A comprehensive AI-powered trading platform for the Indian financial markets, featuring advanced analytics, automated trading signals, and broker integrations.

## 🌟 Features

### Core Trading Platform
- **Real-time Trading Signals** - AI-generated buy/sell signals for equity, F&O, and derivatives
- **Multi-Broker Integration** - Support for Zerodha, Angel Broking, Upstox, and ICICI Direct
- **Live Market Data** - Real-time quotes, option chains, and market status
- **Portfolio Management** - Comprehensive portfolio tracking and P&L analysis
- **Advanced Order Types** - Market, Limit, Stop Loss, Bracket, and Algorithmic orders

### AI & Machine Learning
- **AI Studio** - Custom model development and training platform
- **F&O Analytics** - Advanced futures and options analysis
- **Strategy Backtesting** - Historical performance testing
- **Risk Management** - Automated risk assessment and position sizing
- **Market Sentiment Analysis** - News and social sentiment integration

### User Management & Security
- **Tier-based Subscriptions** - Basic, Pro, and Elite plans with different features
- **Role-based Access Control** - Admin, User, and Support roles
- **Advanced Security** - JWT authentication, rate limiting, and audit logging
- **Two-factor Authentication** - Enhanced account security
- **Redis-based Caching** - High-performance data caching and session management

### Administrative Features
- **Admin Portal** - Complete user and system management
- **Analytics Dashboard** - System performance and user behavior analytics
- **Compliance Monitoring** - Trade monitoring and regulatory compliance
- **Support System** - Ticket management and user assistance
- **System Health Monitoring** - Real-time system status and alerts

## 🏗 Technology Stack

### Backend
- **Framework**: Django 5.1.5 with Django REST Framework
- **Database**: PostgreSQL with Redis for caching
- **Real-time**: Django Channels with WebSocket support
- **Task Queue**: Celery with Redis broker
- **Machine Learning**: 
  - Core: scikit-learn, NumPy, pandas
  - Advanced: PyTorch, PyTorch Lightning (for future deep learning features)
  - Financial: yfinance for market data
- **Security**: JWT tokens, cryptography, rate limiting
- **API Documentation**: DRF Spectacular (OpenAPI/Swagger)

### Frontend
- **Framework**: React 18.2.0 with TypeScript
- **UI Library**: Material-UI (MUI) 5.12.0
- **State Management**: Redux Toolkit with Redux Persist
- **Routing**: React Router DOM 6.10.0
- **HTTP Client**: Axios
- **Styling**: Emotion/styled with Inter font family

### Infrastructure
- **Containerization**: Docker with docker-compose
- **Web Server**: Nginx (production)
- **Process Management**: Gunicorn for Django, PM2 for Node.js
- **Monitoring**: Built-in health checks and system monitoring

## 📁 Project Structure

```
ShareWise-AI-DEVnew-repo/
├── backend/                    # Django backend
│   ├── apps/                  # Django applications
│   │   ├── ai_studio/         # ML model development
│   │   ├── analytics/         # Analytics and reporting
│   │   ├── audit/             # Audit logging and compliance
│   │   ├── authentication/    # Auth and user management
│   │   ├── brokers/           # Broker integrations
│   │   ├── market_data/       # Market data services
│   │   ├── monitoring/        # System monitoring
│   │   ├── notifications/     # Email/SMS notifications
│   │   ├── portfolios/        # Portfolio management
│   │   ├── security/          # Security and permissions
│   │   ├── strategies/        # Trading strategies
│   │   ├── subscriptions/     # Subscription management
│   │   ├── system_config/     # System configuration
│   │   ├── trading/           # Core trading functionality
│   │   └── users/             # User profiles and management
│   ├── config/                # Django settings and configuration
│   ├── utils/                 # Shared utilities and Redis integration
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── store/             # Redux store and slices
│   │   └── services/          # API services
│   └── package.json          # Node.js dependencies
├── documentation/            # Project documentation
├── docker-compose.yml       # Docker orchestration
├── nginx.conf              # Nginx configuration
└── setup scripts/          # Database and deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ShareWise-AI-DEVnew-repo
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database setup
createdb sharewise_ai
python manage.py migrate
python manage.py createsuperuser

# Start Redis server
redis-server

# Start backend services
python manage.py runserver
celery -A config worker --loglevel=info
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Docker Setup (Alternative)**
```bash
docker-compose up --build
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/sharewise_ai
REDIS_URL=redis://localhost:6379/0
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Broker API Keys (Optional)
ZERODHA_API_KEY=your-zerodha-key
ANGEL_API_KEY=your-angel-key
UPSTOX_API_KEY=your-upstox-key
```

## 📊 API Documentation

The API is documented using OpenAPI/Swagger and is available at:
- **Local**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/

### Key API Endpoints

- **Authentication**: `/auth/`
- **Trading Signals**: `/api/trading/signals/`
- **Market Data**: `/api/market-data/`
- **Portfolio**: `/api/portfolios/`
- **AI Studio**: `/api/ai-studio/`
- **Admin Portal**: `/admin/`

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Rate limiting on API endpoints
- CORS configuration for cross-origin requests
- SQL injection and XSS protection
- Encrypted sensitive data storage
- Audit logging for all user actions
- Role-based access control

## 🎯 Subscription Tiers

### Basic Plan (₹999/month)
- 5 trading signals per day
- Basic order types (Market, Limit)
- Max order value: ₹10,000
- Email notifications

### Pro Plan (₹2,499/month)
- 20 trading signals per day
- Advanced order types (Stop Loss, Bracket)
- Max order value: ₹50,000
- Real-time data and advanced charts
- Priority support
- Advanced security features

### Elite Plan (₹4,999/month)
- Unlimited signals
- Algorithmic trading
- Max order value: ₹2,00,000
- API access
- Custom ML models
- Dedicated support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/documentation` folder
- **Issues**: Create an issue on GitHub
- **Email**: support@sharewise-ai.com

## 🎉 Acknowledgments

- Django and Django REST Framework communities
- React and Material-UI teams
- Open source ML libraries (scikit-learn, PyTorch)
- Indian financial market data providers

---

**ShareWise AI** - Empowering traders with intelligent market insights 🚀
# ShareWise AI - Universal Algo Trading Platform

## Project Overview

ShareWise AI is a comprehensive SaaS-based algorithmic trading platform designed for the Indian stock market. It provides automated trading capabilities across multiple brokers with AI-powered strategy recommendations and comprehensive risk management.

## Project Structure

```
sharewise-ai/
├── backend/                    # Django REST API Backend
│   ├── config/                # Django settings and configuration
│   ├── apps/                  # Django applications
│   │   ├── authentication/    # User authentication & authorization
│   │   ├── users/            # User management and profiles
│   │   ├── brokers/          # Broker API integrations
│   │   ├── trading/          # Trading engine and signals
│   │   ├── strategies/       # Strategy management
│   │   ├── portfolios/       # Portfolio tracking
│   │   ├── analytics/        # Market analysis and ML
│   │   ├── notifications/    # Alerts and notifications
│   │   └── admin_portal/     # Admin management interfaces
│   ├── requirements/         # Python dependencies
│   ├── scripts/             # Deployment and utility scripts
│   └── tests/               # Test suites
├── frontend/                # React Frontend Application
│   ├── public/              # Static assets
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── store/          # State management (Redux/Zustand)
│   │   └── styles/         # CSS/SCSS styles
│   ├── package.json        # Node.js dependencies
│   └── build/              # Production build files
└── documentation/          # Project documentation
    ├── user-guide/         # End-user documentation
    ├── developer-guide/    # Developer documentation
    ├── database/          # Database schema and models
    └── api/               # API documentation
```

## Key Features

### Core Trading Platform
- Multi-broker integration (Zerodha, AngelOne, Upstox)
- AI-powered strategy recommendations
- Real-time market data analysis
- Automated trade execution
- Comprehensive backtesting engine
- Risk management and alerts

### SaaS Management
- Multi-tenant architecture
- Role-based access control (RBAC)
- Super Admin portal
- Sales team CRM
- Support ticketing system
- Subscription management

### Security & Compliance
- SEBI compliance framework
- Encrypted data storage
- OAuth2 authentication
- API key management
- Audit trails

## Technology Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL 14+
- **Authentication**: OAuth2 with JWT tokens
- **Real-time**: WebSockets via Django Channels
- **Background Tasks**: Celery with Redis
- **ML/AI**: scikit-learn, XGBoost, Prophet, TA-Lib
- **Market Data**: yfinance, broker APIs

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI / Ant Design
- **State Management**: Redux Toolkit / Zustand
- **Charts**: TradingView widget
- **PWA**: Service workers for mobile app experience

### Infrastructure
- **Deployment**: AWS EC2 / Azure VM
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session and data caching
- **Monitoring**: Custom health checks and logging
- **Security**: SSL/TLS, encrypted environment variables

## Getting Started

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements/development.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Documentation**
   - User Guide: `/documentation/user-guide/`
   - Developer Guide: `/documentation/developer-guide/`
   - API Docs: `/documentation/api/`
   - Database Schema: `/documentation/database/`

## Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Code Review**: All changes require peer review
3. **Testing**: Automated tests for all critical functionality
4. **Deployment**: Staged deployment through dev → staging → production

## License & Compliance

This project is proprietary software. All trading algorithms must be approved by respective brokers as per SEBI regulations.
# ShareWise AI - Mobile Application

A comprehensive React Native mobile application for algorithmic trading with AI-powered features.

## Features

### 🔐 Authentication & Security
- Email/Username login with OTP verification
- Biometric authentication (Face ID/Touch ID)
- Secure token management with automatic refresh
- Session management and auto-logout

### 📊 Trading Features
- Real-time trading signals with confidence scores
- Order management (Market, Limit, Stop-Loss orders)
- Portfolio tracking with live P&L
- Position monitoring and management
- Risk management tools
- Performance analytics with charts

### 🧠 AI Model Studio (Pro/Elite tiers)
- Custom ML model creation and training
- Model performance metrics and backtesting
- Strategy marketplace for buying/selling models
- Explainable AI with SHAP integration
- Training job monitoring with progress tracking

### 📈 Market Data
- Live market indices (NIFTY, BANKNIFTY, etc.)
- Customizable watchlist
- Real-time price updates
- Market news and analysis
- Interactive charts with technical indicators

### 📱 Mobile-Specific Features
- Push notifications for trading alerts
- Offline mode for viewing portfolios
- Dark/Light theme support
- Responsive design for all screen sizes
- Gesture-based navigation

## Technology Stack

- **Framework**: React Native 0.72.7
- **Language**: TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation 6
- **UI Library**: React Native Paper (Material Design)
- **Charts**: React Native Chart Kit
- **Authentication**: React Native Biometrics
- **Storage**: AsyncStorage with Redux Persist
- **Networking**: Axios with interceptors
- **Icons**: React Native Vector Icons
- **Animations**: React Native Reanimated

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (LoadingScreen, ErrorBoundary)
│   │   ├── trading/        # Trading-specific components
│   │   ├── portfolio/      # Portfolio components
│   │   └── ai-studio/      # AI Studio components
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── dashboard/     # Dashboard screen
│   │   ├── trading/       # Trading screens
│   │   ├── portfolio/     # Portfolio screens
│   │   ├── ai-studio/     # AI Studio screens
│   │   ├── settings/      # Settings screens
│   │   └── common/        # Common screens (notifications, help)
│   ├── navigation/         # Navigation configuration
│   ├── services/          # API services and utilities
│   ├── store/             # Redux store and slices
│   │   └── slices/        # Feature-specific slices
│   ├── styles/            # Theme and styling
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── android/               # Android-specific code
├── ios/                   # iOS-specific code
└── package.json           # Dependencies and scripts
```

## Installation & Setup

### Prerequisites
- Node.js 16+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup (macOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android Setup**
   - Ensure Android Studio is installed with SDK 28+
   - Create virtual device or connect physical device

### Running the App

#### Development Mode

**Android**
```bash
npm run android
```

**iOS**
```bash
npm run ios
```

**Start Metro Server**
```bash
npm start
```

#### Production Build

**Android**
```bash
npm run build:android
```

**iOS**
```bash
npm run build:ios
```

## Configuration

### Environment Variables
Create `.env` file in the root directory:

```env
API_BASE_URL=https://api.sharewise.ai
WEBSOCKET_URL=wss://api.sharewise.ai/ws
SENTRY_DSN=your_sentry_dsn_here
```

### API Configuration
Update the base URL in `src/services/api.ts`:

```typescript
const BASE_URL = 'https://api.sharewise.ai'; // Your API endpoint
```

## Key Features Implementation

### Authentication Flow
```typescript
// Login with biometric
const handleBiometricLogin = async () => {
  const success = await authService.authenticateWithBiometric();
  if (success) {
    dispatch(loginUser({ biometric: true }));
  }
};
```

### Real-time Updates
```typescript
// Redux slice with real-time data
const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    updateSignal: (state, action) => {
      const index = state.signals.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.signals[index] = { ...state.signals[index], ...action.payload };
      }
    },
  },
});
```

### Push Notifications
```typescript
// Push notification setup
PushNotification.configure({
  onNotification: function(notification) {
    if (notification.data.type === 'TRADING_SIGNAL') {
      navigation.navigate('Trading', { screen: 'SignalDetails', params: { id: notification.data.signalId } });
    }
  },
});
```

## API Integration

The mobile app integrates with the ShareWise AI backend through REST APIs:

- **Authentication**: `/api/users/` endpoints
- **Trading**: `/api/trading/` endpoints
- **Portfolio**: `/api/portfolio/` endpoints
- **AI Studio**: `/api/ai-studio/` endpoints
- **Market Data**: `/api/market/` endpoints

### API Service Example
```typescript
class TradingService {
  async getSignals(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/trading/signals/', { params });
  }

  async executeSignal(id: string): Promise<AxiosResponse> {
    return apiService.post(`/api/trading/signals/${id}/execute/`);
  }
}
```

## State Management

### Redux Store Structure
```typescript
interface RootState {
  auth: AuthState;           // User authentication state
  trading: TradingState;     // Trading signals and orders
  portfolio: PortfolioState; // Portfolio and holdings
  aiStudio: AIStudioState;   // AI models and training jobs
  market: MarketState;       // Market data and watchlist
  notifications: NotificationState;
  settings: SettingsState;   // App preferences
}
```

### Usage Example
```typescript
const MyComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { signals, loading } = useAppSelector(state => state.trading);

  useEffect(() => {
    dispatch(fetchSignals());
  }, [dispatch]);

  return <SignalsList signals={signals} loading={loading} />;
};
```

## Security Features

### Biometric Authentication
- Face ID/Touch ID integration
- Secure key storage in Keychain/Keystore
- Fallback to PIN/password authentication

### API Security
- JWT token-based authentication
- Automatic token refresh
- Request/response interceptors
- Certificate pinning (production)

### Data Security
- Encrypted local storage
- Secure key management
- Auto-logout on inactivity
- Screen recording protection

## Performance Optimizations

### Memory Management
- Image lazy loading with FastImage
- List virtualization for large datasets
- Proper cleanup of event listeners
- Memoized components and selectors

### Network Optimization
- Request caching and deduplication
- Offline data synchronization
- Compression and bundling
- Connection pooling

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# Setup Detox for E2E testing
npm run e2e:ios
npm run e2e:android
```

## Deployment

### App Store Deployment (iOS)
1. Update version in `ios/SharewiseMobile/Info.plist`
2. Build release version: `npm run build:ios`
3. Upload to App Store Connect
4. Submit for review

### Play Store Deployment (Android)
1. Update version in `android/app/build.gradle`
2. Build APK/Bundle: `npm run build:android`
3. Upload to Play Console
4. Submit for review

## Monitoring & Analytics

### Error Tracking
- Sentry integration for crash reporting
- Custom error boundaries
- Performance monitoring

### Analytics
- User behavior tracking
- Trading activity metrics
- App performance metrics

## Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier configuration
- Husky pre-commit hooks
- Conventional commit messages

### Development Workflow
1. Create feature branch
2. Implement changes with tests
3. Run linting and tests
4. Submit pull request
5. Code review and merge

## Troubleshooting

### Common Issues

**Metro bundler issues**
```bash
npx react-native start --reset-cache
```

**iOS build issues**
```bash
cd ios && rm -rf Pods Podfile.lock && pod install
```

**Android build issues**
```bash
cd android && ./gradlew clean && cd ..
```

## Support

For technical support and bug reports:
- Email: mobile-support@sharewise.ai
- GitHub Issues: Create issue with detailed description
- Documentation: https://docs.sharewise.ai/mobile

## License

Copyright © 2025 ShareWise AI. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Minimum OS**: iOS 13.0+ / Android 8.0+ (API 26+)
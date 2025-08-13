import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationSettings {
  pushEnabled: boolean;
  tradingAlerts: boolean;
  marketUpdates: boolean;
  portfolioUpdates: boolean;
  aiStudioUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // in minutes
  requirePinForTrades: boolean;
  sessionTimeout: number; // in minutes
}

interface TradingSettings {
  defaultOrderType: 'MARKET' | 'LIMIT';
  confirmOrders: boolean;
  showRiskWarnings: boolean;
  enablePaperTrading: boolean;
  autoExecuteSignals: boolean;
  minConfidenceThreshold: number;
}

interface DisplaySettings {
  isDarkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showAdvancedCharts: boolean;
  defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '1d';
  showTechnicalIndicators: boolean;
}

interface SettingsState {
  notifications: NotificationSettings;
  security: SecuritySettings;
  trading: TradingSettings;
  display: DisplaySettings;
  language: string;
  currency: string;
  timezone: string;
  firstTimeUser: boolean;
  onboardingCompleted: boolean;
}

const initialState: SettingsState = {
  notifications: {
    pushEnabled: true,
    tradingAlerts: true,
    marketUpdates: true,
    portfolioUpdates: true,
    aiStudioUpdates: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  security: {
    biometricEnabled: false,
    autoLockEnabled: true,
    autoLockTimeout: 5,
    requirePinForTrades: true,
    sessionTimeout: 30,
  },
  trading: {
    defaultOrderType: 'LIMIT',
    confirmOrders: true,
    showRiskWarnings: true,
    enablePaperTrading: false,
    autoExecuteSignals: false,
    minConfidenceThreshold: 0.7,
  },
  display: {
    isDarkMode: false,
    fontSize: 'medium',
    showAdvancedCharts: true,
    defaultTimeframe: '1h',
    showTechnicalIndicators: true,
  },
  language: 'en',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  firstTimeUser: true,
  onboardingCompleted: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
    },
    updateTradingSettings: (state, action: PayloadAction<Partial<TradingSettings>>) => {
      state.trading = { ...state.trading, ...action.payload };
    },
    updateDisplaySettings: (state, action: PayloadAction<Partial<DisplaySettings>>) => {
      state.display = { ...state.display, ...action.payload };
    },
    toggleDarkMode: (state) => {
      state.display.isDarkMode = !state.display.isDarkMode;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    completeOnboarding: (state) => {
      state.firstTimeUser = false;
      state.onboardingCompleted = true;
    },
    resetSettings: (state) => {
      return { ...initialState, firstTimeUser: false, onboardingCompleted: true };
    },
    enableBiometric: (state) => {
      state.security.biometricEnabled = true;
    },
    disableBiometric: (state) => {
      state.security.biometricEnabled = false;
    },
    updatePushNotificationToken: (state, action: PayloadAction<string>) => {
      // This could be used to store the push notification token
      // For now, we just ensure push notifications are enabled
      state.notifications.pushEnabled = true;
    },
  },
});

export const {
  updateNotificationSettings,
  updateSecuritySettings,
  updateTradingSettings,
  updateDisplaySettings,
  toggleDarkMode,
  setLanguage,
  setCurrency,
  setTimezone,
  completeOnboarding,
  resetSettings,
  enableBiometric,
  disableBiometric,
  updatePushNotificationToken,
} = settingsSlice.actions;

export default settingsSlice.reducer;
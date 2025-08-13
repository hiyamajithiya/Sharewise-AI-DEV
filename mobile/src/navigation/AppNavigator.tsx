import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { refreshToken } from '../store/slices/authSlice';
import { theme } from '../styles/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';

// Main App Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TradingScreen from '../screens/trading/TradingScreen';
import PortfolioScreen from '../screens/portfolio/PortfolioScreen';
import AIStudioScreen from '../screens/ai-studio/AIStudioScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Trading Sub-screens
import SignalsScreen from '../screens/trading/SignalsScreen';
import OrdersScreen from '../screens/trading/OrdersScreen';
import PositionsScreen from '../screens/trading/PositionsScreen';
import SignalDetailsScreen from '../screens/trading/SignalDetailsScreen';
import OrderDetailsScreen from '../screens/trading/OrderDetailsScreen';
import ChartScreen from '../screens/trading/ChartScreen';

// Portfolio Sub-screens
import HoldingsScreen from '../screens/portfolio/HoldingsScreen';
import TransactionsScreen from '../screens/portfolio/TransactionsScreen';
import PerformanceScreen from '../screens/portfolio/PerformanceScreen';

// AI Studio Sub-screens
import MyModelsScreen from '../screens/ai-studio/MyModelsScreen';
import MarketplaceScreen from '../screens/ai-studio/MarketplaceScreen';
import TrainingJobsScreen from '../screens/ai-studio/TrainingJobsScreen';
import ModelDetailsScreen from '../screens/ai-studio/ModelDetailsScreen';
import CreateModelScreen from '../screens/ai-studio/CreateModelScreen';

// Settings Sub-screens
import ProfileScreen from '../screens/settings/ProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import TradingSettingsScreen from '../screens/settings/TradingSettingsScreen';

// Common Screens
import NotificationsScreen from '../screens/common/NotificationsScreen';
import WatchlistScreen from '../screens/common/WatchlistScreen';
import NewsScreen from '../screens/common/NewsScreen';
import HelpScreen from '../screens/common/HelpScreen';

// Loading and Error Screens
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const TradingStack = createStackNavigator();
const PortfolioStack = createStackNavigator();
const AIStudioStack = createStackNavigator();
const SettingsStack = createStackNavigator();

// Trading Stack Navigator
const TradingStackNavigator = () => (
  <TradingStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <TradingStack.Screen 
      name="TradingMain" 
      component={TradingScreen} 
      options={{ title: 'Trading' }}
    />
    <TradingStack.Screen 
      name="Signals" 
      component={SignalsScreen}
      options={{ title: 'Trading Signals' }}
    />
    <TradingStack.Screen 
      name="Orders" 
      component={OrdersScreen}
      options={{ title: 'Orders' }}
    />
    <TradingStack.Screen 
      name="Positions" 
      component={PositionsScreen}
      options={{ title: 'Positions' }}
    />
    <TradingStack.Screen 
      name="SignalDetails" 
      component={SignalDetailsScreen}
      options={{ title: 'Signal Details' }}
    />
    <TradingStack.Screen 
      name="OrderDetails" 
      component={OrderDetailsScreen}
      options={{ title: 'Order Details' }}
    />
    <TradingStack.Screen 
      name="Chart" 
      component={ChartScreen}
      options={{ title: 'Chart' }}
    />
  </TradingStack.Navigator>
);

// Portfolio Stack Navigator
const PortfolioStackNavigator = () => (
  <PortfolioStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <PortfolioStack.Screen 
      name="PortfolioMain" 
      component={PortfolioScreen}
      options={{ title: 'Portfolio' }}
    />
    <PortfolioStack.Screen 
      name="Holdings" 
      component={HoldingsScreen}
      options={{ title: 'Holdings' }}
    />
    <PortfolioStack.Screen 
      name="Transactions" 
      component={TransactionsScreen}
      options={{ title: 'Transactions' }}
    />
    <PortfolioStack.Screen 
      name="Performance" 
      component={PerformanceScreen}
      options={{ title: 'Performance' }}
    />
  </PortfolioStack.Navigator>
);

// AI Studio Stack Navigator
const AIStudioStackNavigator = () => (
  <AIStudioStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <AIStudioStack.Screen 
      name="AIStudioMain" 
      component={AIStudioScreen}
      options={{ title: 'AI Studio' }}
    />
    <AIStudioStack.Screen 
      name="MyModels" 
      component={MyModelsScreen}
      options={{ title: 'My Models' }}
    />
    <AIStudioStack.Screen 
      name="Marketplace" 
      component={MarketplaceScreen}
      options={{ title: 'Marketplace' }}
    />
    <AIStudioStack.Screen 
      name="TrainingJobs" 
      component={TrainingJobsScreen}
      options={{ title: 'Training Jobs' }}
    />
    <AIStudioStack.Screen 
      name="ModelDetails" 
      component={ModelDetailsScreen}
      options={{ title: 'Model Details' }}
    />
    <AIStudioStack.Screen 
      name="CreateModel" 
      component={CreateModelScreen}
      options={{ title: 'Create Model' }}
    />
  </AIStudioStack.Navigator>
);

// Settings Stack Navigator
const SettingsStackNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <SettingsStack.Screen 
      name="SettingsMain" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <SettingsStack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <SettingsStack.Screen 
      name="NotificationSettings" 
      component={NotificationSettingsScreen}
      options={{ title: 'Notifications' }}
    />
    <SettingsStack.Screen 
      name="SecuritySettings" 
      component={SecuritySettingsScreen}
      options={{ title: 'Security' }}
    />
    <SettingsStack.Screen 
      name="TradingSettings" 
      component={TradingSettingsScreen}
      options={{ title: 'Trading Settings' }}
    />
  </SettingsStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => {
  const { user } = useAppSelector(state => state.auth);
  const { isDarkMode } = useAppSelector(state => state.settings);

  const tabBarOptions = {
    activeTintColor: theme.colors.primary,
    inactiveTintColor: isDarkMode ? theme.colors.dark.textSecondary : theme.colors.textSecondary,
    style: {
      backgroundColor: isDarkMode ? theme.colors.dark.surface : theme.colors.surface,
      borderTopColor: isDarkMode ? theme.colors.dark.border : theme.colors.border,
      height: theme.dimensions.tabBarHeight,
      paddingBottom: 8,
      paddingTop: 8,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: '500',
    },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Trading':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Portfolio':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'AIStudio':
              iconName = focused ? 'brain' : 'brain';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        ...tabBarOptions,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Trading" 
        component={TradingStackNavigator}
        options={{ title: 'Trading' }}
      />
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioStackNavigator}
        options={{ title: 'Portfolio' }}
      />
      {(user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'ELITE') && (
        <Tab.Screen 
          name="AIStudio" 
          component={AIStudioStackNavigator}
          options={{ title: 'AI Studio' }}
        />
      )}
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
  </Stack.Navigator>
);

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading, user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Refresh token on app start
      dispatch(refreshToken());
    }
  }, [isAuthenticated, user, dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            {/* Modal Screens */}
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Notifications'
              }}
            />
            <Stack.Screen 
              name="Watchlist" 
              component={WatchlistScreen}
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Watchlist'
              }}
            />
            <Stack.Screen 
              name="News" 
              component={NewsScreen}
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Market News'
              }}
            />
            <Stack.Screen 
              name="Help" 
              component={HelpScreen}
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Help & Support'
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

export default AppNavigator;
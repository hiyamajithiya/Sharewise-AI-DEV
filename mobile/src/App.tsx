import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor } from './store';
import AppNavigator from './navigation/AppNavigator';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useAppSelector } from './store/hooks';
import { theme } from './styles/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const ThemedApp: React.FC = () => {
  const { isDarkMode } = useAppSelector(state => state.settings);

  const paperTheme = {
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      surface: isDarkMode ? '#1a1a1a' : '#ffffff',
      background: isDarkMode ? '#121212' : '#f5f5f5',
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={paperTheme.colors.surface}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <ThemedApp />
      </PersistGate>
    </Provider>
  );
};

export default App;
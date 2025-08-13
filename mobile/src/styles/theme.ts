import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#1976D2',
    accent: '#FFC107',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    border: '#E0E0E0',
    placeholder: '#BDBDBD',
    
    // Trading specific colors
    bull: '#4CAF50',
    bear: '#F44336',
    neutral: '#9E9E9E',
    
    // Dark theme colors
    dark: {
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      border: '#333333',
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as 'bold',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as '600',
      lineHeight: 28,
    },
    h4: {
      fontSize: 16,
      fontWeight: '600' as '600',
      lineHeight: 24,
    },
    body1: {
      fontSize: 16,
      fontWeight: 'normal' as 'normal',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: 'normal' as 'normal',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal' as 'normal',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as '600',
      textTransform: 'uppercase' as 'uppercase',
    },
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 50,
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  dimensions: {
    screenWidth: width,
    screenHeight: height,
    headerHeight: 56,
    tabBarHeight: 60,
    buttonHeight: 48,
    inputHeight: 48,
  },
  
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
};

export type Theme = typeof theme;
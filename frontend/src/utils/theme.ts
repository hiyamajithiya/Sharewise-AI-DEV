import { createTheme, Theme } from '@mui/material/styles';
import type { ThemeMode } from '../store/slices/themeSlice';

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 82, 204, 0.2)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #003884 0%, #1565C0 100%)',
          },
        },
        outlined: {
          borderColor: '#0052CC',
          color: '#0052CC',
          '&:hover': {
            backgroundColor: 'rgba(0, 82, 204, 0.04)',
            borderColor: '#003884',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover fieldset': {
              borderColor: '#0052CC',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0052CC',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          fontWeight: 500,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 82, 204, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 82, 204, 0.12)',
            color: '#0052CC',
            '&:hover': {
              backgroundColor: 'rgba(0, 82, 204, 0.16)',
            },
            '& .MuiListItemIcon-root': {
              color: '#0052CC',
            },
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#0052CC',
      light: '#1976D2',
      dark: '#003884',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF4757',
      light: '#FF6B7A',
      dark: '#E73C4E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiCard.styleOverrides.root,
          border: '1px solid #E5E7EB',
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiPaper.styleOverrides.root,
          border: '1px solid #E5E7EB',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          borderRadius: '0px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiTextField.styleOverrides.root,
          '& .MuiOutlinedInput-root': {
            ...baseTheme.components.MuiTextField.styleOverrides.root['& .MuiOutlinedInput-root'],
            '& fieldset': {
              borderColor: '#D1D5DB',
            },
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
      contrastText: '#1F2937',
    },
    secondary: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#EF4444',
      contrastText: '#1F2937',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
    success: {
      main: '#34D399',
      light: '#6EE7B7',
      dark: '#10B981',
    },
    error: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#EF4444',
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#F59E0B',
    },
    info: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
    },
    grey: {
      50: '#1E293B',
      100: '#334155',
      200: '#475569',
      300: '#64748B',
      400: '#94A3B8',
      500: '#CBD5E1',
      600: '#E2E8F0',
      700: '#F1F5F9',
      800: '#F8FAFC',
      900: '#FFFFFF',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiCard.styleOverrides.root,
          border: '1px solid #334155',
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.3), 0px 2px 4px -1px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.4), 0px 4px 6px -2px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiPaper.styleOverrides.root,
          border: '1px solid #334155',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 1px 2px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          borderBottom: '1px solid #334155',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E293B',
          borderRight: '1px solid #334155',
          borderRadius: '0px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          ...baseTheme.components.MuiTextField.styleOverrides.root,
          '& .MuiOutlinedInput-root': {
            ...baseTheme.components.MuiTextField.styleOverrides.root['& .MuiOutlinedInput-root'],
            '& fieldset': {
              borderColor: '#475569',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components.MuiButton.styleOverrides,
        contained: {
          background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          },
        },
        outlined: {
          borderColor: '#60A5FA',
          color: '#60A5FA',
          '&:hover': {
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            borderColor: '#3B82F6',
          },
        },
      },
    },
  },
});

export const getTheme = (mode: ThemeMode): Theme => {
  if (mode === 'auto') {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};
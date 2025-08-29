import { createTheme, Theme, alpha } from '@mui/material/styles';
import type { ThemeMode } from '../store/slices/themeSlice';

// Modern color palette inspired by the login page
const colors = {
  primary: {
    main: '#667eea',
    light: '#7c94ff',
    dark: '#5468d4',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientHover: 'linear-gradient(135deg, #5a67d8 0%, #6b4c96 100%)',
  },
  secondary: {
    main: '#764ba2',
    light: '#8e5fb8',
    dark: '#5e3b82',
  },
  accent: {
    purple: '#9F7AEA',
    indigo: '#5A67D8',
    pink: '#ED64A6',
    teal: '#38B2AC',
    orange: '#F6AD55',
  },
  status: {
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#FC8181',
    info: '#63B3ED',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  dark: {
    bg: '#0F172A',
    bgSecondary: '#1E293B',
    bgTertiary: '#334155',
    border: '#475569',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
  },
};

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
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
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
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
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
};

export const modernLightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.neutral.white,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.neutral.white,
    },
    background: {
      default: colors.neutral.gray50,
      paper: colors.neutral.white,
    },
    text: {
      primary: colors.neutral.gray900,
      secondary: colors.neutral.gray600,
    },
    success: {
      main: colors.status.success,
      light: alpha(colors.status.success, 0.2),
      dark: colors.status.success,
      contrastText: colors.neutral.white,
    },
    error: {
      main: colors.status.error,
      light: alpha(colors.status.error, 0.2),
      dark: colors.status.error,
      contrastText: colors.neutral.white,
    },
    warning: {
      main: colors.status.warning,
      light: alpha(colors.status.warning, 0.2),
      dark: colors.status.warning,
      contrastText: colors.neutral.white,
    },
    info: {
      main: colors.status.info,
      light: alpha(colors.status.info, 0.2),
      dark: colors.status.info,
      contrastText: colors.neutral.white,
    },
    grey: {
      50: colors.neutral.gray50,
      100: colors.neutral.gray100,
      200: colors.neutral.gray200,
      300: colors.neutral.gray300,
      400: colors.neutral.gray400,
      500: colors.neutral.gray500,
      600: colors.neutral.gray600,
      700: colors.neutral.gray700,
      800: colors.neutral.gray800,
      900: colors.neutral.gray900,
      A100: colors.neutral.gray100,
      A200: colors.neutral.gray200,
      A400: colors.neutral.gray400,
      A700: colors.neutral.gray700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: '12px',
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
          },
        },
        contained: {
          background: colors.primary.gradient,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
          '&:hover': {
            background: colors.primary.gradientHover,
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.35)',
          },
        },
        outlined: {
          borderColor: colors.primary.main,
          color: colors.primary.main,
          borderWidth: '2px',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
            borderColor: colors.primary.dark,
            borderWidth: '2px',
          },
        },
        text: {
          color: colors.primary.main,
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          border: `1px solid ${colors.neutral.gray200}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: colors.neutral.white,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: colors.neutral.gray300,
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: colors.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.neutral.gray600,
            '&.Mui-focused': {
              color: colors.primary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '4px 8px',
        },
        colorPrimary: {
          background: alpha(colors.primary.main, 0.1),
          color: colors.primary.main,
          border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
        },
        colorSecondary: {
          background: alpha(colors.secondary.main, 0.1),
          color: colors.secondary.main,
          border: `1px solid ${alpha(colors.secondary.main, 0.2)}`,
        },
        colorSuccess: {
          background: alpha(colors.status.success, 0.1),
          color: colors.status.success,
          border: `1px solid ${alpha(colors.status.success, 0.2)}`,
        },
        colorError: {
          background: alpha(colors.status.error, 0.1),
          color: colors.status.error,
          border: `1px solid ${alpha(colors.status.error, 0.2)}`,
        },
        colorWarning: {
          background: alpha(colors.status.warning, 0.1),
          color: colors.status.warning,
          border: `1px solid ${alpha(colors.status.warning, 0.2)}`,
        },
        colorInfo: {
          background: alpha(colors.status.info, 0.1),
          color: colors.status.info,
          border: `1px solid ${alpha(colors.status.info, 0.2)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral.white,
          color: colors.neutral.gray900,
          borderBottom: `1px solid ${colors.neutral.gray200}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          background: alpha(colors.neutral.white, 0.95),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.neutral.white,
          borderRight: `1px solid ${colors.neutral.gray200}`,
          borderRadius: '0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.main, 0.12),
            color: colors.primary.main,
            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.16),
            },
            '& .MuiListItemIcon-root': {
              color: colors.primary.main,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 500,
          fontSize: '0.95rem',
          minHeight: '48px',
          padding: '12px 16px',
          borderRadius: '12px 12px 0 0',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.08),
          },
          '&.Mui-selected': {
            color: colors.primary.main,
            fontWeight: 600,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: colors.primary.main,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: alpha(colors.status.success, 0.1),
          color: colors.status.success,
          border: `1px solid ${alpha(colors.status.success, 0.2)}`,
        },
        standardError: {
          backgroundColor: alpha(colors.status.error, 0.1),
          color: colors.status.error,
          border: `1px solid ${alpha(colors.status.error, 0.2)}`,
        },
        standardWarning: {
          backgroundColor: alpha(colors.status.warning, 0.1),
          color: colors.status.warning,
          border: `1px solid ${alpha(colors.status.warning, 0.2)}`,
        },
        standardInfo: {
          backgroundColor: alpha(colors.status.info, 0.1),
          color: colors.status.info,
          border: `1px solid ${alpha(colors.status.info, 0.2)}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.neutral.gray800,
          color: colors.neutral.white,
          fontSize: '0.75rem',
          borderRadius: '8px',
          padding: '8px 12px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.neutral.gray200,
        },
      },
    },
  },
});

export const modernDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.light,
      light: '#8ea3ff',
      dark: colors.primary.main,
      contrastText: colors.dark.bg,
    },
    secondary: {
      main: colors.secondary.light,
      light: '#a679ce',
      dark: colors.secondary.main,
      contrastText: colors.dark.bg,
    },
    background: {
      default: colors.dark.bg,
      paper: colors.dark.bgSecondary,
    },
    text: {
      primary: colors.dark.text,
      secondary: colors.dark.textSecondary,
    },
    success: {
      main: colors.status.success,
      light: alpha(colors.status.success, 0.2),
      dark: colors.status.success,
      contrastText: colors.dark.bg,
    },
    error: {
      main: colors.status.error,
      light: alpha(colors.status.error, 0.2),
      dark: colors.status.error,
      contrastText: colors.dark.bg,
    },
    warning: {
      main: colors.status.warning,
      light: alpha(colors.status.warning, 0.2),
      dark: colors.status.warning,
      contrastText: colors.dark.bg,
    },
    info: {
      main: colors.status.info,
      light: alpha(colors.status.info, 0.2),
      dark: colors.status.info,
      contrastText: colors.dark.bg,
    },
    grey: {
      50: colors.dark.bgSecondary,
      100: colors.dark.bgTertiary,
      200: colors.dark.border,
      300: '#64748B',
      400: '#94A3B8',
      500: '#CBD5E1',
      600: '#E2E8F0',
      700: '#F1F5F9',
      800: '#F8FAFC',
      900: colors.neutral.white,
      A100: colors.dark.bgTertiary,
      A200: colors.dark.border,
      A400: '#94A3B8',
      A700: '#F1F5F9',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: '12px',
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
          },
        },
        contained: {
          background: colors.primary.gradient,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          '&:hover': {
            background: colors.primary.gradientHover,
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
          },
        },
        outlined: {
          borderColor: colors.primary.light,
          color: colors.primary.light,
          borderWidth: '2px',
          '&:hover': {
            backgroundColor: alpha(colors.primary.light, 0.15),
            borderColor: colors.primary.light,
            borderWidth: '2px',
          },
        },
        text: {
          color: colors.primary.light,
          '&:hover': {
            backgroundColor: alpha(colors.primary.light, 0.15),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          border: `1px solid ${colors.dark.border}`,
          backgroundColor: colors.dark.bgSecondary,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          backgroundColor: colors.dark.bgSecondary,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: alpha(colors.dark.bgTertiary, 0.5),
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: colors.dark.border,
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: colors.primary.light,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.light,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.dark.textSecondary,
            '&.Mui-focused': {
              color: colors.primary.light,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.dark.bgSecondary, 0.95),
          color: colors.dark.text,
          borderBottom: `1px solid ${colors.dark.border}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.dark.bgSecondary,
          borderRight: `1px solid ${colors.dark.border}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(colors.primary.light, 0.15),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.light, 0.2),
            color: colors.primary.light,
            '&:hover': {
              backgroundColor: alpha(colors.primary.light, 0.25),
            },
            '& .MuiListItemIcon-root': {
              color: colors.primary.light,
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.dark.border,
        },
      },
    },
  },
});

export const getModernTheme = (mode: ThemeMode): Theme => {
  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? modernDarkTheme : modernLightTheme;
  }
  return mode === 'dark' ? modernDarkTheme : modernLightTheme;
};

export { colors };
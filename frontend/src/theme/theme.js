import { createTheme, alpha } from '@mui/material/styles';

const brandColors = {
  primary: '#FF6B00', // Vibrant Premium Orange
  primaryLight: '#FF8533',
  primaryDark: '#E66000',
  secondary: '#1A202C', // Deep Slate for contrast
  secondaryLight: '#2D3748',
  accent: '#FF4500', 
  success: '#10B981', 
  warning: '#F59E0B', 
  error: '#EF4444', 
  info: '#3B82F6', 
};

const lightPalette = {
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    disabled: '#94A3B8',
  },
  divider: 'rgba(226, 232, 240, 0.8)',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary,
      light: brandColors.primaryLight,
      dark: brandColors.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.secondary,
      light: brandColors.secondaryLight,
      contrastText: '#FFFFFF',
    },
    success: { main: brandColors.success },
    warning: { main: brandColors.warning },
    error: { main: brandColors.error },
    info: { main: brandColors.info },
    background: lightPalette.background,
    text: lightPalette.text,
    divider: lightPalette.divider,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' },
    h2: { fontWeight: 800, letterSpacing: '-0.01em', color: '#0F172A' },
    h3: { fontWeight: 700, color: '#0F172A' },
    h4: { fontWeight: 700, color: '#0F172A' },
    h5: { fontWeight: 600, color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
    subtitle1: { fontWeight: 500, color: lightPalette.text.secondary },
    subtitle2: { fontWeight: 500, color: lightPalette.text.secondary },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(19).fill('0 25px 50px -12px rgba(0, 0, 0, 0.25)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: lightPalette.background.default,
          scrollbarWidth: 'thin',
          scrollbarColor: `${brandColors.primary} transparent`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(brandColors.primary, 0.2),
            borderRadius: 3,
            '&:hover': {
              background: alpha(brandColors.primary, 0.4),
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.2)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryLight} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${brandColors.primaryDark} 0%, ${brandColors.primary} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: alpha(brandColors.primary, 0.3),
            boxShadow: `0 12px 20px -5px ${alpha(brandColors.primary, 0.1)}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${lightPalette.divider}`,
          color: '#0F172A',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;

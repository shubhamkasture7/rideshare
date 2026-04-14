import { createTheme, alpha } from '@mui/material/styles';

const brandColors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',
  secondary: '#00CEC9',
  secondaryLight: '#55EFC4',
  accent: '#FD79A8',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  info: '#74B9FF',
};

const darkPalette = {
  background: {
    default: '#0A0E1A',
    paper: '#111827',
    card: '#1A1F35',
    elevated: '#1E2642',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    disabled: '#475569',
  },
  divider: alpha('#94A3B8', 0.12),
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brandColors.primary,
      light: brandColors.primaryLight,
      dark: brandColors.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.secondary,
      light: brandColors.secondaryLight,
      contrastText: '#0A0E1A',
    },
    success: { main: brandColors.success },
    warning: { main: brandColors.warning },
    error: { main: brandColors.error },
    info: { main: brandColors.info },
    background: darkPalette.background,
    text: darkPalette.text,
    divider: darkPalette.divider,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: darkPalette.text.secondary },
    subtitle2: { fontWeight: 500, color: darkPalette.text.secondary },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    `0 1px 3px ${alpha('#000', 0.3)}`,
    `0 4px 6px ${alpha('#000', 0.25)}`,
    `0 8px 15px ${alpha('#000', 0.3)}`,
    `0 12px 25px ${alpha('#000', 0.35)}`,
    `0 16px 35px ${alpha('#000', 0.4)}`,
    ...Array(19).fill(`0 20px 40px ${alpha('#000', 0.45)}`),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(brandColors.primary, 0.3)} transparent`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(brandColors.primary, 0.3),
            borderRadius: 3,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryLight} 100%)`,
          boxShadow: `0 4px 15px ${alpha(brandColors.primary, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${brandColors.primaryDark} 0%, ${brandColors.primary} 100%)`,
            boxShadow: `0 6px 20px ${alpha(brandColors.primary, 0.5)}`,
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${brandColors.secondary} 0%, ${brandColors.secondaryLight} 100%)`,
          boxShadow: `0 4px 15px ${alpha(brandColors.secondary, 0.4)}`,
          '&:hover': {
            boxShadow: `0 6px 20px ${alpha(brandColors.secondary, 0.5)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: darkPalette.background.card,
          border: `1px solid ${alpha('#fff', 0.06)}`,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: `1px solid ${alpha(brandColors.primary, 0.2)}`,
            boxShadow: `0 8px 30px ${alpha(brandColors.primary, 0.1)}`,
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
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: darkPalette.background.paper,
          borderRight: `1px solid ${darkPalette.divider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha(darkPalette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${darkPalette.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
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
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: darkPalette.background.card,
          border: `1px solid ${alpha('#fff', 0.08)}`,
          borderRadius: 16,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            background: alpha(brandColors.primary, 0.15),
            '&:hover': {
              background: alpha(brandColors.primary, 0.2),
            },
          },
        },
      },
    },
  },
});

export default theme;

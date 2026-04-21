import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  alpha,
  useMediaQuery,
  useTheme,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  Dashboard,
  History,
  Person,
  Logout,
  Map,
  Settings,
  DarkMode,
  ChevronLeft,
  Shield,
  AccountBalanceWallet,
} from '@mui/icons-material';
import useAuth from '../features/auth/hooks/useAuth';
import WalletConnect from '../features/blockchain/components/WalletConnect';

const DRAWER_WIDTH = 260;

const riderNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/rider/dashboard' },
  { label: 'Map History', icon: <Map />, path: '/rider/map' },
  { label: 'Ride History', icon: <History />, path: '/rider/history' },
  { label: 'Profile', icon: <Person />, path: '/rider/profile' },
  { label: 'Blockchain', icon: <Shield />, path: '/rider/blockchain', chip: 'Web3' },
];

const driverNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/driver/dashboard' },
  { label: 'Map', icon: <Map />, path: '/driver/dashboard' },
  { label: 'Earnings', icon: <History />, path: '/driver/dashboard' },
  { label: 'Profile', icon: <Person />, path: '/driver/dashboard' },
  { label: 'Blockchain', icon: <Shield />, path: '/driver/blockchain', chip: 'Web3' },
];

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isRider } = useAuth();
  const location = useLocation();

  const navItems = isRider ? riderNav : driverNav;

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 1,
      }}
    >
      {/* Brand Header */}
      <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF8533 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
          }}
        >
          <DirectionsCar sx={{ fontSize: 24, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            RideShare
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Decentralized
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, mb: 1, opacity: 0.6 }} />

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  '&.Mui-selected': {
                    background: alpha('#FF6B00', 0.08),
                    '&:hover': { background: alpha('#FF6B00', 0.12) },
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                    '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 700 },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? 'primary.main' : item.chip ? 'primary.light' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'primary.main' : 'inherit',
                    },
                  }}
                />
                {item.chip && (
                  <Chip
                    label={item.chip}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      background: alpha('#FF6B00', 0.1),
                      color: 'primary.main',
                      border: `1px solid ${alpha('#FF6B00', 0.2)}`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* User Section */}
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            background: alpha('#000', 0.02),
            border: '1px solid',
            borderColor: alpha('#000', 0.05),
            mb: 1.5 
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: isRider ? 'linear-gradient(135deg, #FF6B00, #FF8533)' : 'linear-gradient(135deg, #1A202C, #2D3748)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {user?.name?.[0] || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {user?.role || 'RIDER'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          size="medium"
          color="inherit"
          startIcon={<Logout />}
          onClick={logout}
          sx={{ 
            borderRadius: 3, 
            borderColor: alpha('#000', 0.1),
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'error.main',
              color: 'error.main',
              background: alpha('#EF4444', 0.04),
            }
          }}
        >
          Sign Out
        </Button>
      </Box>

    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            {isRider ? 'Rider' : 'Driver'} Dashboard
          </Typography>
          <Box sx={{ mr: 1 }}>
            <WalletConnect compact />
          </Box>
          <Tooltip title="Dark Mode">
            <IconButton color="inherit">
              <DarkMode />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit">
              <Settings />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          p: { xs: 2, sm: 3 },
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;

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
} from '@mui/icons-material';
import useAuth from '../features/auth/hooks/useAuth';

const DRAWER_WIDTH = 260;

const riderNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/rider/dashboard' },
  { label: 'Map', icon: <Map />, path: '/rider/dashboard' },
  { label: 'Ride History', icon: <History />, path: '/rider/dashboard' },
  { label: 'Profile', icon: <Person />, path: '/rider/dashboard' },
];

const driverNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/driver/dashboard' },
  { label: 'Map', icon: <Map />, path: '/driver/dashboard' },
  { label: 'Earnings', icon: <History />, path: '/driver/dashboard' },
  { label: 'Profile', icon: <Person />, path: '/driver/dashboard' },
];

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
          }}
        >
          <DirectionsCar sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            RideSharing
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Decentralized
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* User Section */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: isRider ? 'primary.main' : 'secondary.main',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {user?.name?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={user?.role || 'RIDER'}
              size="small"
              color={isRider ? 'primary' : 'secondary'}
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
        </Stack>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          color="error"
          startIcon={<Logout />}
          onClick={logout}
          sx={{ borderRadius: 2 }}
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

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  Avatar,
  Grid,
  Divider,
  Switch,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Edit,
  Email,
  Phone,
  CalendarToday,
  AccountBalanceWallet,
  Settings,
  Security,
  Notifications,
  Home,
  Work,
  FitnessCenter,
  AddCircleOutline,
  ChevronRight,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import useAuth from '../../auth/hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-end', gap: 3, position: 'relative' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={user?.avatar}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid #00CEC9',
              boxShadow: '0 0 20px rgba(0, 206, 201, 0.3)',
            }}
          >
            {user?.name?.[0]}
          </Avatar>
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
            size="small"
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Space Grotesk' }}>
              {user?.name?.toUpperCase() || 'USER_01'}
            </Typography>
            <Chip
              label="LEVEL 42 ELITE"
              size="small"
              sx={{
                bgcolor: alpha('#cc97ff', 0.15),
                color: '#cc97ff',
                fontWeight: 700,
                border: '1px solid',
                borderColor: alpha('#cc97ff', 0.3),
                boxShadow: '0 0 10px rgba(204, 151, 255, 0.2)',
              }}
            />
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Decentralized Rider Enthusiast
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Account Info */}
            <GlassCard title="Account Information" icon={<CalendarToday />}>
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Address"
                    secondary={user?.email || 'v01@obsidian.tech'}
                  />
                  <Button size="small">Change</Button>
                </ListItem>
                <Divider sx={{ opacity: 0.05 }} />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Number"
                    secondary={user?.phone || '+1 555-0199'}
                  />
                  <Button size="small">Edit</Button>
                </ListItem>
                <Divider sx={{ opacity: 0.05 }} />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Joined Date"
                    secondary={new Date(user?.createdAt).toLocaleDateString() || 'October 2023'}
                  />
                </ListItem>
              </List>
            </GlassCard>

            {/* Favorite Locations */}
            <GlassCard
              title="Favorite Locations"
              subtitle="Quick access for trips"
              icon={<Home />}
            >
              <List disablePadding>
                <ListItem
                  sx={{ px: 0 }}
                  secondaryAction={
                    <IconButton size="small">
                      <ChevronRight />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ color: 'secondary.main', minWidth: 40 }}>
                    <Home />
                  </ListItemIcon>
                  <ListItemText primary="Home" secondary="Galaxy Apartments, Sector 42" />
                </ListItem>
                <Divider sx={{ opacity: 0.05 }} />
                <ListItem
                  sx={{ px: 0 }}
                  secondaryAction={
                    <IconButton size="small">
                      <ChevronRight />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ color: 'secondary.main', minWidth: 40 }}>
                    <Work />
                  </ListItemIcon>
                  <ListItemText primary="Work" secondary="Tech Hub Tower, Building B" />
                </ListItem>
                <Divider sx={{ opacity: 0.05 }} />
                <ListItem
                  sx={{ px: 0 }}
                  secondaryAction={
                    <IconButton size="small">
                      <ChevronRight />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ color: 'secondary.main', minWidth: 40 }}>
                    <FitnessCenter />
                  </ListItemIcon>
                  <ListItemText primary="Neon Gym" secondary="Underpass Square, Lane 01" />
                </ListItem>
                <Box sx={{ mt: 2 }}>
                  <Button fullWidth variant="outlined" startIcon={<AddCircleOutline />}>
                    Add New Location
                  </Button>
                </Box>
              </List>
            </GlassCard>
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Wallet & Payment */}
            <GlassCard title="Wallet & Payment" icon={<AccountBalanceWallet />}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #1A1F35 0%, #0A0E1A 100%)',
                  border: '1px solid',
                  borderColor: alpha('#cc97ff', 0.2),
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  CURRENT BALANCE
                </Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  ₹420.50
                </Typography>
                <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                  Refill Balance
                </Button>
              </Box>
              <Typography variant="subtitle2" sx={{ mb: 1, px: 1 }}>
                Saved Methods
              </Typography>
              <List disablePadding>
                <ListItem sx={{ px: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>💳</ListItemIcon>
                  <ListItemText primary="Visa ending in 4242" />
                </ListItem>
                <ListItem sx={{ px: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>⚡</ListItemIcon>
                  <ListItemText primary="Google Pay (UPI)" />
                </ListItem>
              </List>
            </GlassCard>

            {/* Settings & Security */}
            <GlassCard title="Security & Notifications" icon={<Security />}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Security fontSize="small" color="primary" />
                    <Typography variant="body2">Two-Factor Auth</Typography>
                  </Stack>
                  <Switch defaultChecked size="small" />
                </Box>
                <Divider sx={{ opacity: 0.05 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Notifications fontSize="small" color="primary" />
                    <Typography variant="body2">Email Notifications</Typography>
                  </Stack>
                  <Switch defaultChecked size="small" />
                </Box>
                <Divider sx={{ opacity: 0.05 }} />
                <Button fullWidth variant="text" sx={{ justifyContent: 'flex-start', color: 'error.main' }}>
                  Deactivate Account
                </Button>
              </Stack>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;

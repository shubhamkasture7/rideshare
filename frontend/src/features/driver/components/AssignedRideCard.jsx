import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  Divider,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  MyLocation,
  Flag,
  Person,
  Star,
  Phone,
  Navigation,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';

const AssignedRideCard = ({ ride, onStartRide, onCompleteRide }) => {
  if (!ride) return null;

  const isAccepted = ride.status === 'ACCEPTED';
  const isOngoing = ride.status === 'ONGOING';

  return (
    <GlassCard
      title="Current Ride"
      icon={<Navigation />}
      gradient={
        isOngoing
          ? 'linear-gradient(135deg, #6C5CE7, #A29BFE)'
          : 'linear-gradient(135deg, #00CEC9, #55EFC4)'
      }
    >
      {/* Status */}
      <Chip
        label={isOngoing ? 'Ride in Progress' : 'Heading to Pickup'}
        color={isOngoing ? 'primary' : 'info'}
        variant="filled"
        sx={{ mb: 2, fontWeight: 600 }}
      />

      {/* Rider Info */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Avatar 
          src={ride.rider?.avatar} 
          sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}
        >
          {ride.rider?.name?.[0] || 'R'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight={600}>
            {ride.rider?.name || 'Rider'}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Star sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="text.secondary">
              {ride.rider?.rating || '4.5'}
            </Typography>
          </Stack>
        </Box>
        <Button 
          variant="outlined" 
          size="small" 
          href={`tel:${ride.rider?.phone}`}
          startIcon={<Phone />} 
          sx={{ borderRadius: 2 }}
        >
          Call
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Route */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: 'success.main',
            mt: 0.8,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography variant="caption" color="text.secondary">
            Pickup
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {ride.pickup?.address || 'Pickup Location'}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '4px' }} />

      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: 1,
            bgcolor: 'error.main',
            mt: 0.8,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography variant="caption" color="text.secondary">
            Drop
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {ride.drop?.address || 'Drop Location'}
          </Typography>
        </Box>
      </Stack>

      {/* Fare */}
      {ride.estimatedFare && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
            textAlign: 'center',
            mb: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Estimated Fare
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            ₹{ride.estimatedFare}
          </Typography>
        </Box>
      )}

      {/* Action Button */}
      {isAccepted && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={onStartRide}
          startIcon={<PlayArrow />}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
            '&:hover': { background: 'linear-gradient(135deg, #5A4BD1, #6C5CE7)' },
          }}
        >
          Start Ride
        </Button>
      )}

      {isOngoing && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          size="large"
          onClick={onCompleteRide}
          startIcon={<CheckCircle />}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #00B894, #55EFC4)',
            '&:hover': { background: 'linear-gradient(135deg, #00A383, #00B894)' },
          }}
        >
          Complete Ride
        </Button>
      )}
    </GlassCard>
  );
};

export default AssignedRideCard;

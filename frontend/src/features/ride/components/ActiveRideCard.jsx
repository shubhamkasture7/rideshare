import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  LinearProgress,
  Avatar,
  Divider,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  DirectionsCar,
  Flag,
  Cancel,
  Phone,
  Star,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import useRide from '../hooks/useRide';
import { RIDE_STATUS } from '../store/rideStore';

const statusConfig = {
  [RIDE_STATUS.REQUESTED]: {
    label: 'Looking for drivers...',
    color: 'warning',
    icon: <Schedule />,
    progress: true,
  },
  [RIDE_STATUS.ACCEPTED]: {
    label: 'Driver on the way',
    color: 'info',
    icon: <DirectionsCar />,
    progress: false,
  },
  [RIDE_STATUS.ONGOING]: {
    label: 'Ride in progress',
    color: 'primary',
    icon: <Flag />,
    progress: false,
  },
  [RIDE_STATUS.COMPLETED]: {
    label: 'Ride completed',
    color: 'success',
    icon: <CheckCircle />,
    progress: false,
  },
  [RIDE_STATUS.CANCELLED]: {
    label: 'Ride cancelled',
    color: 'error',
    icon: <Cancel />,
    progress: false,
  },
};

const ActiveRideCard = () => {
  const { currentRide, rideStatus, cancelRide, resetRide, estimatedFare } = useRide();

  if (!currentRide || rideStatus === RIDE_STATUS.IDLE) return null;

  const config = statusConfig[rideStatus];

  return (
    <GlassCard
      title="Active Ride"
      gradient={`linear-gradient(135deg, ${
        rideStatus === RIDE_STATUS.ONGOING
          ? '#6C5CE7, #A29BFE'
          : rideStatus === RIDE_STATUS.COMPLETED
          ? '#00B894, #55EFC4'
          : '#FDCB6E, #FD79A8'
      })`}
    >
      {/* Status Badge */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          variant="filled"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      {config.progress && (
        <LinearProgress
          color={config.color}
          sx={{ mb: 2, borderRadius: 2, height: 4 }}
        />
      )}

      {/* Route Info */}
      <Box sx={{ mb: 2 }}>
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
              {currentRide.pickup?.address || 'Pickup Location'}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            width: 2,
            height: 20,
            bgcolor: 'divider',
            ml: '4px',
            my: '-4px',
          }}
        />

        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1.5 }}>
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
              {currentRide.drop?.address || 'Drop Location'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Driver Info (after acceptance) */}
      {currentRide.driver && rideStatus !== RIDE_STATUS.REQUESTED && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 44,
                height: 44,
              }}
            >
              {currentRide.driver.name?.[0] || 'D'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {currentRide.driver.name || 'Driver'}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  {currentRide.driver.rating || '4.8'} · {currentRide.driver.vehicle || 'Sedan'}
                </Typography>
              </Stack>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Phone />}
              sx={{ borderRadius: 2 }}
            >
              Call
            </Button>
          </Stack>
        </>
      )}

      {/* Fare Info */}
      {estimatedFare && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Estimated Fare
          </Typography>
          <Typography variant="h5" fontWeight={700} color="primary.light">
            ₹{estimatedFare}
          </Typography>
        </Box>
      )}

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {(rideStatus === RIDE_STATUS.REQUESTED || rideStatus === RIDE_STATUS.ACCEPTED) && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={cancelRide}
            startIcon={<Cancel />}
          >
            Cancel Ride
          </Button>
        )}
        {rideStatus === RIDE_STATUS.COMPLETED && (
          <Button variant="contained" fullWidth onClick={resetRide} startIcon={<CheckCircle />}>
            Done
          </Button>
        )}
        {rideStatus === RIDE_STATUS.CANCELLED && (
          <Button variant="contained" fullWidth onClick={resetRide}>
            Request New Ride
          </Button>
        )}
      </Stack>
    </GlassCard>
  );
};

export default ActiveRideCard;

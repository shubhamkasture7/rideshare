import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Stack,
  Box,
  Avatar,
  Divider,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  MyLocation,
  Flag,
  CheckCircle,
  Close,
  CurrencyRupee,
  Schedule,
  DirectionsWalk,
} from '@mui/icons-material';
import Modal from '../../../components/common/Modal';

const IncomingRideDialog = ({ ride, onAccept, onReject, isLoading }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!ride) {
      setTimeLeft(60);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ride, onReject]);

  if (!ride) return null;

  return (
    <Modal
      open={!!ride}
      title="🚗 New Ride Request"
      onClose={onReject}
    >
      {/* Countdown */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Time to respond
          </Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            color={timeLeft <= 10 ? 'error.main' : 'warning.main'}
          >
            {timeLeft}s
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(timeLeft / 60) * 100}
          color={timeLeft <= 10 ? 'error' : 'warning'}
          sx={{ borderRadius: 2, height: 4 }}
        />
      </Box>

      {/* Rider Info */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar 
          src={ride.rider?.avatar} 
          sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}
        >
          {ride.rider?.name?.[0] || 'R'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {ride.rider?.name || 'Rider'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ⭐ {ride.rider?.rating || '4.8'} rating
          </Typography>
        </Box>
      </Stack>

      {/* Route */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
          mb: 3,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <MyLocation sx={{ color: 'success.main', fontSize: 20, mt: 0.3 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pickup
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {ride.pickup?.address || ride.pickupAddress || 'Pickup Location'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Flag sx={{ color: 'error.main', fontSize: 20, mt: 0.3 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Drop
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {ride.drop?.address || ride.dropAddress || 'Drop Location'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Est info */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
            textAlign: 'center',
          }}
        >
          <CurrencyRupee sx={{ fontSize: 18, color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700} color="success.main">
            ₹{ride.estimatedFare || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Est. Fare
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
            textAlign: 'center',
          }}
        >
          <DirectionsWalk sx={{ fontSize: 18, color: 'info.main' }} />
          <Typography variant="h6" fontWeight={700} color="info.main">
            {ride.pickupDistance?.toFixed(1) || '0.0'} km
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pickup Dist.
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
            textAlign: 'center',
          }}
        >
          <Schedule sx={{ fontSize: 18, color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={700} color="warning.main">
            {ride.estimatedTime || 0} min
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Est. Time
          </Typography>
        </Box>
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          size="large"
          onClick={onReject}
          startIcon={<Close />}
          sx={{ py: 1.5 }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          fullWidth
          size="large"
          onClick={onAccept}
          disabled={isLoading}
          startIcon={<CheckCircle />}
          sx={{
            py: 1.5,
            background: 'linear-gradient(135deg, #00B894, #55EFC4)',
            '&:hover': { background: 'linear-gradient(135deg, #00A383, #00B894)' },
          }}
        >
          Accept
        </Button>
      </Stack>
    </Modal>
  );
};

export default IncomingRideDialog;

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
  alpha,
  Collapse,
} from '@mui/material';
import {
  MyLocation,
  FlagOutlined,
  LocalTaxi,
  Schedule,
  CurrencyRupee,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import useRide from '../hooks/useRide';

const RideRequestPanel = () => {
  const { createRide, isLoading, estimatedFare, estimatedTime, rideStatus } = useRide();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup || !drop) return;

    await createRide({
      pickup: {
        address: pickup,
        lat: 28.6139 + (Math.random() - 0.5) * 0.02,
        lng: 77.209 + (Math.random() - 0.5) * 0.02,
      },
      drop: {
        address: drop,
        lat: 28.6139 + (Math.random() - 0.5) * 0.05,
        lng: 77.209 + (Math.random() - 0.5) * 0.05,
      },
    });
  };

  const isIdle = rideStatus === 'IDLE' || rideStatus === 'COMPLETED' || rideStatus === 'CANCELLED';

  return (
    <GlassCard
      title="Request a Ride"
      icon={<LocalTaxi />}
      gradient="linear-gradient(135deg, #6C5CE7, #A29BFE)"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          placeholder="Pickup location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          required
          disabled={!isIdle}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MyLocation sx={{ color: 'success.main' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          placeholder="Drop location"
          value={drop}
          onChange={(e) => setDrop(e.target.value)}
          required
          disabled={!isIdle}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FlagOutlined sx={{ color: 'error.main' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Collapse in={!!estimatedFare}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip
              icon={<CurrencyRupee sx={{ fontSize: 16 }} />}
              label={`₹${estimatedFare || 0}`}
              variant="outlined"
              color="success"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              icon={<Schedule sx={{ fontSize: 16 }} />}
              label={`${estimatedTime || 0} min`}
              variant="outlined"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Collapse>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isLoading || !isIdle}
          sx={{ py: 1.5 }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Find a Ride'
          )}
        </Button>
      </Box>
    </GlassCard>
  );
};

export default RideRequestPanel;

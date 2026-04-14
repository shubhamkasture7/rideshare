import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Stack,
  alpha,
  Chip,
} from '@mui/material';
import { WifiTethering, WifiTetheringOff } from '@mui/icons-material';

const AvailabilityToggle = ({ isOnline, onToggle, disabled }) => {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: (theme) =>
          isOnline
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.error.main, 0.08),
        border: '1px solid',
        borderColor: isOnline ? 'success.main' : 'divider',
        transition: 'all 0.4s ease',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {isOnline ? (
            <WifiTethering sx={{ color: 'success.main', fontSize: 28 }} />
          ) : (
            <WifiTetheringOff sx={{ color: 'text.secondary', fontSize: 28 }} />
          )}
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isOnline ? 'Receiving ride requests' : 'Not accepting rides'}
            </Typography>
          </Box>
        </Stack>
        <Switch
          checked={isOnline}
          onChange={onToggle}
          disabled={disabled}
          color="success"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'success.main',
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default AvailabilityToggle;

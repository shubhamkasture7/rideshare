import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Collapse,
  alpha,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Shield,
  CheckCircle,
  OpenInNew,
  ExpandMore,
  ExpandLess,
  Receipt,
  Bolt,
  MonetizationOn,
} from '@mui/icons-material';
import useBlockchain from '../useBlockchain';

const ETH_TO_INR = 230000; // Approximate rate for display

const statusConfig = {
  CREATED: { label: 'Escrowed', color: '#FF6B00', icon: <Lock sx={{ fontSize: 14 }} /> },
  ACCEPTED: { label: 'Driver Locked', color: '#3B82F6', icon: <Shield sx={{ fontSize: 14 }} /> },
  STARTED: { label: 'Ride Active', color: '#FF6B00', icon: <Bolt sx={{ fontSize: 14 }} /> },
  COMPLETED: { label: 'Paid Out', color: '#10B981', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  CANCELLED: { label: 'Refunded', color: '#EF4444', icon: <LockOpen sx={{ fontSize: 14 }} /> },
};


const EscrowStatus = ({ rideId, fareInr }) => {
  const { rideOnChain, txHash, txPending, escrowBalance, walletConnected } = useBlockchain();
  const [expanded, setExpanded] = useState(false);

  if (!walletConnected || !rideOnChain) return null;

  const status = statusConfig[rideOnChain.status] || statusConfig.CREATED;
  const fareEth = rideOnChain.fareEth || escrowBalance;
  const fareInrDisplay = fareInr || (fareEth ? Math.round(fareEth * ETH_TO_INR) : 0);

  return (
    <Box
      sx={{
        mt: 2,
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha(status.color, 0.2),
        background: `linear-gradient(135deg, #FFFFFF, ${alpha(status.color, 0.05)})`,
      }}

    >
      {/* Header */}
      <Stack
        direction="row"
        sx={{ px: 2, py: 1.5, cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <MonetizationOn sx={{ fontSize: 18, color: status.color }} />
          <Typography variant="caption" fontWeight={700} color={status.color} textTransform="uppercase" letterSpacing={1}>
            On-Chain Escrow
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={status.icon}
            label={status.label}
            size="small"
            sx={{
              background: alpha(status.color, 0.12),
              color: status.color,
              border: `1px solid ${alpha(status.color, 0.3)}`,
              fontWeight: 700,
              fontSize: '0.65rem',
            }}
          />
          {expanded ? <ExpandLess sx={{ color: 'text.secondary', fontSize: 18 }} /> : <ExpandMore sx={{ color: 'text.secondary', fontSize: 18 }} />}
        </Stack>
      </Stack>

      {txPending && (
        <LinearProgress
          sx={{
            height: 2,
            background: alpha(status.color, 0.1),
            '& .MuiLinearProgress-bar': { background: status.color },
          }}
        />
      )}

      <Collapse in={expanded}>
        <Divider sx={{ borderColor: alpha(status.color, 0.15) }} />
        <Stack spacing={1.5} sx={{ px: 2, py: 2 }}>

          {/* Fare Info */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">Locked Fare</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" fontFamily="monospace" color={status.color} fontWeight={700}>
                {fareEth ? `${fareEth} ETH` : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (≈ ₹{fareInrDisplay})
              </Typography>
            </Stack>
          </Stack>

          {/* Platform Fee */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">Platform Fee</Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              5% of fare
            </Typography>
          </Stack>

          {/* Tx Hash */}
          {txHash && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Tx Hash</Typography>
              <Tooltip title="Copy transaction hash">
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ cursor: 'pointer', alignItems: 'center' }}
                  onClick={() => navigator.clipboard.writeText(txHash)}
                >
                  <Typography variant="caption" fontFamily="monospace" color="text.primary">
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                  </Typography>
                  <OpenInNew sx={{ fontSize: 12, color: 'text.secondary' }} />
                </Stack>
              </Tooltip>
            </Stack>
          )}

          {/* How it works */}
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1.5,
              background: alpha('#FF6B00', 0.04),
              border: `1px solid ${alpha('#FF6B00', 0.1)}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Shield sx={{ fontSize: 16, color: '#FF6B00', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                Your payment is locked in a smart contract. It is{' '}
                <strong style={{ color: '#FF6B00' }}>automatically released</strong> to the driver
                when the ride completes — no middleman, no manual action.
              </Typography>
            </Stack>
          </Box>


          {txPending && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={12} sx={{ color: status.color }} />
              <Typography variant="caption" color={status.color}>
                Transaction pending on blockchain...
              </Typography>
            </Stack>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
};

export default EscrowStatus;

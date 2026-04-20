import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
  Collapse,
  Autocomplete,
  Divider,
  alpha,
} from '@mui/material';
import {
  MyLocation,
  FlagOutlined,
  LocalTaxi,
  Schedule,
  CurrencyRupee,
  AccountBalanceWallet,
  Lock,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import useRide from '../hooks/useRide';
import useBlockchain from '../../blockchain/useBlockchain';
import WalletConnect from '../../blockchain/components/WalletConnect';
import EscrowStatus from '../../blockchain/components/EscrowStatus';
import PlaceAutocomplete from '../../map/components/PlaceAutocomplete';
import useNotificationStore from '../../../store/notificationStore';
import mapService from '../../map/services/mapService';
import useMapPosition from '../../map/hooks/useMapPosition';

// Approximate fare in ETH (for local Hardhat testing: 0.01 ETH ≈ ₹2300)
const FARE_ETH = 0.01;

const RideRequestPanel = () => {
  const {
    createRide,
    isLoading,
    estimatedFare,
    estimatedTime,
    estimatedDistance,
    rideStatus,
    currentRide,
    pickup,
    drop,
    setPickup,
    setDrop,
  } = useRide();

  const {
    walletConnected,
    createRideOnChain,
    txPending,
    rideOnChain,
  } = useBlockchain();

  const { showNotification } = useNotificationStore();
  const { position: currentPos } = useMapPosition();

  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' or 'ETH'
  const [isBlockchainTx, setIsBlockchainTx] = useState(false);
  const lockTriggeredRef = useRef(false);

  // Approximate ETH conversion (Roughly ₹2.5L per ETH)
  const dynamicEthFare = estimatedFare ? (estimatedFare / 250000).toFixed(4) : FARE_ETH;

  const handleUseCurrentLocation = async () => {
    if (!currentPos) {
      showNotification('Unable to get current location. Please check permissions.', 'error');
      return;
    }

    try {
      const results = await mapService.reverseGeocode(currentPos[0], currentPos[1]);
      
      if (results[0]) {
        setPickup({
          address: results[0].formatted_address,
          lat: currentPos[0],
          lng: currentPos[1],
        });
        showNotification('Pickup set to current location', 'success');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showNotification('Failed to get location address: ' + error.message, 'error');
    }
  };

  // Reset trigger when ride is cleared
  useEffect(() => {
    if (rideStatus === 'IDLE' || rideStatus === 'COMPLETED' || rideStatus === 'CANCELLED') {
      lockTriggeredRef.current = false;
    }
  }, [rideStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup || !drop) return;

    if (!walletConnected) {
      showNotification('Wallet connection is required for Trust Escrow on all rides.', 'info');
      return;
    }

    // Generate a unique ID for both Blockchain and Backend
    const rideId = crypto.randomUUID();

    setIsBlockchainTx(true);
    try {
      // Step 1: Secure funds on Ethereum first
      showNotification('Step 1/2: Securing Trust Lock on-chain...', 'info');
      await createRideOnChain(
        rideId,
        pickup.address,
        drop.address,
        parseFloat(dynamicEthFare)
      );

      // Step 2: Once confirmed, broadcast to drivers via Backend
      showNotification('Step 2/2: Broadcasting ride request...', 'success');
      
      const rideData = {
        id: rideId,
        pickup: { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        drop: { address: drop.address, lat: drop.lat, lng: drop.lng },
        paymentMethod,
        estimatedFare,
        estimatedTime,
        distance: estimatedDistance,
      };

      await createRide(rideData);
    } catch (err) {
      console.error('Booking error:', err);
      // createRideOnChain already handles its own notifications
    } finally {
      setIsBlockchainTx(false);
    }
  };

  const isIdle = rideStatus === 'IDLE' || rideStatus === 'COMPLETED' || rideStatus === 'CANCELLED';
  const isBusy = isLoading || txPending || isBlockchainTx;

  const PaymentOption = ({ method, icon, label, sublabel }) => (
    <Box
      onClick={() => isIdle && setPaymentMethod(method)}
      sx={{
        flex: 1,
        p: 1.5,
        cursor: isIdle ? 'pointer' : 'default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: paymentMethod === method ? '#6C5CE7' : alpha('#fff', 0.1),
        background: paymentMethod === method ? alpha('#6C5CE7', 0.1) : 'transparent',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        opacity: isIdle ? 1 : 0.7,
        '&:hover': {
          borderColor: isIdle ? '#6C5CE7' : alpha('#fff', 0.1),
          background: isIdle ? alpha('#6C5CE7', 0.05) : 'transparent',
        }
      }}
    >
      {icon}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{sublabel}</Typography>
    </Box>
  );

  return (
    <GlassCard
      title="Request a Ride"
      icon={<LocalTaxi />}
      gradient="linear-gradient(135deg, #6C5CE7, #A29BFE)"
    >
      {/* Wallet Connection - Mandatory for Trust Lock */}
      <Box sx={{ mb: 2 }}>
        <WalletConnect compact={walletConnected} />
      </Box>

      {isIdle ? (
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <PlaceAutocomplete
              placeholder="Pickup location"
              icon={<MyLocation sx={{ color: 'success.main', ml: 1 }} />}
              value={pickup}
              onChange={setPickup}
              disabled={!isIdle}
              required
              sx={{ '& .MuiInputBase-root': { pr: '80px !important' } }}
            />
            <Button
              size="small"
              startIcon={<MyLocation sx={{ fontSize: '14px !important' }} />}
              onClick={handleUseCurrentLocation}
              sx={{ 
                position: 'absolute', 
                right: 8, 
                top: '50%', 
                transform: 'translateY(-50%)',
                fontSize: '11px',
                height: '28px',
                borderRadius: '14px',
                bgcolor: alpha('#6C5CE7', 0.1),
                zIndex: 2,
                '&:hover': { bgcolor: alpha('#6C5CE7', 0.2) }
              }}
            >
              Current
            </Button>
          </Box>

          <PlaceAutocomplete
            placeholder="Drop location"
            icon={<FlagOutlined sx={{ color: 'error.main', ml: 1 }} />}
            value={drop}
            onChange={setDrop}
            disabled={!isIdle}
            required
            sx={{ mb: 2 }}
          />

          {/* Fare estimate */}
          <Collapse in={!!estimatedFare}>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
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

            {/* Payment Method Selector */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 500 }}>
              Payment Method
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <PaymentOption 
                method="CASH"
                icon={<CurrencyRupee sx={{ color: '#00B894' }} />}
                label="Cash / UPI"
                sublabel="Pay after ride"
              />
              <PaymentOption 
                method="ETH"
                icon={<AccountBalanceWallet sx={{ color: '#A29BFE' }} />}
                label="Ethereum"
                sublabel={`${dynamicEthFare} ETH`}
              />
            </Stack>
          </Collapse>

          {/* Blockchain payment preview - Always show as it's now a mandatory trust lock */}
          {pickup && drop && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                background: alpha('#6C5CE7', 0.06),
                border: `1px solid ${alpha('#6C5CE7', 0.2)}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Lock sx={{ fontSize: 16, color: '#A29BFE' }} />
                <Typography variant="caption" color="text.secondary">
                  <strong style={{ color: '#A29BFE' }}>{dynamicEthFare} ETH</strong> will be 
                  locked as a <strong style={{ color: '#A29BFE' }}>{paymentMethod === 'ETH' ? 'Payment Escrow' : 'Trust Lock'}</strong>.
                </Typography>
              </Stack>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isBusy || !pickup || !drop}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #6C5CE7, #00B894)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5B4BC4, #00A383)',
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Lock sx={{ fontSize: 18 }} />
                <span>
                  {paymentMethod === 'ETH' ? 'Book & Lock Payment' : 'Request with Trust Lock'}
                </span>
              </Stack>
            )}
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          <EscrowStatus />
          {isBlockchainTx && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Securing payment on Ethereum...
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </GlassCard>
  );
};

export default RideRequestPanel;

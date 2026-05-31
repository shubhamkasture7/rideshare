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
// Set fare to 0 for free rides (testing/dev mode)
const FARE_ETH = 0;

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

    // Generate a unique ID for both Blockchain and Backend
    const rideId = crypto.randomUUID();
    const isEthPayment = paymentMethod === 'ETH';

    if (isEthPayment && !walletConnected) {
      showNotification('Wallet connection is required for Ethereum payments.', 'info');
      return;
    }

    setIsBlockchainTx(isEthPayment);
    try {
      if (isEthPayment) {
        // Step 1: Secure funds on Ethereum first
        showNotification('Step 1/2: Securing Trust Lock on-chain...', 'info');
        await createRideOnChain(
          rideId,
          pickup.address,
          drop.address,
          parseFloat(dynamicEthFare)
        );
        showNotification('Step 2/2: Broadcasting ride request...', 'success');
      } else {
        showNotification('Broadcasting ride request...', 'info');
      }
      
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
        borderColor: paymentMethod === method ? '#FF6B00' : alpha('#000', 0.1),
        background: paymentMethod === method ? alpha('#FF6B00', 0.08) : 'transparent',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        opacity: isIdle ? 1 : 0.7,
        '&:hover': {
          borderColor: isIdle ? '#FF6B00' : alpha('#000', 0.1),
          background: isIdle ? alpha('#FF6B00', 0.05) : 'transparent',
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
      icon={<LocalTaxi sx={{ color: '#FF6B00' }} />}
      gradient="linear-gradient(135deg, #FF6B00, #FF8533)"
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
                bgcolor: alpha('#FF6B00', 0.1),
                zIndex: 2,
                '&:hover': { bgcolor: alpha('#FF6B00', 0.2) }
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
                icon={<AccountBalanceWallet sx={{ color: '#FF6B00' }} />}
                label="Ethereum"
                sublabel={`${dynamicEthFare} ETH`}
              />

            </Stack>
          </Collapse>

          {/* Blockchain payment preview - Only show for ETH */}
          {paymentMethod === 'ETH' && pickup && drop && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 3,
                background: alpha('#FF6B00', 0.05),
                border: `1px solid ${alpha('#FF6B00', 0.15)}`,
              }}

            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Lock sx={{ fontSize: 18, color: '#FF6B00' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  <strong style={{ color: '#FF6B00' }}>{dynamicEthFare} ETH</strong> will be 
                  locked as a <strong style={{ color: '#FF6B00' }}>Payment Escrow</strong>.
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
              py: 2,
              borderRadius: 3,
              fontSize: '1rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FF6B00, #FF8533)',
              boxShadow: '0 8px 20px rgba(255, 107, 0, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #E66000, #FF6B00)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 24px rgba(255, 107, 0, 0.35)',
              }
            }}

          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                {paymentMethod === 'ETH' ? <Lock sx={{ fontSize: 18 }} /> : <LocalTaxi sx={{ fontSize: 18 }} />}
                <span>
                  {paymentMethod === 'ETH' ? 'Book & Lock Payment' : 'Request Ride'}
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

import React, { useEffect, useState, useCallback, useRef} from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  alpha,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  LocalTaxi,
  AccessTime,
  Route,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import { MapSkeleton } from '../../../components/common/Skeletons';
import RideRequestPanel from '../../ride/components/RideRequestPanel';
import ActiveRideCard from '../../ride/components/ActiveRideCard';
import MapWrapper from '../../map/components/MapWrapper';
import LiveMarker from '../../map/components/LiveMarker';
import RouteRenderer from '../../map/components/RouteRenderer';
import useMapPosition from '../../map/hooks/useMapPosition';
import useRideStore, { RIDE_STATUS } from '../../ride/store/rideStore';
import useSocket from '../../socket/hooks/useSocket';
import useBlockchain from '../../blockchain/useBlockchain';
import { History, SwapHoriz } from '@mui/icons-material';

// Removed hardcoded statCards placeholder


const RiderDashboard = () => {
  const { position } = useMapPosition();
  const { 
    rideStatus, 
    currentRide, 
    rideHistory, 
    fetchRideHistory,
    setEstimates,
    nearbyDrivers,
    activeDriverPosition
  } = useRideStore();
  
  const { 
    walletConnected, 
    walletAddress, 
    fetchOnChainHistory,
    isCorrectNetwork 
  } = useBlockchain();

  const [blockchainHistory, setBlockchainHistory] = React.useState([]);
  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);

  // Initialize socket events
  const { sendRiderLocationUpdate } = useSocket();

  const isRideActive = rideStatus !== RIDE_STATUS.IDLE;

  const handleRouteCalculated = useCallback((data) => {
    setEstimates(
      Math.round(50 + data.distanceValue * 12),
      Math.round(data.durationValue),
      parseFloat(data.distanceValue.toFixed(1))
    );
  }, [setEstimates]);

  const loadData = React.useCallback(async () => {
    if (isDataLoading) return;
    setIsDataLoading(true);
    try {
      await fetchRideHistory();
      if (walletConnected) {
        const onChain = await fetchOnChainHistory();
        setBlockchainHistory(onChain);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [walletConnected, walletAddress, fetchRideHistory, fetchOnChainHistory]);

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const statCards = React.useMemo(() => {
    const totalRides = rideHistory.length;
    const completedRides = rideHistory.filter(r => r.status === 'COMPLETED').length;
    const totalSpent = rideHistory.reduce((acc, r) => acc + (r.actualFare || r.estimatedFare || 0), 0);
    const totalEth = blockchainHistory.reduce((acc, r) => acc + parseFloat(r.fare || 0), 0);

    return [
      {
        label: 'Total Rides',
        value: totalRides || '0',
        icon: <LocalTaxi />,
        color: '#FF6B00',
      },
      {
        label: 'Total Spent',
        value: `₹${totalSpent.toLocaleString()}`,
        icon: <TrendingUp />,
        color: '#059669',
      },
      {
        label: 'On-Chain',
        value: `${totalEth.toFixed(3)} ETH`,
        icon: <History />,
        color: '#6366F1',
      },
      {
        label: 'Completed',
        value: completedRides || '0',
        icon: <Route />,
        color: '#F59E0B',
      },
    ];
  }, [rideHistory, blockchainHistory]);

  const pickup = useRideStore((s) => s.pickup);
  const drop = useRideStore((s) => s.drop);

  // Update nearby drivers based on current position and periodically
  useEffect(() => {
    if (!position || isRideActive) return;

    // Initial update
    sendRiderLocationUpdate(position);

    // Periodic refresh (every 5 seconds)
    const interval = setInterval(() => {
      sendRiderLocationUpdate(position);
    }, 5000);

    return () => clearInterval(interval);
  }, [position, isRideActive, sendRiderLocationUpdate]);

  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Update bounds to include driver
  useEffect(() => {
    if (!mapRef.current || !activeDriverPosition) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add driver
    bounds.extend({ lat: activeDriverPosition[0], lng: activeDriverPosition[1] });
    
    // Add pickup and drop if they exist
    if (pickup) bounds.extend({ lat: pickup.lat, lng: pickup.lng });
    if (drop) bounds.extend({ lat: drop.lat, lng: drop.lng });
    
    // Fit with some padding
    mapRef.current.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
  }, [activeDriverPosition, pickup, drop]);

  return (
    <Box>
      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
            <GlassCard sx={{ textAlign: 'center', py: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: alpha(stat.color, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Main Area */}
      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <GlassCard
            title="Live Map"
            subtitle={`${nearbyDrivers.length} drivers nearby`}
            sx={{ height: { xs: 400, md: 500 } }}
          >
            {!mapReady ? (
              <MapSkeleton />
            ) : (
              <Box sx={{ height: { xs: 280, md: 380 }, mt: -1 }}>
                <MapWrapper center={position} zoom={14} onLoad={onMapLoad}>
                  {/* Rider marker */}
                  {!pickup && (
                    <LiveMarker
                      position={position}
                      type="rider"
                      popupContent="You are here"
                    />
                  )}

                  {/* Selected Pickup/Drop markers */}
                  {pickup && (
                    <LiveMarker
                      position={[pickup.lat, pickup.lng]}
                      type="pickup"
                      popupContent={pickup.address}
                    />
                  )}
                  {drop && (
                    <LiveMarker
                      position={[drop.lat, drop.lng]}
                      type="drop"
                      popupContent={drop.address}
                    />
                  )}

                  {/* Route renderer */}
                  {pickup && drop && (
                    <RouteRenderer
                      pickup={pickup}
                      drop={drop}
                      onRouteCalculated={handleRouteCalculated}
                    />
                  )}

                  {/* Nearby driver markers */}
                  {nearbyDrivers.map((driver) => (
                    <LiveMarker
                      key={driver.id}
                      position={driver.position}
                      type="driver"
                      popupContent={`${driver.name} — ${driver.vehicle}`}
                      animate
                    />
                  ))}

                  {/* Assigned driver marker */}
                  {currentRide?.driver && activeDriverPosition && (
                    <LiveMarker
                      position={activeDriverPosition}
                      type="driver"
                      popupContent={`${currentRide.driver.name} is on the way`}
                      animate
                    />
                  )}
                </MapWrapper>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Ride Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {!isRideActive && <RideRequestPanel />}
            <ActiveRideCard />
            
            {/* Quick Transactions View */}
            <GlassCard 
              title="RS Transactions" 
              subtitle="Recent on-chain activity"
              icon={<SwapHoriz sx={{ color: '#6366F1' }} />}
            >
              {blockchainHistory.length > 0 ? (
                <Stack spacing={2}>
                  {blockchainHistory.slice(0, 3).map((tx, idx) => (
                    <Box key={idx} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#fff', 0.03), border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                          {parseFloat(tx.fare).toFixed(4)} ETH
                        </Typography>
                        <Chip 
                          label={tx.status === 4 ? 'COMPLETED' : 'LOCKED'} 
                          size="small" 
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: alpha(tx.status === 4 ? '#00B894' : '#FDCB6E', 0.1), color: tx.status === 4 ? '#00B894' : '#FDCB6E' }} 
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                        {new Date(tx.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="caption" sx={{ textAlign: 'center', color: 'primary.main', cursor: 'pointer', mt: 1 }}>
                    View all in Blockchain Tab
                  </Typography>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="caption" color="text.secondary">No on-chain transactions yet.</Typography>
                </Box>
              )}
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiderDashboard;

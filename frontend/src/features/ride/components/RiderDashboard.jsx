import React, { useEffect, useState } from 'react';
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
import useMapPosition from '../../map/hooks/useMapPosition';
import useRideStore, { RIDE_STATUS } from '../../ride/store/rideStore';
import useSocket from '../../socket/hooks/useSocket';

const MOCK_DRIVERS = [
  { id: 'd1', name: 'Rahul S.', position: [28.6160, 77.2115], vehicle: 'Swift Dzire' },
  { id: 'd2', name: 'Priya K.', position: [28.6120, 77.2060], vehicle: 'Wagon R' },
  { id: 'd3', name: 'Amit V.', position: [28.6180, 77.2130], vehicle: 'Honda City' },
  { id: 'd4', name: 'Sunita D.', position: [28.6100, 77.2080], vehicle: 'Hyundai i20' },
  { id: 'd5', name: 'Vikram R.', position: [28.6155, 77.2045], vehicle: 'Maruti Ertiga' },
];

const statCards = [
  {
    label: 'Total Rides',
    value: '24',
    icon: <LocalTaxi />,
    color: '#6C5CE7',
    gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
  },
  {
    label: 'Total Spent',
    value: '₹4,520',
    icon: <TrendingUp />,
    color: '#00CEC9',
    gradient: 'linear-gradient(135deg, #00CEC9, #55EFC4)',
  },
  {
    label: 'Avg. Duration',
    value: '18 min',
    icon: <AccessTime />,
    color: '#FDCB6E',
    gradient: 'linear-gradient(135deg, #FDCB6E, #FD79A8)',
  },
  {
    label: 'Distance',
    value: '156 km',
    icon: <Route />,
    color: '#74B9FF',
    gradient: 'linear-gradient(135deg, #74B9FF, #A29BFE)',
  },
];

const RiderDashboard = () => {
  const { position } = useMapPosition();
  const rideStatus = useRideStore((s) => s.rideStatus);
  const currentRide = useRideStore((s) => s.currentRide);
  const setNearbyDrivers = useRideStore((s) => s.setNearbyDrivers);
  const nearbyDrivers = useRideStore((s) => s.nearbyDrivers);
  const [mapReady, setMapReady] = useState(false);

  // Initialize socket events
  useSocket();

  // Load mock nearby drivers
  useEffect(() => {
    setNearbyDrivers(MOCK_DRIVERS);
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, [setNearbyDrivers]);

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyDrivers(
        MOCK_DRIVERS.map((d) => ({
          ...d,
          position: [
            d.position[0] + (Math.random() - 0.5) * 0.002,
            d.position[1] + (Math.random() - 0.5) * 0.002,
          ],
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [setNearbyDrivers]);

  const isRideActive = rideStatus !== RIDE_STATUS.IDLE;

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
                <MapWrapper center={position} zoom={14}>
                  {/* Rider marker */}
                  <LiveMarker
                    position={position}
                    type="rider"
                    popupContent="You are here"
                  />

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

                  {/* Pickup/Drop markers when ride is active */}
                  {currentRide?.pickup && (
                    <LiveMarker
                      position={[currentRide.pickup.lat, currentRide.pickup.lng]}
                      type="pickup"
                      popupContent={currentRide.pickup.address}
                    />
                  )}
                  {currentRide?.drop && (
                    <LiveMarker
                      position={[currentRide.drop.lat, currentRide.drop.lng]}
                      type="drop"
                      popupContent={currentRide.drop.address}
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
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiderDashboard;

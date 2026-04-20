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
import RouteRenderer from '../../map/components/RouteRenderer';
import useMapPosition from '../../map/hooks/useMapPosition';
import useRideStore, { RIDE_STATUS } from '../../ride/store/rideStore';
import useSocket from '../../socket/hooks/useSocket';

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
  const activeDriverPosition = useRideStore((s) => s.activeDriverPosition);
  const pickup = useRideStore((s) => s.pickup);
  const drop = useRideStore((s) => s.drop);
  const setEstimates = useRideStore((s) => s.setEstimates);
  const [mapReady, setMapReady] = useState(false);

  // Initialize socket events
  useSocket();

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

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
                      onRouteCalculated={(data) => {
                        setEstimates(
                          Math.round(50 + data.distanceValue * 12),
                          Math.round(data.durationValue),
                          parseFloat(data.distanceValue.toFixed(1))
                        );
                      }}
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
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiderDashboard;

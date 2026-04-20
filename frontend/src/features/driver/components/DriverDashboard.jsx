import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  LocalTaxi,
  Speed,
  Star,
} from '@mui/icons-material';
import GlassCard from '../../../components/common/GlassCard';
import { MapSkeleton } from '../../../components/common/Skeletons';
import AvailabilityToggle from './AvailabilityToggle';
import AssignedRideCard from './AssignedRideCard';
import IncomingRideDialog from './IncomingRideDialog';
import MapWrapper from '../../map/components/MapWrapper';
import LiveMarker from '../../map/components/LiveMarker';
import RouteRenderer from '../../map/components/RouteRenderer';
import useDriver from '../hooks/useDriver';
import useSocket from '../../socket/hooks/useSocket';

const DriverDashboard = () => {
  const {
    isOnline,
    currentPosition,
    incomingRide,
    assignedRide,
    earnings,
    rideHistory,
    isLoading,
    toggleOnline,
    acceptRide,
    rejectRide,
    startRide,
    completeRide,
  } = useDriver();

  const [mapReady, setMapReady] = useState(false);

  // Initialize socket events
  useSocket();

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      label: "Today's Earnings",
      value: `₹${earnings.today.toLocaleString()}`,
      icon: <TrendingUp />,
      color: '#00B894',
    },
    {
      label: 'Total Earnings',
      value: `₹${earnings.total.toLocaleString()}`,
      icon: <TrendingUp />,
      color: '#6C5CE7',
    },
    {
      label: 'Rides Done',
      value: rideHistory.length.toString(),
      icon: <LocalTaxi />,
      color: '#FDCB6E',
    },
    {
      label: 'Rating',
      value: '4.9',
      icon: <Star />,
      color: '#FD79A8',
    },
  ];

  return (
    <Box>
      {/* Availability Toggle */}
      <Box sx={{ mb: 3 }}>
        <AvailabilityToggle isOnline={isOnline} onToggle={toggleOnline} />
      </Box>

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
            title="Your Location"
            subtitle={isOnline ? 'Your live position is shared' : 'Go online to start'}
            sx={{ height: { xs: 400, md: 500 } }}
          >
            {!mapReady ? (
              <MapSkeleton />
            ) : (
              <Box sx={{ height: { xs: 280, md: 380 }, mt: -1 }}>
                <MapWrapper center={currentPosition ? [currentPosition.lat, currentPosition.lng] : [28.6139, 77.209]} zoom={15}>
                  {/* Driver marker */}
                  <LiveMarker
                    position={
                      currentPosition
                        ? [currentPosition.lat, currentPosition.lng]
                        : [28.6139, 77.209]
                    }
                    type="driver"
                    popupContent="You are here"
                    animate
                  />

                  {/* Assigned ride markers */}
                  {assignedRide?.pickup && (
                    <LiveMarker
                      position={[assignedRide.pickup.lat, assignedRide.pickup.lng]}
                      type="pickup"
                      popupContent={`Pickup: ${assignedRide.pickup.address}`}
                    />
                  )}
                  {assignedRide?.drop && (
                    <LiveMarker
                      position={[assignedRide.drop.lat, assignedRide.drop.lng]}
                      type="drop"
                      popupContent={`Drop: ${assignedRide.drop.address}`}
                    />
                  )}

                  {/* Route renderer for assigned ride */}
                  {assignedRide?.pickup && assignedRide?.drop && (
                    <RouteRenderer
                      pickup={{ lat: assignedRide.pickup.lat, lng: assignedRide.pickup.lng }}
                      drop={{ lat: assignedRide.drop.lat, lng: assignedRide.drop.lng }}
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
            {assignedRide ? (
              <AssignedRideCard
                ride={assignedRide}
                onStartRide={startRide}
                onCompleteRide={completeRide}
              />
            ) : (
              <GlassCard
                title="Waiting for rides..."
                icon={<LocalTaxi />}
                gradient="linear-gradient(135deg, #00CEC9, #55EFC4)"
              >
                <Typography variant="body2" color="text.secondary">
                  {isOnline
                    ? 'You are online. Incoming rides will appear here.'
                    : 'Go online to start receiving ride requests.'}
                </Typography>
              </GlassCard>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Incoming Ride Dialog */}
      <IncomingRideDialog
        ride={incomingRide}
        onAccept={acceptRide}
        onReject={rejectRide}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default DriverDashboard;

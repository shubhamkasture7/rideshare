import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Update map view when position or ride changes
  useEffect(() => {
    if (!mapRef.current || !currentPosition || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    const pos = { lat: currentPosition.lat, lng: currentPosition.lng };

    if (assignedRide?.pickup && assignedRide?.drop) {
      // Fit all: driver + pickup + drop
      bounds.extend(pos);
      bounds.extend({ lat: assignedRide.pickup.lat, lng: assignedRide.pickup.lng });
      bounds.extend({ lat: assignedRide.drop.lat, lng: assignedRide.drop.lng });
      mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
    } else {
      // Just center on driver
      mapRef.current.panTo(pos);
    }
  }, [currentPosition, assignedRide]);

  // Initialize socket events
  useSocket();

  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      label: "Today's Earnings",
      value: `₹${(earnings?.today || 0).toLocaleString()}`,
      icon: <TrendingUp />,
      color: '#10B981',
    },
    {
      label: 'Total Earnings',
      value: `₹${(earnings?.total || 0).toLocaleString()}`,
      icon: <TrendingUp />,
      color: '#FF6B00',
    },
    {
      label: 'Rides Done',
      value: rideHistory.length.toString(),
      icon: <LocalTaxi />,
      color: '#F59E0B',
    },
    {
      label: 'Rating',
      value: '4.9',
      icon: <Star />,
      color: '#3B82F6',
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
                <MapWrapper 
                  center={currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : { lat: 28.6139, lng: 77.209 }} 
                  zoom={15}
                  onLoad={onMapLoad}
                >
                  {/* Driver marker */}
                  <LiveMarker
                    position={
                      currentPosition
                        ? { lat: currentPosition.lat, lng: currentPosition.lng }
                        : { lat: 28.6139, lng: 77.209 }
                    }
                    type="driver"
                    popupContent="You are here"
                    animate
                  />

                  {/* Assigned ride markers */}
                  {assignedRide?.pickup && (
                    <LiveMarker
                      position={{ lat: assignedRide.pickup.lat, lng: assignedRide.pickup.lng }}
                      type="pickup"
                      popupContent={`Pickup: ${assignedRide.pickup.address}`}
                    />
                  )}
                  {assignedRide?.drop && (
                    <LiveMarker
                      position={{ lat: assignedRide.drop.lat, lng: assignedRide.drop.lng }}
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
                icon={<LocalTaxi sx={{ color: '#FF6B00' }} />}
                gradient="linear-gradient(135deg, #FF6B00, #FF8533)"
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

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  History,
  LocationOn,
  Navigation,
  Refresh,
  ArrowForward,
} from '@mui/icons-material';
import { Polyline } from '@react-google-maps/api';
import MapWrapper from '../../map/components/MapWrapper';
import LiveMarker from '../../map/components/LiveMarker';
import GlassCard from '../../../components/common/GlassCard';
import useRideStore from '../store/rideStore';

const RideHistoryMap = () => {
  const { rideHistory, fetchRideHistory, isLoading, error } = useRideStore();
  const [selectedRide, setSelectedRide] = useState(null);

  useEffect(() => {
    fetchRideHistory();
  }, [fetchRideHistory]);

  const mapCenter = useMemo(() => {
    if (selectedRide) {
      return { lat: selectedRide.pickupLat, lng: selectedRide.pickupLng };
    }
    if (rideHistory.length > 0) {
      return { lat: rideHistory[0].pickupLat, lng: rideHistory[0].pickupLng };
    }
    return { lat: 28.6139, lng: 77.209 }; // New Delhi default
  }, [selectedRide, rideHistory]);

  const handleRideClick = (ride) => {
    setSelectedRide(selectedRide?.id === ride.id ? null : ride);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 2 }}>
      {/* Sidebar: Trip List */}
      <GlassCard
        title="Recent Trips"
        subtitle="Your journey history"
        sx={{ width: 320, display: 'flex', flexDirection: 'column', p: 0 }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            {rideHistory.length} trips found
          </Typography>
          <IconButton size="small" onClick={() => fetchRideHistory()} disabled={isLoading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ opacity: 0.1 }} />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : rideHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, opacity: 0.5 }}>
              <History sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">No trips found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {rideHistory.map((ride) => (
                <ListItem key={ride.id} disablePadding>
                  <ListItemButton
                    selected={selectedRide?.id === ride.id}
                    onClick={() => handleRideClick(ride)}
                    sx={{
                      py: 2,
                      borderLeft: '4px solid',
                      borderColor: selectedRide?.id === ride.id ? 'primary.main' : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={600}>
                            {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            ₹{ride.actualFare || ride.estimatedFare}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Stack spacing={0.5}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', mt: 0.7 }} />
                              <Typography variant="caption" noWrap sx={{ maxWidth: 200, opacity: 0.8 }}>
                                {ride.pickupAddress || 'Pickup Point'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', mt: 0.7 }} />
                              <Typography variant="caption" noWrap sx={{ maxWidth: 200, opacity: 0.8 }}>
                                {ride.dropAddress || 'Drop Point'}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={`${ride.distance || 0} km`}
                              size="small"
                              sx={{ height: 20, fontSize: '10px' }}
                            />
                            <Chip
                              label={ride.status}
                              size="small"
                              variant="outlined"
                              color={ride.status === 'COMPLETED' ? 'success' : 'default'}
                              sx={{ height: 20, fontSize: '10px' }}
                            />
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </GlassCard>

      {/* Main: Map View */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapWrapper center={mapCenter} zoom={selectedRide ? 15 : 12}>
          {rideHistory.map((ride) => {
            const isSelected = selectedRide?.id === ride.id;
            const opacity = selectedRide ? (isSelected ? 1 : 0.3) : 0.8;

            return (
              <React.Fragment key={ride.id}>
                {/* Pickup Marker */}
                <LiveMarker
                  position={{ lat: ride.pickupLat, lng: ride.pickupLng }}
                  type="pickup"
                  label="P"
                  popupContent={isSelected ? `Pickup: ${ride.pickupAddress}` : null}
                  animate={false}
                />
                {/* Drop Marker */}
                <LiveMarker
                  position={{ lat: ride.dropLat, lng: ride.dropLng }}
                  type="drop"
                  label="D"
                  popupContent={isSelected ? `Drop: ${ride.dropAddress}` : null}
                  animate={false}
                />
                {/* Connecting Path */}
                <Polyline
                  path={[
                    { lat: ride.pickupLat, lng: ride.pickupLng },
                    { lat: ride.dropLat, lng: ride.dropLng },
                  ]}
                  options={{
                    strokeColor: isSelected ? '#6C5CE7' : '#74B9FF',
                    strokeOpacity: opacity,
                    strokeWeight: isSelected ? 4 : 2,
                    icons: [
                      {
                        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                        offset: '0',
                        repeat: '20px',
                      },
                    ],
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapWrapper>

        {/* Selected Trip Details Overlay */}
        {selectedRide && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: 500,
            }}
          >
            <GlassCard sx={{ bgcolor: 'rgba(10, 14, 26, 0.9)', backdropFilter: 'blur(12px)', p: 2 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    DATE
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(selectedRide.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ opacity: 0.1 }} />
                <Box>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    DISTANCE
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedRide.distance} km
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ opacity: 0.1 }} />
                <Box>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    FARE
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ₹{selectedRide.actualFare}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={() => setSelectedRide(null)} size="small" sx={{ border: '1px solid currentColor', opacity: 0.5 }}>
                    <ArrowForward sx={{ transform: 'rotate(-90deg)' }} fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
            </GlassCard>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RideHistoryMap;

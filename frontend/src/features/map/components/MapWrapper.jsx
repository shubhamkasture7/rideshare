import React, { useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';
import useNotificationStore from '../../../store/notificationStore';

const LIBRARIES = ['places', 'geometry', 'drawing', 'routes'];
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi
const DEFAULT_ZOOM = 14;

// Premium Night Mode style for Google Maps
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] }
];

const MapWrapper = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  height = '100%',
  sx = {},
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    version: 'weekly', // Use weekly for latest fixes
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
      showNotification(`Map Load Error: ${loadError.message || 'Unknown error'}`, 'error');
    } else if (!apiKey) {
      showNotification('Google Maps API key is missing in .env', 'warning');
    }
    
    // Check if google is loaded but services are missing (auth issues)
    if (isLoaded && window.google) {
      if (!window.google.maps.places) {
        console.warn('Places library not loaded. Check if Places API is enabled.');
      }
    }
  }, [loadError, isLoaded, showNotification, apiKey]);

  const mapCenter = useMemo(() => {
    if (Array.isArray(center)) {
      return { lat: center[0], lng: center[1] };
    }
    return center;
  }, [center]);

  const options = useMemo(() => ({
    styles: DARK_STYLE,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  }), []);

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
  };

  if (loadError) {
    return (
      <Box sx={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0A0E1A', borderRadius: 3, border: '1px solid #2D3748' }}>
        <Typography color="error">Map Loading Failed</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        background: '#0A0E1A',
        ...sx,
      }}
    >
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={zoom}
          options={options}
        >
          {children}
        </GoogleMap>
      ) : (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={40} thickness={4} sx={{ color: '#6C5CE7' }} />
        </Box>
      )}
    </Box>
  );
};

export default MapWrapper;

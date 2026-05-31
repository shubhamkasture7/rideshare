import React, { useEffect, useState, useRef } from 'react';
import { Polyline, useGoogleMap } from '@react-google-maps/api';

const RouteRenderer = ({ pickup, drop, onRouteCalculated }) => {
  const [path, setPath] = useState(null);
  const map = useGoogleMap();
  const lastRequestRef = useRef('');

  useEffect(() => {
    if (!pickup || !drop || !window.google?.maps) {
      setPath(null);
      return;
    }

    const pickupLat = parseFloat(pickup.lat || pickup.latitude);
    const pickupLng = parseFloat(pickup.lng || pickup.longitude);
    const dropLat = parseFloat(drop.lat || drop.latitude);
    const dropLng = parseFloat(drop.lng || drop.longitude);

    if (isNaN(pickupLat) || isNaN(dropLat)) {
      console.warn('Invalid coordinates for route:', { pickup, drop });
      return;
    }

    // Prevent duplicate requests
    const requestKey = `${pickupLat.toFixed(5)},${pickupLng.toFixed(5)}-${dropLat.toFixed(5)},${dropLng.toFixed(5)}`;
    if (lastRequestRef.current === requestKey) return;
    lastRequestRef.current = requestKey;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickupLat, lng: pickupLng },
        destination: { lat: dropLat, lng: dropLng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result.routes.length > 0) {
          const route = result.routes[0];
          const decodedPath = route.overview_path;
          
          setPath(decodedPath);

          // Auto-fit map to show the whole route
          if (map && decodedPath.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            decodedPath.forEach(point => bounds.extend(point));
            map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
          }

          // Report back distance/time
          if (onRouteCalculated) {
            const leg = route.legs[0];
            onRouteCalculated({
              distance: leg.distance.text,
              duration: leg.duration.text,
              distanceValue: leg.distance.value / 1000,
              durationValue: leg.duration.value / 60,
            });
          }
        } else {
          console.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, [pickup, drop, map, onRouteCalculated]);

  if (!path) return null;

  return (
    <Polyline
      path={path}
      options={{
        strokeColor: '#FF6B00', // Vibrant Orange
        strokeWeight: 7,
        strokeOpacity: 0.8,
        geodesic: true,
        zIndex: 50,
      }}
    />
  );
};

export default RouteRenderer;

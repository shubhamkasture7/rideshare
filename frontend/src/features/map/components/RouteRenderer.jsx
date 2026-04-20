import React, { useEffect, useState, useRef } from 'react';
import { Polyline, useGoogleMap } from '@react-google-maps/api';

const RouteRenderer = ({ pickup, drop, onRouteCalculated }) => {
  const [path, setPath] = useState(null);
  const map = useGoogleMap();
  const lastRequestRef = useRef('');

  useEffect(() => {
    if (!pickup?.lat || !drop?.lat || !window.google) {
      setPath(null);
      return;
    }

    // Prevent duplicate requests for same coordinates
    const requestKey = `${pickup.lat},${pickup.lng}-${drop.lat},${drop.lng}`;
    if (lastRequestRef.current === requestKey) return;

    const calculateRouteLegacy = (start, end) => {
      if (!window.google?.maps?.DirectionsService) return;
      const service = new window.google.maps.DirectionsService();
      service.route({
        origin: { lat: parseFloat(start.lat), lng: parseFloat(start.lng) },
        destination: { lat: parseFloat(end.lat), lng: parseFloat(end.lng) },
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result.routes.length > 0) {
          const route = result.routes[0];
          setPath(route.overview_path);
          if (onRouteCalculated) {
            const leg = route.legs[0];
            onRouteCalculated({
              distance: leg.distance.text,
              duration: leg.duration.text,
              distanceValue: leg.distance.value / 1000,
              durationValue: leg.duration.value / 60,
            });
          }
          if (map && route.overview_path.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            route.overview_path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
          }
        }
      });
    };

    const calculateRoute = async () => {
      try {
        let routesLib = window.google?.maps?.routes;
        if (!routesLib && window.google?.maps?.importLibrary) {
          routesLib = await window.google.maps.importLibrary("routes");
        }

        if (routesLib?.Route) {
          const request = {
            origin: { location: { latLng: { lat: parseFloat(pickup.lat), lng: parseFloat(pickup.lng) } } },
            destination: { location: { latLng: { lat: parseFloat(drop.lat), lng: parseFloat(drop.lng) } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
          };

          const response = await routesLib.Route.computeRoutes(request);
          if (response?.routes?.length > 0) {
            const route = response.routes[0];
            lastRequestRef.current = requestKey;
            const encodedPolyline = route.polyline?.encodedPolyline || route.polyline?.encoded_polyline;
            
            if (encodedPolyline && window.google?.maps?.geometry?.encoding) {
              const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
              setPath(decodedPath);
              if (map && decodedPath.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                decodedPath.forEach(point => bounds.extend(point));
                map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
              }
              if (onRouteCalculated) {
                let durationSeconds = 0;
                if (typeof route.duration === 'string') {
                  durationSeconds = parseInt(route.duration.replace('s', '')) || 0;
                } else if (typeof route.duration === 'number') {
                  durationSeconds = route.duration;
                }
                onRouteCalculated({
                  distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
                  duration: `${Math.round(durationSeconds / 60)} min`,
                  distanceValue: route.distanceMeters / 1000,
                  durationValue: durationSeconds / 60,
                });
              }
              return;
            }
          }
        }
        calculateRouteLegacy(pickup, drop);
      } catch (error) {
        calculateRouteLegacy(pickup, drop);
      }
    };

    calculateRoute();
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, onRouteCalculated, map]);

  if (!path) return null;

  return (
    <Polyline
      path={path}
      options={{
        strokeColor: '#6C5CE7',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        geodesic: true,
      }}
    />
  );
};

export default RouteRenderer;

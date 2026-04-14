import { useState, useEffect, useCallback } from 'react';

const DEFAULT_POSITION = [28.6139, 77.209];

const useMapPosition = (trackRealTime = false) => {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setError(null);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError(err.message);
        // Fall back to default
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  useEffect(() => {
    if (!trackRealTime || !navigator.geolocation) return;

    setIsTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn('Watch error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [trackRealTime]);

  return { position, error, isTracking, refreshPosition: getCurrentPosition };
};

export default useMapPosition;
